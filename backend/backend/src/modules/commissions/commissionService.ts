// Commission Service - Sistema de Gestão de Comissões
// Integração com commission_payments e commission_notifications

import { db } from '../../../db';
import { 
  commission_payments, 
  commission_notifications,
  invoices,
  users,
  hotelBookings,
  eventBookings,
  rides,
  bookings
} from '../../../shared/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

export interface CommissionPaymentData {
  invoice_id: string;
  provider_id: string;
  provider_type: 'hotel' | 'driver' | 'event_space';
  amount: number;
  due_date: Date;
  payment_method?: string;
  payment_reference?: string;
  proof_image_url?: string;
  notes?: string;
}

export interface CommissionFilter {
  provider_id?: string;
  provider_type?: 'hotel' | 'driver' | 'event_space';
  status?: 'pending' | 'verified' | 'rejected';
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}

export class CommissionService {
  
  /**
   * Cria um novo registro de comissão
   */
  async createCommissionPayment(data: CommissionPaymentData) {
    try {
      console.log(`💳 Criando comissão para ${data.provider_type} ${data.provider_id}...`);
      
      // Converter datas para os formatos corretos
      const dueDateStr = data.due_date.toISOString().split('T')[0]; // YYYY-MM-DD para campo date
      const now = new Date();
      
      const result = await db.insert(commission_payments).values({
        invoice_id: data.invoice_id,
        provider_id: data.provider_id,
        provider_type: data.provider_type,
        amount: data.amount.toString(),
        due_date: dueDateStr,
        status: 'pending',
        payment_method: data.payment_method,
        payment_reference: data.payment_reference,
        proof_image_url: data.proof_image_url,
        notes: data.notes,
        created_at: now, // timestamp espera Date
        updated_at: now, // timestamp espera Date
      });

      // No Drizzle, precisamos buscar o ID inserido separadamente
      const insertedCommission = await db.select()
        .from(commission_payments)
        .where(eq(commission_payments.invoice_id, data.invoice_id))
        .orderBy(desc(commission_payments.created_at))
        .limit(1);
      
      const commissionId = insertedCommission[0]?.id;
      
      if (!commissionId) {
        throw new Error('Falha ao obter ID da comissão criada');
      }
      
      // Criar notificação
      await this.createNotification({
        payment_id: commissionId,
        provider_id: data.provider_id,
        type: 'payment_requested',
        title: 'Nova Comissão Disponível',
        message: `Uma nova comissão de ${data.amount} MZN está disponível para pagamento. Vencimento: ${data.due_date.toLocaleDateString()}`,
      });

      console.log(`✅ Comissão criada: ${commissionId}`);
      
      return {
        success: true,
        commission_id: commissionId,
        message: 'Comissão criada com sucesso',
      };
    } catch (error) {
      console.error('❌ Erro ao criar comissão:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro desconhecido ao criar comissão');
    }
  }

