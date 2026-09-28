// 🔧 CÓDIGO PRONTO PARA IMPLEMENTAR
// Copiar e adaptar diretamente para o teu projeto

// ============================================================================
// 1️⃣ SERVICE: Provider Commission Service
// ============================================================================
// Ficheiro: src/modules/providers/providerCommissionService.ts

import { db } from \"../../../db\";
import { 
  paymentReferences, 
  invoices, 
  hotelBookings,
  eventBookings,
  bookings,
  users,
  commission_notifications 
} from \"../../../shared/schema\";
import { eq, and, desc } from \"drizzle-orm\";

export interface CommissionData {
  paymentMethod: 'bank_transfer' | 'mpesa' | 'cash';
  paymentReference: string;
  proofImageUrl?: string;
  notes?: string;
}

// Obter comissões do provedor
export const getProviderCommissions = async (
  providerId: string,
  providerType: 'driver' | 'hotel' | 'event_space'
) => {
  try {
    const commissions = await db
      .select({
        id: paymentReferences.id,
        reference_number: paymentReferences.reference_number,
        booking_id: paymentReferences.booking_id,
        booking_type: paymentReferences.booking_type,
        gross_amount: paymentReferences.gross_amount,
        fee_amount: paymentReferences.fee_amount,
        net_amount: paymentReferences.net_amount,
        status: paymentReferences.status,
        service_date: paymentReferences.service_date,
        due_date: paymentReferences.due_date,
        payment_method: paymentReferences.payment_method,
        payment_proof_url: paymentReferences.payment_proof_url,
        created_at: paymentReferences.created_at,
      })
      .from(paymentReferences)
      .where(
        and(
          eq(paymentReferences.provider_user_id, providerId),
          eq(paymentReferences.booking_type, 
            providerType === 'driver' ? 'ride' : 
            providerType === 'hotel' ? 'hotel' : 'event'
          )
        )
      )
      .orderBy(desc(paymentReferences.created_at));

    return commissions;
  } catch (error) {
    console.error('Erro ao obter comissões:', error);
    throw error;
  }
};

// Provider submete pagamento com comprovante
export const submitCommissionPayment = async (
  paymentId: string,
  providerId: string,
  data: CommissionData
) => {
  try {
    // 1. Verificar se payment pertence ao provider
    const payment = await db
      .select()
      .from(paymentReferences)
      .where(
        and(
          eq(paymentReferences.id, paymentId),
          eq(paymentReferences.provider_user_id, providerId)
        )
      )
      .limit(1);

    if (!payment.length) {
      throw new Error('Pagamento não encontrado ou não pertence a este provedor');
    }

    // 2. Atualizar payment_references com comprovante
    await db.update(paymentReferences)
      .set({
        status: 'submitted', // ⚠️ Se usar 'submitted', precisa enum no schema
        payment_method: data.paymentMethod,
        payment_proof_url: data.proofImageUrl || null,
        notes: data.notes || null,
        updated_at: new Date()
      })
      .where(eq(paymentReferences.id, paymentId));

    // 3. Notificar admin
    await db.insert(commission_notifications)
      .values({
        payment_id: paymentId,
        provider_id: providerId,
        type: 'payment_submitted',
        message: `Novo comprovante de pagamento enviado - Ref: ${payment[0].reference_number}`,
        read: false
      });

    return { 
      success: true, 
      message: 'Comprovante enviado com sucesso. Aguardando verificação do admin.' 
    };
  } catch (error) {
    console.error('Erro ao submeter pagamento:', error);
    throw error;
  }
};

// Obter notificações do provider
export const getProviderNotifications = async (providerId: string) => {
  try {
    const notifications = await db
      .select()
      .from(commission_notifications)
      .where(eq(commission_notifications.provider_id, providerId))
      .orderBy(desc(commission_notifications.created_at));

    return notifications;
  } catch (error) {
    console.error('Erro ao obter notificações:', error);
    throw error;
  }
};

// ============================================================================
// 2️⃣ SERVICE: Admin Commission Service
// ============================================================================
// Adicionar a: src/modules/admin/adminService.ts

export class AdminService {
  // ... métodos existentes ...

  // Admin aprova pagamento
  async verifyCommissionPayment(
    paymentId: string,
    adminId: string,
    notes?: string
  ) {
    try {
      const payment = await db
        .select()
        .from(paymentReferences)
        .where(eq(paymentReferences.id, paymentId))
        .limit(1);

      if (!payment.length) {
        throw new Error('Pagamento não encontrado');
      }

      // Atualizar para 'paid'
      await db.update(paymentReferences)
        .set({
          status: 'paid',
          paid_at: new Date(),
          confirmed_by: adminId,
          notes: notes || null,
          updated_at: new Date()
        })
        .where(eq(paymentReferences.id, paymentId));

      // Notificar provider
      await db.insert(commission_notifications)
        .values({
          payment_id: paymentId,
          provider_id: payment[0].provider_user_id,
          type: 'payment_verified',
          message: `Pagamento verificado e confirmado! Valor: ${payment[0].net_amount} MZN`,
          read: false
        });

      await this.logAdminAction(adminId, 'verify_commission', paymentId, {
        reference: payment[0].reference_number,
        amount: payment[0].net_amount
      });

      return { success: true, message: 'Pagamento verificado com sucesso' };
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      throw error;
    }
  }

