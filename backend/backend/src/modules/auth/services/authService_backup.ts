import { db } from '../../../../db.js';
import { users, userCapacityDocuments } from '../../../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { 
  User, 
  UserCapacityDocument,
  UserInsert 
} from '../../../../shared/schema.js';
import { emailService } from '../../../../shared/emailService.js';

// Tipos para o serviço
export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  accountType?: 'individual' | 'company';
  companyName?: string;
  companyVatNumber?: string;
  companyAddress?: string;
  companyPhone?: string;
}

export interface CreateDriverData extends CreateUserData {
  driverLicenseNumber: string;
  driverLicenseCountry?: string;
  driverLicenseExpiry: string;
  driverVehicleType: string;
  driverYearsExperience?: number;
}

export interface CreateHotelManagerData extends CreateUserData {
  businessTaxId: string;
  businessRegistrationNumber?: string;
  businessLegalName: string;
}

export interface ActivateCapacityData {
  userId: string;
  capacity: 'drive' | 'hotel_manager';
  documents?: Array<{
    type: string;
    url: string;
    number?: string;
    expiryDate?: string;
  }>;
  notes?: string;
}

export interface ForgotPasswordData {
  email: string;
}

// ✅ SOLUÇÃO DEFINITIVA: Incluir TODOS os campos do tipo User
function convertDbUserToUser(dbUser: unknown): User {
  const user = dbUser as any;
  
  return {
    // Campos obrigatórios
    id: user.id,
    email: user.email || null,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    fullName: user.fullName || null,
    profileImageUrl: user.profileImageUrl || null,
    phone: user.phone || null,
    
    // Campos do sistema antigo
    userType: user.userType || 'client',
    roles: user.roles || [],
    canOfferServices: Boolean(user.canOfferServices),
    rating: user.rating ? user.rating.toString() : '0.00',
    totalReviews: user.totalReviews || 0,
    isVerified: Boolean(user.isVerified),
    verificationStatus: user.verificationStatus || 'pending',
    verificationDate: user.verificationDate || null,
    verificationNotes: user.verificationNotes || null,
    identityDocumentUrl: user.identityDocumentUrl || null,
    identityDocumentType: user.identityDocumentType || null,
    documentNumber: user.documentNumber || null,
    dateOfBirth: user.dateOfBirth || null,
    registrationCompleted: Boolean(user.registrationCompleted),
    verificationBadge: user.verificationBadge || null,
    badgeEarnedDate: user.badgeEarnedDate || null,
    
    // ✅ SISTEMA DE CAPACIDADES
    canBookServices: Boolean(user.canBookServices),
    canDrive: Boolean(user.canDrive),
    canManageHotels: Boolean(user.canManageHotels),
    isAdmin: Boolean(user.isAdmin),
    
    // ✅ Status de verificação de motorista
    driverVerificationStatus: user.driverVerificationStatus || null,
    driverVerificationNotes: user.driverVerificationNotes || null,
    driverVerifiedAt: user.driverVerifiedAt || null,
    
    // ✅ Status de verificação de gestor de hotel
    hotelManagerVerificationStatus: user.hotelManagerVerificationStatus || null,
    hotelManagerVerificationNotes: user.hotelManagerVerificationNotes || null,
    hotelManagerVerifiedAt: user.hotelManagerVerifiedAt || null,
    
    // ✅ Documentos do motorista
    driverLicenseNumber: user.driverLicenseNumber || null,
    driverLicenseCountry: user.driverLicenseCountry || 'Moçambique',
    driverLicenseExpiry: user.driverLicenseExpiry || null,
    driverVehicleType: user.driverVehicleType || null,
    driverYearsExperience: user.driverYearsExperience || null,
    
    // ✅ Documentos da empresa
    businessTaxId: user.businessTaxId || null,
    businessRegistrationNumber: user.businessRegistrationNumber || null,
    businessLegalName: user.businessLegalName || null,
    
    // ✅ Tipo de conta (individual/company)
    accountType: user.accountType || 'individual',
    companyName: user.companyName || null,
    companyVatNumber: user.companyVatNumber || null,
    companyAddress: user.companyAddress || null,
    companyPhone: user.companyPhone || null,
    
    // ✅ Metadados de capacidades
    capabilitiesUpdatedAt: user.capabilitiesUpdatedAt || null,
    lastCapacityActivation: user.lastCapacityActivation || null,
    
    // ✅ Timestamps
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

// ✅ Helper para converter arrays - com tipagem explícita
function convertDbUsersToUsers(dbUsers: unknown[]): User[] {
  return dbUsers.map(user => convertDbUserToUser(user));
}

export class AuthService {
  // ========== CRIAÇÃO DE USUÁRIOS ==========
  
  async createClient(data: CreateUserData): Promise<User> {
    const result = await db.insert(users).values({
      id: sql`gen_random_uuid()`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      accountType: data.accountType || 'individual',
      companyName: data.accountType === 'company' ? data.companyName : null,
      companyVatNumber: data.accountType === 'company' ? data.companyVatNumber : null,
      companyAddress: data.accountType === 'company' ? data.companyAddress : null,
      companyPhone: data.accountType === 'company' ? data.companyPhone : null,
      canBookServices: true,
      canDrive: false,
      canManageHotels: false,
      isAdmin: false,
      createdAt: sql`now()`,
      updatedAt: sql`now()`,
    }).returning();
    
    return convertDbUserToUser(result[0]);
  }
  
  async createDriver(data: CreateDriverData): Promise<User> {
    const result = await db.insert(users).values({
      id: sql`gen_random_uuid()`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      accountType: data.accountType || 'individual',
      canBookServices: true,
      canDrive: true,
      canManageHotels: false,
      isAdmin: false,
      driverVerificationStatus: 'pending',
      driverLicenseNumber: data.driverLicenseNumber,
      driverLicenseCountry: data.driverLicenseCountry || 'Moçambique',
      driverLicenseExpiry: sql`${data.driverLicenseExpiry}::date`,
      driverVehicleType: data.driverVehicleType,
      driverYearsExperience: data.driverYearsExperience || null,
      capabilitiesUpdatedAt: sql`now()`,
      lastCapacityActivation: sql`now()`,
      createdAt: sql`now()`,
      updatedAt: sql`now()`,
    }).returning();
    
    return convertDbUserToUser(result[0]);
  }
  
  async createHotelManager(data: CreateHotelManagerData): Promise<User> {
    const result = await db.insert(users).values({
      id: sql`gen_random_uuid()`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      accountType: data.accountType || 'individual',
      canBookServices: true,
      canDrive: false,
      canManageHotels: true,
      isAdmin: false,
      hotelManagerVerificationStatus: 'pending',
      businessTaxId: data.businessTaxId,
      businessRegistrationNumber: data.businessRegistrationNumber || null,
      businessLegalName: data.businessLegalName,
      capabilitiesUpdatedAt: sql`now()`,
      lastCapacityActivation: sql`now()`,
      createdAt: sql`now()`,
      updatedAt: sql`now()`,
    }).returning();
    
    return convertDbUserToUser(result[0]);
  }
  
  // ========== ATIVAÇÃO DE CAPACIDADES ==========
  
  async activateCapacity(data: ActivateCapacityData): Promise<{ user: User; documents: UserCapacityDocument[] }> {
    const { userId, capacity, documents = [], notes } = data;
    
    // Verificar se usuário existe
    const userResult = await db.select().from(users).where(eq(users.id, userId));
    if (!userResult[0]) {
      throw new Error('Usuário não encontrado');
    }
    
    // Verificar se já tem a capacidade
    if ((capacity === 'drive' && userResult[0].canDrive) || 
        (capacity === 'hotel_manager' && userResult[0].canManageHotels)) {
      throw new Error('Usuário já possui esta capacidade');
    }
    
    // Atualizar capacidade do usuário
    const updateData: any = {
      capabilitiesUpdatedAt: sql`now()`,
      lastCapacityActivation: sql`now()`,
    };
    
    if (capacity === 'drive') {
      updateData.canDrive = true;
      updateData.driverVerificationStatus = 'pending';
      if (notes) updateData.driverVerificationNotes = notes;
    } else if (capacity === 'hotel_manager') {
      updateData.canManageHotels = true;
      updateData.hotelManagerVerificationStatus = 'pending';
      if (notes) updateData.hotelManagerVerificationNotes = notes;
    }
    
    const updatedResult = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    // Salvar documentos se fornecidos
    let savedDocuments: UserCapacityDocument[] = [];
    if (documents.length > 0) {
      const documentValues = documents.map(doc => ({
        userId,
        capacity,
        documentType: doc.type,
        documentUrl: doc.url,
        documentNumber: doc.number || null,
        expiryDate: doc.expiryDate ? sql`${doc.expiryDate}::date` : null,
        isVerified: false,
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
      }));
      
      const docResult = await db.insert(userCapacityDocuments)
        .values(documentValues)
        .returning();
      
      savedDocuments = docResult as unknown as UserCapacityDocument[];
    }
    
    return { 
      user: convertDbUserToUser(updatedResult[0]), 
      documents: savedDocuments 
    };
  }
  
  // ========== BUSCA DE USUÁRIOS ==========
  
  async getUserById(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] ? convertDbUserToUser(result[0]) : null;
  }
  
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] ? convertDbUserToUser(result[0]) : null;
  }
  
  async getUserWithCapabilities(id: string): Promise<any> {
    const userResult = await db.select().from(users).where(eq(users.id, id));
    if (!userResult[0]) return null;
    
    // Buscar documentos de capacidade
    const documentsResult = await db.select()
      .from(userCapacityDocuments)
      .where(eq(userCapacityDocuments.userId, id));
    
    return {
      ...convertDbUserToUser(userResult[0]),
      capacityDocuments: documentsResult as unknown as UserCapacityDocument[],
    };
  }
  
  // ========== ESQUECI MINHA SENHA ==========
  
  async initiatePasswordReset(data: ForgotPasswordData): Promise<{ success: boolean; message: string }> {\n    const { email } = data;\n    \n    // Verificar se usu�rio existe\n    const user = await this.getUserByEmail(email);\n    if (!user) {\n      // Por seguran�a, n�o revelamos se o email existe\n      return {\n        success: true,\n        message:  Se o email existir voc� receber� instru��es para redefinir sua senha\n      };\n    }\n    \n    // Gerar token de reset (simplificado - em produ��o usar JWT com expira��o)\n    const resetToken = uuidv4();\n    \n    // Enviar email de reset\n    const emailSent = await emailService.sendPasswordResetEmail(\n      email,\n      user.firstName || Usu�rio,\n      resetToken\n    );\n    \n    if (!emailSent) {\n      console.error(Falha ao enviar email de reset para:, email);\n      return {\n        success: false,\n        message: Erro ao enviar email de recupera��o. Tente novamente mais tarde.\n      };\n    }\n    \n    console.log(?? Email de reset enviado para: );\n    \n    return {\n      success: true,\n      message: Instru��es de recupera��o enviadas para seu email\n    };\n  } = data;
    
    // Verificar se usuário existe
    const user = await this.getUserByEmail(email);
    if (!user) {
      return {
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha'
      };
    }
    
    console.log(`📧 Email de reset de senha seria enviado para: ${email}`);
    
    return {
      success: true,
      message: 'Instruções de recuperação enviadas para seu email'
    };
  }
  
  // ========== VERIFICAÇÃO DE CAPACIDADES ==========
  
  async verifyCapacity(userId: string, capacity: 'drive' | 'hotel_manager', status: 'verified' | 'rejected', notes?: string): Promise<User> {
    const userResult = await db.select().from(users).where(eq(users.id, userId));
    if (!userResult[0]) {
      throw new Error('Usuário não encontrado');
    }
    
    const updateData: any = {
      capabilitiesUpdatedAt: sql`now()`,
    };
    
    if (capacity === 'drive') {
      updateData.driverVerificationStatus = status;
      updateData.driverVerifiedAt = status === 'verified' ? sql`now()` : null;
      if (notes) updateData.driverVerificationNotes = notes;
    } else if (capacity === 'hotel_manager') {
      updateData.hotelManagerVerificationStatus = status;
      updateData.hotelManagerVerifiedAt = status === 'verified' ? sql`now()` : null;
      if (notes) updateData.hotelManagerVerificationNotes = notes;
    }
    
    const updatedResult = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    return convertDbUserToUser(updatedResult[0]);
  }
  
  // ========== LISTAGEM PARA ADMIN ==========
  
  async getUsersByCapacity(capacity: 'drive' | 'hotel_manager', status?: string): Promise<User[]> {
    let query = db.select().from(users);
    
    if (capacity === 'drive') {
      query = query.where(eq(users.canDrive, true)) as any;
      if (status) {
        query = query.where(sql`${users.driverVerificationStatus} = ${status}`) as any;
      }
    } else if (capacity === 'hotel_manager') {
      query = query.where(eq(users.canManageHotels, true)) as any;
      if (status) {
        query = query.where(sql`${users.hotelManagerVerificationStatus} = ${status}`) as any;
      }
    }
    
    const result = await query;
    return convertDbUsersToUsers(result);
  }
  
  async getPendingVerifications(): Promise<{ drivers: User[]; hotelManagers: User[] }> {
    const driversResult = await db.select()
      .from(users)
      .where(and(
        eq(users.canDrive, true),
        sql`${users.driverVerificationStatus} = 'pending'`
      )) as any;
    
    const hotelManagersResult = await db.select()
      .from(users)
      .where(and(
        eq(users.canManageHotels, true),
        sql`${users.hotelManagerVerificationStatus} = 'pending'`
      )) as any;
    
    return { 
      drivers: convertDbUsersToUsers(driversResult), 
      hotelManagers: convertDbUsersToUsers(hotelManagersResult) 
    };
  }
}

// Export singleton
export const authService = new AuthService();
