// ========================================================================
// authService_MODERNIZADO.ts - Serviço de Autenticação (25 Fevereiro 2026)
// ✅ Criação de contas unificada
// ✅ Gerenciamento de capacidades
// ✅ Sincronização Firebase-DB
// ========================================================================

import { randomUUID } from "crypto";
import { db } from "../../../../db.js";
import { 
  users, 
  driverProfiles, 
  hotelManagerProfiles,
  verificationDocuments,
  capabilityChangesLog 
} from "../../../../shared/schema.js";
import { 
  CreateClientInput,
  ActivateDriverCapacityInput,
  ActivateHotelManagerCapacityInput,
  UploadVerificationDocumentInput,
  ApproveCapabilityInput,
  RejectCapabilityInput
} from "../../../../shared/types.js";
import { eq, and, sql } from "drizzle-orm";

// ==================== CACHE COM TTL ====================
interface CachedCapabilities {
  data: any;
  timestamp: number;
}

const CAPABILITY_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const capabilityCache = new Map<string, CachedCapabilities>();

// ==================== SERVIÇO DE CLIENTE ====================

export class AuthService {
  /**
   * Criar conta de cliente (base para todas as contas)
   */
  static async createClient(input: CreateClientInput) {
    try {
      console.log(`📝 Criando cliente: ${input.email}`);

      // Validar se já existe
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email));

      if (existing.length > 0) {
        throw new Error(`Usuário ${input.email} já existe`);
      }

      // Criar usuário
      const newUser = await db
        .insert(users)
        .values({
          id: randomUUID(),
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          fullName: `${input.firstName} ${input.lastName}`,
          phone: input.phone,
          accountType: input.accountType || 'individual',
          companyName: input.companyName,
          companyVatNumber: input.companyVatNumber,
          companyAddress: input.companyAddress,
          companyPhone: input.companyPhone,
          canBookServices: true,
          canDrive: false,
          canManageHotels: false,
          isAdmin: false,
          clientVerificationStatus: 'verified',
          createdAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .returning();

      console.log(`✅ Cliente criado: ${newUser[0].id}`);
      return newUser[0];
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      throw error;
    }
  }