  // Admin rejeita pagamento
  async rejectCommissionPayment(
    paymentId: string,
    adminId: string,
    reason: string
  ) {
    try {
      const payment = await db
        .select()
        .from(paymentReferences)
        .where(eq(paymentReferences.id, paymentId))
        .limit(1);

      if (!payment.length) {
        throw new Error('Pagamento não encontrado');
      }

      // Voltar para 'pending' (provider resubmete)
      await db.update(paymentReferences)
        .set({
          status: 'pending',
          confirmed_by: adminId,
          notes: reason,
          updated_at: new Date()
        })
        .where(eq(paymentReferences.id, paymentId));

      // Notificar provider com motivo
      await db.insert(commission_notifications)
        .values({
          payment_id: paymentId,
          provider_id: payment[0].provider_user_id,
          type: 'payment_rejected',
          message: `Pagamento rejeitado. Motivo: ${reason}. Por favor, reenvie o comprovante.`,
          read: false
        });

      await this.logAdminAction(adminId, 'reject_commission', paymentId, {
        reference: payment[0].reference_number,
        reason
      });

      return { success: true, message: 'Pagamento rejeitado. Provider notificado.' };
    } catch (error) {
      console.error('Erro ao rejeitar pagamento:', error);
      throw error;
    }
  }

  // Obter pagamentos pendentes verificação
  async getPendingVerifications(filters?: {
    provider_type?: string;
    status?: string;
  }) {
    try {
      let query = db
        .select({
          id: paymentReferences.id,
          reference_number: paymentReferences.reference_number,
          booking_type: paymentReferences.booking_type,
          provider_user_id: paymentReferences.provider_user_id,
          gross_amount: paymentReferences.gross_amount,
          net_amount: paymentReferences.net_amount,
          fee_amount: paymentReferences.fee_amount,
          payment_method: paymentReferences.payment_method,
          payment_proof_url: paymentReferences.payment_proof_url,
          status: paymentReferences.status,
          created_at: paymentReferences.created_at,
          provider_name: users.fullName,
          provider_email: users.email,
        })
        .from(paymentReferences)
        .leftJoin(users, eq(paymentReferences.provider_user_id, users.id));

      // Filtrar por status = 'submitted' (ou 'pending' se quiser)
      query = query.where(
        eq(paymentReferences.status, filters?.status || 'submitted')
      );

      const results = await query.orderBy(desc(paymentReferences.created_at));
      return results;
    } catch (error) {
      console.error('Erro ao obter pagamentos pendentes:', error);
      throw error;
    }
  }
}

// ============================================================================
// 3️⃣ ROUTES: Provider Commission Routes
// ============================================================================
// Ficheiro: src/modules/providers/index.ts

import express from 'express';
import { requireAuth } from '../../middleware/auth';
import * as commissionService from './providerCommissionService';

const router = express.Router();