  /**
   * Lista comissões com filtros
   */
  async getCommissions(filters: CommissionFilter = {}) {
    try {
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 20, 100);
      const offset = (page - 1) * limit;

      // Construir condições WHERE
      const conditions = [];

      if (filters.provider_id) {
        conditions.push(eq(commission_payments.provider_id, filters.provider_id));
      }

      if (filters.provider_type) {
        conditions.push(eq(commission_payments.provider_type, filters.provider_type));
      }

      if (filters.status) {
        conditions.push(eq(commission_payments.status, filters.status));
      }

      if (filters.start_date) {
        const startDateStr = filters.start_date.toISOString().split('T')[0];
        conditions.push(gte(commission_payments.due_date, startDateStr));
      }

      if (filters.end_date) {
        const endDateStr = filters.end_date.toISOString().split('T')[0];
        conditions.push(lte(commission_payments.due_date, endDateStr));
      }

      // Query para contar total
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(commission_payments)
        .leftJoin(users, eq(commission_payments.provider_id, users.id));
      
      if (conditions.length > 0) {
        countQuery.where(and(...conditions));
      }
      
      const countResult = await countQuery;
      const total = Number(countResult[0]?.count || 0);
      const pages = Math.ceil(total / limit);

      // Query para dados
      const dataQuery = db
        .select({
          id: commission_payments.id,
          invoice_id: commission_payments.invoice_id,
          provider_id: commission_payments.provider_id,
          provider_type: commission_payments.provider_type,
          amount: commission_payments.amount,
          due_date: commission_payments.due_date,
          status: commission_payments.status,
          payment_method: commission_payments.payment_method,
          payment_reference: commission_payments.payment_reference,
          proof_image_url: commission_payments.proof_image_url,
          notes: commission_payments.notes,
          verified_by: commission_payments.verified_by,
          verified_at: commission_payments.verified_at,
          created_at: commission_payments.created_at,
          updated_at: commission_payments.updated_at,
          // Informações do provedor
          provider_name: users.fullName,
          provider_email: users.email,
        })
        .from(commission_payments)
        .leftJoin(users, eq(commission_payments.provider_id, users.id));
      
      if (conditions.length > 0) {
        dataQuery.where(and(...conditions));
      }
      
      // Aplicar paginação
      const commissions = await dataQuery
        .orderBy(desc(commission_payments.due_date))
        .limit(limit)
        .offset(offset);

      // Calcular resumo
      const now = new Date();
      let pendingAmount = 0;
      let overdueCount = 0;
      let overdueAmount = 0;

      commissions.forEach((c: any) => {
        if (c.status === 'pending') {
          const amount = parseFloat(c.amount?.toString() || '0');
          pendingAmount += amount;
          
          if (c.due_date && new Date(c.due_date) < now) {
            overdueCount++;
            overdueAmount += amount;
          }
        }
      });

      return {
        success: true,
        data: commissions,
        pagination: {
          page,
          limit,
          total,
          pages,
        },
        summary: {
          pendingAmount: Math.round(pendingAmount * 100) / 100,
          overdueCount,
          overdueAmount: Math.round(overdueAmount * 100) / 100,
        },
      };
    } catch (error) {
      console.error('❌ Erro ao listar comissões:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro desconhecido ao listar comissões');
    }
  }

  /**
   * Provedor submete comprovante de pagamento
   */
  async submitPaymentProof(
    commissionId: string, 
    providerId: string, 
    data: {
      payment_method: string;
      payment_reference: string;
      proof_image_url: string;
      notes?: string;
    }
  ) {
    try {
      console.log(`📤 Provedor ${providerId} submetendo comprovante para comissão ${commissionId}...`);
      
      // Verificar se a comissão pertence ao provedor
      const commission = await db
        .select()
        .from(commission_payments)
        .where(
          and(
            eq(commission_payments.id, commissionId),
            eq(commission_payments.provider_id, providerId)
          )
        )
        .limit(1);

      if (!commission || commission.length === 0) {
        throw new Error('Comissão não encontrada ou não pertence a este provedor');
      }

      if (commission[0].status !== 'pending') {
        throw new Error('Esta comissão já foi processada');
      }

      // Atualizar comissão
      await db.update(commission_payments)
        .set({
          payment_method: data.payment_method,
          payment_reference: data.payment_reference,
          proof_image_url: data.proof_image_url,
          notes: data.notes,
          status: 'verified', // Aguardando verificação do admin
          updated_at: new Date(), // timestamp espera Date
        })
        .where(eq(commission_payments.id, commissionId));

      // Criar notificação para admin
      await this.createNotification({
        payment_id: commissionId,
        provider_id: providerId,
        type: 'payment_verified',
        title: 'Comprovante de Pagamento Enviado',
        message: `O provedor enviou um comprovante para a comissão ${commissionId}. Valor: ${commission[0].amount} MZN`,
      });

      console.log(`✅ Comprovante enviado com sucesso`);
      
      return {
        success: true,
        message: 'Comprovante enviado com sucesso. Aguardando verificação do administrador.',
      };
    } catch (error) {
      console.error('❌ Erro ao submeter comprovante:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro desconhecido ao submeter comprovante');
    }
  }

  /**
   * Admin aprova pagamento
   */
  async approvePayment(commissionId: string, adminId: string, notes?: string) {
    try {
      console.log(`✅ Admin ${adminId} aprovando pagamento ${commissionId}...`);
      
      const commission = await db
        .select()
        .from(commission_payments)
        .where(eq(commission_payments.id, commissionId))
        .limit(1);

      if (!commission || commission.length === 0) {
        throw new Error('Comissão não encontrada');
      }

      // Atualizar status
      const now = new Date();
      await db.update(commission_payments)
        .set({
          status: 'verified',
          verified_by: adminId,
          verified_at: now, // timestamp espera Date
          notes: notes || commission[0].notes,
          updated_at: now, // timestamp espera Date
        })
        .where(eq(commission_payments.id, commissionId));

      // Criar notificação para provedor
      await this.createNotification({
        payment_id: commissionId,
        provider_id: commission[0].provider_id,
        type: 'payment_verified',
        title: 'Pagamento Aprovado',
        message: `Seu pagamento de ${commission[0].amount} MZN foi aprovado e confirmado.`,
      });

      console.log(`✅ Pagamento aprovado`);
      
      return {
        success: true,
        message: 'Pagamento aprovado com sucesso',
      };
    } catch (error) {
      console.error('❌ Erro ao aprovar pagamento:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro desconhecido ao aprovar pagamento');
    }
  }

  /**
   * Admin rejeita pagamento
   */
  async rejectPayment(commissionId: string, adminId: string, reason: string) {
    try {
      console.log(`❌ Admin ${adminId} rejeitando pagamento ${commissionId}...`);
      
      const commission = await db
        .select()
        .from(commission_payments)
        .where(eq(commission_payments.id, commissionId))
        .limit(1);

      if (!commission || commission.length === 0) {
        throw new Error('Comissão não encontrada');
      }

      // Atualizar status
      const now = new Date();
      await db.update(commission_payments)
        .set({
          status: 'rejected',
          verified_by: adminId,
          verified_at: now, // timestamp espera Date
          notes: reason,
          updated_at: now, // timestamp espera Date
        })
        .where(eq(commission_payments.id, commissionId));

      // Criar notificação para provedor
      await this.createNotification({
        payment_id: commissionId,
        provider_id: commission[0].provider_id,
        type: 'payment_rejected',
        title: 'Pagamento Rejeitado',
        message: `Seu pagamento foi rejeitado. Motivo: ${reason}`,
      });

      console.log(`❌ Pagamento rejeitado`);
      
      return {
        success: true,
        message: 'Pagamento rejeitado',
      };
    } catch (error) {
      console.error('❌ Erro ao rejeitar pagamento:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro desconhecido ao rejeitar pagamento');
    }
  }

  /**
   * Cria notificação
   */
  private async createNotification(data: {
    payment_id: string;
    provider_id: string;
    type: 'payment_requested' | 'payment_verified' | 'payment_rejected' | 'payment_reminder';
    title: string;
    message: string;
  }) {
    try {
      await db.insert(commission_notifications).values({
        payment_id: data.payment_id,
        provider_id: data.provider_id,
        type: data.type,
        title: data.title,
        message: data.message,
        read: false,
        created_at: new Date(), // timestamp espera Date
      });
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
      // Não lançar erro para não interromper o fluxo principal
    }
  }

  /**
   * Obtém notificações do provedor
   */
  async getProviderNotifications(providerId: string, unreadOnly: boolean = false) {
    try {
      // Construir condições
      const conditions = [eq(commission_notifications.provider_id, providerId)];
      
      if (unreadOnly) {
        conditions.push(eq(commission_notifications.read, false));
      }
      
      const notifications = await db
        .select()
        .from(commission_notifications)
        .where(and(...conditions))
        .orderBy(desc(commission_notifications.created_at));

      return {
        success: true,
        data: notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      };
    } catch (error) {
      console.error('❌ Erro ao obter notificações:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro desconhecido ao obter notificações');
    }
  }

  /**
   * Marca notificação como lida
   */
  async markNotificationAsRead(notificationId: string, providerId: string) {
    try {
      await db.update(commission_notifications)
        .set({
          read: true,
          read_at: new Date(), // timestamp espera Date
        })
        .where(
          and(
            eq(commission_notifications.id, notificationId),
            eq(commission_notifications.provider_id, providerId)
          )
        );

      return {
        success: true,
        message: 'Notificação marcada como lida',
      };
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro desconhecido ao marcar notificação como lida');
    }
  }

  /**
   * Gera comissões a partir de invoices pendentes
   */
  async generateCommissionsFromPendingInvoices() {
    try {
      console.log('🔄 Gerando comissões a partir de invoices pendentes...');
      
      // Buscar invoices pendentes
      const pendingInvoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.status, 'pending'),
            sql`invoices.invoice_number LIKE 'COMM-%'`
          )
        )
        .limit(50); // Limitar para não sobrecarregar

      let createdCount = 0;
      let errors = [];

      for (const invoice of pendingInvoices) {
        try {
          // Determinar provider_type baseado no invoice_number
          let providerType: 'hotel' | 'driver' | 'event_space' = 'hotel';
          let providerId = '';

          if (invoice.invoice_number?.includes('RIDE')) {
            providerType = 'driver';
            // Extrair provider_id da ride
            if (invoice.booking_id) {
              const ride = await db
                .select({ driver_id: rides.driverId })
                .from(rides)
                .where(eq(rides.id, invoice.booking_id))
                .limit(1);
              
              if (ride.length > 0) {
                providerId = ride[0].driver_id || '';
              }
            }
          } else if (invoice.invoice_number?.includes('EVENT')) {
            providerType = 'event_space';
            // Extrair provider_id do event booking
            if (invoice.hotel_booking_id) {
              const eventBooking = await db
                .select({ hotel_id: eventBookings.hotelId })
                .from(eventBookings)
                .where(eq(eventBookings.id, invoice.hotel_booking_id))
                .limit(1);
              
              if (eventBooking.length > 0) {
                providerId = eventBooking[0].hotel_id || '';
              }
            }
          } else {
            providerType = 'hotel';
            // Extrair provider_id do hotel booking
            if (invoice.hotel_booking_id) {
              const hotelBooking = await db
                .select({ hotel_id: hotelBookings.hotelId })
                .from(hotelBookings)
                .where(eq(hotelBookings.id, invoice.hotel_booking_id))
                .limit(1);
              
              if (hotelBooking.length > 0) {
                providerId = hotelBooking[0].hotel_id || '';
              }
            }
          }

          if (!providerId) {
            errors.push(`Invoice ${invoice.invoice_number}: Provider ID não encontrado`);
            continue;
          }

          // Verificar se já existe commission_payment para este invoice
          const existingCommission = await db
            .select()
            .from(commission_payments)
            .where(eq(commission_payments.invoice_id, invoice.id))
            .limit(1);

          if (existingCommission.length > 0) {
            continue; // Já existe, pular
          }

          // Calcular data de vencimento (30 dias após issue_date)
          const issueDate = invoice.issue_date ? new Date(invoice.issue_date) : new Date();
          const dueDate = new Date(issueDate);
          dueDate.setDate(dueDate.getDate() + 30);

          // Criar commission_payment
          await this.createCommissionPayment({
            invoice_id: invoice.id,
            provider_id: providerId,
            provider_type: providerType,
            amount: parseFloat(invoice.total_amount?.toString() || '0'),
            due_date: dueDate,
          });

          createdCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          errors.push(`Invoice ${invoice.invoice_number}: ${errorMessage}`);
        }
      }

      console.log(`✅ ${createdCount} comissões criadas, ${errors.length} erros`);
      
      return {
        success: true,
        createdCount,
        errors,
        message: `Processamento concluído: ${createdCount} comissões criadas`,
      };
    } catch (error) {
      console.error('❌ Erro ao gerar comissões:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro desconhecido ao gerar comissões');
    }
  }
}

export default new CommissionService();