  /**
   * Obter usuário por ID
   */
  static async getUserById(userId: string) {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      throw error;
    }
  }

  /**
   * Obter usuário por email
   */
  static async getUserByEmail(email: string) {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  // ==================== GERENCIAMENTO DE CAPACIDADES ====================

  /**
   * Ativar capacidade de motorista
   */
  static async activateDriverCapability(input: ActivateDriverCapacityInput) {
    try {
      console.log(`🚗 Ativando capacidade de motorista para: ${input.userId}`);


      // Criar perfil de motorista
      const driverProfile = await db
        .insert(driverProfiles)
        .values({
          user_id: input.userId,
          license_number: input.licenseNumber,
          license_country: input.licenseCountry || 'Mo\u00e7ambique',
          license_expiry: input.licenseExpiry,
          vehicle_type: input.vehicleType,
          years_experience: input.yearsExperience || 0,
          verification_status: 'pending',
          created_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .returning();

      // Ativar capacidade (mas status é pending review)
      await db.update(users)
        .set({
          canDrive: true,
          driverVerificationStatus: 'pending',
          updatedAt: sql`now()`,
        })
        .where(eq(users.id, input.userId));

      // Registrar auditoria
      await this.logCapabilityChange(
        input.userId,
        'can_drive',
        false,
        true,
        'Usuário ativou capacidade de motorista'
      );

      console.log(`✅ Capacidade de motorista ativada: ${driverProfile[0].id}`);
      return driverProfile[0];
    } catch (error) {
      console.error('❌ Erro ao ativar motorista:', error);
      throw error;
    }
  }

  /**
   * Ativar capacidade de gestor de hotel
   */
  static async activateHotelManagerCapability(input: ActivateHotelManagerCapacityInput) {
    try {
      console.log(`🏨 Ativando capacidade de gestor de hotel para: ${input.userId}`);

      // Validar se já tem perfil
      const existing = await db
        .select()
        .from(hotelManagerProfiles)
        .where(eq(hotelManagerProfiles.user_id, input.userId));

      if (existing.length > 0) {
        throw new Error('Usuário já tem perfil de gestor de hotel');
      }

      // Criar perfil
      const hotelProfile = await db
        .insert(hotelManagerProfiles)
        .values({
          user_id: input.userId,
          business_tax_id: input.businessTaxId,
          business_registration_number: input.businessRegistrationNumber,
          business_legal_name: input.businessLegalName,
          business_address: input.businessAddress,
          business_phone: input.businessPhone,
          business_email: input.businessEmail,
          verification_status: 'pending',
          created_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .returning();

      // Ativar capacidade
      await db.update(users)
        .set({
          canManageHotels: true,
          hotelManagerVerificationStatus: 'pending',
          updatedAt: sql`now()`,
        })
        .where(eq(users.id, input.userId));

      // Registrar auditoria
      await this.logCapabilityChange(
        input.userId,
        'can_manage_hotels',
        false,
        true,
        'Usuário ativou capacidade de gestor de hotel'
      );

      console.log(`✅ Capacidade de gestor de hotel ativada: ${hotelProfile[0].id}`);
      return hotelProfile[0];
    } catch (error) {
      console.error('❌ Erro ao ativar gestor de hotel:', error);
      throw error;
    }
  }

  /**
   * Registrar documento de verificação
   */
  static async uploadVerificationDocument(
    userId: string,
    profileType: string,
    documentType: string,
    documentUrl: string,
    documentNumber?: string,
    expiryDate?: string
  ) {
    try {
      console.log(`📄 Registrando documento para: ${userId}`);

      const doc = await db
        .insert(verificationDocuments)
        .values({
          user_id: userId,
          profile_type: profileType,
          document_type: documentType,
          document_url: documentUrl,
          document_number: documentNumber,
          expiry_date: expiryDate ? expiryDate : null,
          verification_status: 'pending',
          created_at: sql`now()`,
          updated_at: sql`now()`,
        })
        .returning();

      console.log(`✅ Documento registrado: ${doc[0].id}`);
      return doc[0];
    } catch (error) {
      console.error('❌ Erro ao registrar documento:', error);
      throw error;
    }
  }

  /**
   * Aprovar capacidade (por admin) - COM LOGGING CRÍTICO
   */
  static async approveCapability(
    userId: string,
    capability: 'driver' | 'hotel_manager',
    approvedBy: string
  ) {
    try {
      console.log(`✅ [CRITICAL] Aprovando capacidade ${capability} para: ${userId} por admin: ${approvedBy}`);

      if (capability === 'driver') {
        await db.update(users)
          .set({
            driverVerificationStatus: 'verified',
            driverVerifiedAt: sql`now()`,
            updatedAt: sql`now()`,
          })
          .where(eq(users.id, userId));
      } else if (capability === 'hotel_manager') {
        await db.update(users)
          .set({
            hotelManagerVerificationStatus: 'verified',
            hotelManagerVerifiedAt: sql`now()`,
            updatedAt: sql`now()`,
          })
          .where(eq(users.id, userId));
      }

      // Registrar auditoria com detalhes completos
      await this.logCapabilityChange(
        userId,
        `${capability}_verification_status`,
        false,
        true,
        `Capacidade ${capability} aprovada por admin ${approvedBy}`,
        approvedBy
      );

      // Log crítico para audit trail
      console.log(`✅ [AUDIT] CAPACIDADE APROVADA: userId=${userId}, capability=${capability}, approvedBy=${approvedBy}, timestamp=${new Date().toISOString()}`);
      
      // Invalidar cache
      capabilityCache.delete(userId);
      
      return true;
    } catch (error) {
      console.error('❌ [ERROR] Erro ao aprovar capacidade:', error);
      throw error;
    }
  }

  /**
   * Rejeitar capacidade (por admin) - COM LOGGING CRÍTICO
   */
  static async rejectCapability(
    userId: string,
    capability: 'driver' | 'hotel_manager',
    reason: string,
    rejectedBy: string
  ) {
    try {
      console.log(`❌ [CRITICAL] Rejeitando capacidade ${capability} para: ${userId} por admin: ${rejectedBy}. Razão: ${reason}`);

      const capabilityMap: Record<string, any> = {
        driver: {
          statusField: 'driver_verification_status',
          profileTable: driverProfiles,
          profileField: 'verification_status',
        },
        hotel_manager: {
          statusField: 'hotel_manager_verification_status',
          profileTable: hotelManagerProfiles,
          profileField: 'verification_status',
        },
      };

      const config = capabilityMap[capability];
      if (!config) throw new Error('Capacidade inválida');

      // Atualizar status no users
      const updateData: any = { updatedAt: sql`now()` };
      if (capability === 'driver') {
        updateData.driverVerificationStatus = 'rejected';
      } else if (capability === 'hotel_manager') {
        updateData.hotelManagerVerificationStatus = 'rejected';
      }

      await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId));

      // Registrar razão na auditoria
      await this.logCapabilityChange(
        userId,
        `${capability}_rejected`,
        false,
        false,
        reason,
        rejectedBy
      );

      // Log crítico para audit trail
      console.log(`❌ [AUDIT] CAPACIDADE REJEITADA: userId=${userId}, capability=${capability}, reason=${reason}, rejectedBy=${rejectedBy}, timestamp=${new Date().toISOString()}`);
      
      // Invalidar cache
      capabilityCache.delete(userId);

      return true;
    } catch (error) {
      console.error('❌ [ERROR] Erro ao rejeitar capacidade:', error);
      throw error;
    }
  }

  /**
   * Obter capacidades do usuário - COM CACHE TTL
   */
  static async getCapabilities(userId: string) {
    try {
      // Verificar cache
      const cachedCapabilities = capabilityCache.get(userId);
      const now = Date.now();
      
      if (cachedCapabilities && (now - cachedCapabilities.timestamp) < CAPABILITY_CACHE_TTL) {
        console.log(`⚡ [CACHE HIT] Capacidades obtidas do cache para: ${userId}`);
        return cachedCapabilities.data;
      }

      console.log(`📊 [CACHE MISS] Buscando capacidades do DB para: ${userId}`);
      
      const user = await this.getUserById(userId);

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const capabilities = {
        canBookServices: user.canBookServices ?? true,
        canDrive: user.canDrive ?? false,
        driverVerificationStatus: user.driverVerificationStatus,
        canManageHotels: user.canManageHotels ?? false,
        hotelManagerVerificationStatus: user.hotelManagerVerificationStatus,
        isAdmin: user.isAdmin ?? false,
      };
      
      // Armazenar no cache
      capabilityCache.set(userId, {
        data: capabilities,
        timestamp: now
      });
      
      return capabilities;
    } catch (error) {
      console.error('❌ Erro ao obter capacidades:', error);
      throw error;
    }
  }

  /**
   * Registrar mudança de capacidade (auditoria)
   */
  private static async logCapabilityChange(
    userId: string,
    capability: string,
    oldValue: boolean | null,
    newValue: boolean | null,
    reason: string,
    changedBy?: string
  ) {
    try {
      await db
        .insert(capabilityChangesLog)
        .values({
          user_id: userId,
          capability,
          old_value: oldValue,
          new_value: newValue,
          reason,
          changed_by: changedBy,
          created_at: sql`now()`,
        });
    } catch (error) {
      console.error('❌ Erro ao registrar auditoria:', error);
      // Não falhar a operação por causa do log
    }
  }
}

export const authService = AuthService;