// ✅ GET comissões do provider
router.get('/me/commissions', requireAuth, async (req, res) => {
  try {
    const providerId = req.user?.uid;
    const providerType = req.query.type || 'driver'; // driver, hotel, event_space

    if (!providerId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const commissions = await commissionService.getProviderCommissions(
      providerId,
      providerType as any
    );

    res.json({
      success: true,
      data: commissions
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ✅ Provider submete pagamento com comprovante
router.post('/me/commissions/:paymentId/submit', requireAuth, async (req, res) => {
  try {
    const providerId = req.user?.uid;
    const { paymentId } = req.params;
    const { paymentMethod, paymentReference, proofImageUrl, notes } = req.body;

    if (!providerId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const result = await commissionService.submitCommissionPayment(
      paymentId,
      providerId,
      {
        paymentMethod,
        paymentReference,
        proofImageUrl,
        notes
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ✅ GET notificações do provider
router.get('/me/notifications', requireAuth, async (req, res) => {
  try {
    const providerId = req.user?.uid;

    if (!providerId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const notifications = await commissionService.getProviderNotifications(providerId);

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;

// ============================================================================
// 4️⃣ ROUTES: Admin Commission Routes
// ============================================================================
// Adicionar a: src/modules/admin/index.ts

// ✅ GET pagamentos pendentes verificação
app.get('/api/admin/commissions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const adminService = new AdminService();
    const pending = await adminService.getPendingVerifications({
      status: 'submitted'
    });

    res.json({
      success: true,
      data: pending
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ✅ Admin aprova pagamento
app.post('/api/admin/commissions/:paymentId/verify', requireAuth, requireAdmin, async (req, res) => {
  try {
    const adminService = new AdminService();
    const { paymentId } = req.params;
    const { notes } = req.body;
    const adminId = req.user?.uid;

    const result = await adminService.verifyCommissionPayment(
      paymentId,
      adminId,
      notes
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ✅ Admin rejeita pagamento
app.post('/api/admin/commissions/:paymentId/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const adminService = new AdminService();
    const { paymentId } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.uid;

    if (!reason) {
      return res.status(400).json({ error: 'Motivo da rejeição é obrigatório' });
    }

    const result = await adminService.rejectCommissionPayment(
      paymentId,
      adminId,
      reason
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// 5️⃣ SCHEMA UPDATE
// ============================================================================
// Adicionar a: shared/schema.ts

import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';

// ⬇️ ADICIONAR ISTO:
export const commission_notifications = pgTable('commission_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  payment_id: uuid('payment_id')
    .notNull()
    .references(() => paymentReferences.id, { onDelete: 'cascade' }),
  provider_id: text('provider_id')
    .notNull()
    .references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(),
  // 'payment_submitted', 'payment_verified', 'payment_rejected'
  message: text('message').notNull(),
  read: boolean('read').default(false),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  provider_idx: index('idx_notifications_provider').on(table.provider_id),
  unread_idx: index('idx_notifications_unread').on(table.provider_id, table.read),
}));

export type CommissionNotification = typeof commission_notifications.$inferSelect;

// ============================================================================
// 6️⃣ ELECTRON UPDATE (Para alterar Status de 'pending' para 'submitted')
// ============================================================================

// IMPORTANTE: Se usares 'submitted' como novo status, atualiza o enum no schema:

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'submitted', // ← NOVO
  'paid',
  'processing',
  'failed',
  'refunded',
  'cancelled',
  'expired',
  'partial'
]);

// Depois, muda o tipo da coluna no banco:
// ALTER TYPE payment_status ADD VALUE 'submitted';

// ============================================================================
// 7️⃣ FILE UPLOAD SERVICE (Para comprovantes)
// ============================================================================
// Ficheiro: src/modules/files/fileService.ts

import * as admin from 'firebase-admin';

export const uploadPaymentProof = async (
  file: Express.Multer.File,
  paymentId: string
): Promise<string> => {
  try {
    if (!file) {
      throw new Error('Nenhum ficheiro fornecido');
    }

    // Validar tipo
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error('Tipo de ficheiro não permitido. Use JPG, PNG, WebP ou PDF.');
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Ficheiro muito grande. Máximo 5MB.');
    }

    // Upload para Firebase Storage
    const bucket = admin.storage().bucket();
    const filePath = `payment-proofs/${paymentId}/${Date.now()}-${file.originalname}`;
    const fileRef = bucket.file(filePath);

    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Obter URL pública
    const [url] = await fileRef.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000), // 1 ano
    });

    return url;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
};

// ============================================================================
// 8️⃣ FRONTEND: React Component (Provider App)
// ============================================================================
// Ficheiro: src/components/CommissionList.tsx

import React, { useState, useEffect } from 'react';
import api from '@/services/api';

export const CommissionList = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      const response = await api.get('/api/providers/me/commissions');
      setCommissions(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);

    try {
      // 1. Upload comprovante
      let proofUrl = null;
      const proofFile = formData.get('proof') as File;
      if (proofFile && proofFile.size > 0) {
        const fileFormData = new FormData();
        fileFormData.append('file', proofFile);

        const uploadRes = await api.post('/api/files/upload', fileFormData);
        proofUrl = uploadRes.data.url;
      }

      // 2. Submeter pagamento
      await api.post(`/api/providers/me/commissions/${selectedPayment.id}/submit`, {
        paymentMethod: formData.get('paymentMethod'),
        paymentReference: formData.get('paymentReference'),
        proofImageUrl: proofUrl,
        notes: formData.get('notes'),
      });

      alert('✅ Comprovante enviado com sucesso!');
      setShowModal(false);
      loadCommissions();
    } catch (error) {
      alert('❌ Erro: ' + (error as any).message);
    }
  };

  return (
    <div className=\"p-4\">
      <h1 className=\"text-2xl font-bold mb-4\">Minhas Comissões</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : commissions.length === 0 ? (
        <p className=\"text-gray-500\">Nenhuma comissão pendente</p>
      ) : (
        <div className=\"space-y-4\">
          {commissions.map((c: any) => (
            <div key={c.id} className=\"border rounded p-4 flex justify-between items-center\">
              <div>
                <p className=\"font-mono text-sm\">{c.reference_number}</p>
                <p className=\"text-lg font-bold\">{c.net_amount} MZN</p>
                <p className=\"text-sm text-gray-500\">
                  Vencimento: {new Date(c.due_date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <span className={`px-3 py-1 rounded text-white ${
                  c.status === 'paid' ? 'bg-green-500' :
                  c.status === 'submitted' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {c.status === 'paid' ? '✅ Pago' :
                   c.status === 'submitted' ? '⏳ Aguardando' :
                   '🔴 Pendente'}
                </span>

                {c.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedPayment(c);
                      setShowModal(true);
                    }}
                    className=\"mt-2 bg-blue-500 text-white px-4 py-2 rounded\"
                  >
                    Enviar Comprovante
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className=\"fixed inset-0 bg-black/50 flex items-center justify-center\">
          <div className=\"bg-white p-6 rounded-lg w-96\">
            <h2 className=\"text-xl font-bold mb-4\">Enviar Comprovante</h2>

            <form onSubmit={submitPayment} className=\"space-y-4\">
              <div>
                <label className=\"block text-sm mb-1\">Método de Pagamento</label>
                <select
                  name=\"paymentMethod\"
                  required
                  className=\"w-full border rounded p-2\"
                >
                  <option>bank_transfer</option>
                  <option>mpesa</option>
                  <option>cash</option>
                </select>
              </div>

              <div>
                <label className=\"block text-sm mb-1\">Referência</label>
                <input
                  type=\"text\"
                  name=\"paymentReference\"
                  placeholder=\"Ex: TREF-123456\"
                  required
                  className=\"w-full border rounded p-2\"
                />
              </div>

              <div>
                <label className=\"block text-sm mb-1\">Comprovante</label>
                <input
                  type=\"file\"
                  name=\"proof\"
                  accept=\"image/*,.pdf\"
                  className=\"w-full\"
                />
              </div>

              <div>
                <label className=\"block text-sm mb-1\">Notas</label>
                <textarea
                  name=\"notes\"
                  className=\"w-full border rounded p-2\"
                  rows={3}
                />
              </div>

              <div className=\"flex gap-2\">
                <button
                  type=\"button\"
                  onClick={() => setShowModal(false)}
                  className=\"flex-1 border rounded p-2\"
                >
                  Cancelar
                </button>
                <button
                  type=\"submit\"
                  className=\"flex-1 bg-blue-500 text-white rounded p-2\"
                >
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 9️⃣ FRONTEND: Admin Dashboard Component
// ============================================================================
// Ficheiro: src/components/admin/CommissionVerification.tsx

import React, { useState, useEffect } from 'react';
import api from '@/services/api';

export const CommissionVerification = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const response = await api.get('/api/admin/commissions');
      setPending(response.data.data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (paymentId: string) => {
    try {
      await api.post(`/api/admin/commissions/${paymentId}/verify`);
      alert('✅ Pagamento aprovado!');
      loadPending();
    } catch (error) {
      alert('❌ Erro: ' + (error as any).message);
    }
  };

  const reject = async (paymentId: string) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason) return;

    try {
      await api.post(`/api/admin/commissions/${paymentId}/reject`, { reason });
      alert('❌ Pagamento rejeitado!');
      loadPending();
    } catch (error) {
      alert('❌ Erro: ' + (error as any).message);
    }
  };

  return (
    <div className=\"p-6\">
      <h1 className=\"text-2xl font-bold mb-4\">Pagamentos Aguardando Verificação</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : pending.length === 0 ? (
        <p className=\"text-gray-500\">Nenhum pagamento pendente</p>
      ) : (
        <div className=\"space-y-4\">
          {pending.map((p: any) => (
            <div key={p.id} className=\"border rounded p-4\">
              <div className=\"flex justify-between items-start\">
                <div>
                  <p className=\"font-mono text-sm\">{p.reference_number}</p>
                  <p className=\"font-semibold\">{p.provider_name}</p>
                  <p className=\"text-sm text-gray-600\">{p.provider_email}</p>
                  <p className=\"text-2xl font-bold mt-2\">{p.net_amount} MZN</p>
                  <p className=\"text-sm\">Método: {p.payment_method}</p>

                  {p.payment_proof_url && (
                    <a
                      href={p.payment_proof_url}
                      target=\"_blank\"
                      className=\"text-blue-600 underline text-sm mt-2\"
                    >
                      📎 Ver Comprovante
                    </a>
                  )}
                </div>

                <div className=\"flex gap-2\">
                  <button
                    onClick={() => verify(p.id)}
                    className=\"bg-green-500 text-white px-4 py-2 rounded\"
                  >
                    ✅ Aprovar
                  </button>
                  <button
                    onClick={() => reject(p.id)}
                    className=\"bg-red-500 text-white px-4 py-2 rounded\"
                  >
                    ❌ Rejeitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
