// ✅ ATUALIZADO: Sistema de capacidades (NOVO) - Compatibilidade com sistema antigo
// Este arquivo mantém compatibilidade com código legado enquanto migra para o novo sistema

import { users } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// Use os tipos inferidos do Drizzle ORM
type User = InferSelectModel<typeof users>;
type UpsertUser = InferInsertModel<typeof users>;

// DTO para criação de usuário (compatibilidade com sistema antigo)
export interface CreateUserData {
  id: string; // Firebase UID
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profileImageUrl?: string;
  phone?: string;
  userType?: 'client' | 'driver' | 'host' | 'admin';
  roles?: string[];
  canOfferServices?: boolean;
}

// Interface for authentication storage operations (compatibilidade)
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(userData: CreateUserData): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
}

// Função para mapear dados do banco para User (compatibilidade)
function mapDbUserToUser(dbUser: any): User {
  return {
    ...dbUser,
    // Garantir que campos numéricos sejam numbers
    rating: dbUser.rating ? Number(dbUser.rating) : 0,
    totalReviews: dbUser.totalReviews ? Number(dbUser.totalReviews) : 0,
    
    // Garantir que booleanos sejam booleanos
    isVerified: Boolean(dbUser.isVerified),
    canOfferServices: Boolean(dbUser.canOfferServices),
    registrationCompleted: Boolean(dbUser.registrationCompleted),
    
    // ✅ ADICIONADO: Campos do novo sistema de capacidades
    canBookServices: Boolean(dbUser.canBookServices),
    canDrive: Boolean(dbUser.canDrive),
    canManageHotels: Boolean(dbUser.canManageHotels),
    isAdmin: Boolean(dbUser.isAdmin),
    
    // Garantir que arrays sejam arrays
    roles: Array.isArray(dbUser.roles) ? dbUser.roles : [],
    
    // Garantir que datas sejam Date objects
    createdAt: dbUser.createdAt ? new Date(dbUser.createdAt) : new Date(),
    updatedAt: dbUser.updatedAt ? new Date(dbUser.updatedAt) : new Date(),
    verificationDate: dbUser.verificationDate ? new Date(dbUser.verificationDate) : null,
    badgeEarnedDate: dbUser.badgeEarnedDate ? new Date(dbUser.badgeEarnedDate) : null,
    dateOfBirth: dbUser.dateOfBirth ? new Date(dbUser.dateOfBirth) : null,
    
    // ✅ ADICIONADO: Datas do novo sistema
    capabilitiesUpdatedAt: dbUser.capabilitiesUpdatedAt ? new Date(dbUser.capabilitiesUpdatedAt) : null,
    lastCapacityActivation: dbUser.lastCapacityActivation ? new Date(dbUser.lastCapacityActivation) : null,
    
    // Garantir valores padrão para campos opcionais
    email: dbUser.email || '',
    phone: dbUser.phone || '',
    firstName: dbUser.firstName || '',
    lastName: dbUser.lastName || '',
    fullName: dbUser.fullName || '',
    profileImageUrl: dbUser.profileImageUrl || '',
    userType: dbUser.userType || 'client',
    verificationStatus: dbUser.verificationStatus || 'pending',
    verificationNotes: dbUser.verificationNotes || '',
    identityDocumentUrl: dbUser.identityDocumentUrl || '',
    identityDocumentType: dbUser.identityDocumentType || '',
    documentNumber: dbUser.documentNumber || '',
    verificationBadge: dbUser.verificationBadge || '',
    
    // ✅ ADICIONADO: Campos do novo sistema
    accountType: dbUser.accountType || 'individual',
    companyName: dbUser.companyName || '',
    companyVatNumber: dbUser.companyVatNumber || '',
    companyAddress: dbUser.companyAddress || '',
    companyPhone: dbUser.companyPhone || '',
    driverLicenseNumber: dbUser.driverLicenseNumber || '',
    driverLicenseCountry: dbUser.driverLicenseCountry || 'Moçambique',
    driverLicenseExpiry: dbUser.driverLicenseExpiry || null,
    driverVehicleType: dbUser.driverVehicleType || '',
    driverYearsExperience: dbUser.driverYearsExperience || null,
    businessTaxId: dbUser.businessTaxId || '',
    businessRegistrationNumber: dbUser.businessRegistrationNumber || '',
    businessLegalName: dbUser.businessLegalName || '',
    
    // ✅ CORRIGIDO: Status de verificação (devem ser do tipo ENUM)
    driverVerificationStatus: dbUser.driverVerificationStatus || null,
    driverVerificationNotes: dbUser.driverVerificationNotes || null,
    driverVerifiedAt: dbUser.driverVerifiedAt || null,
    
    hotelManagerVerificationStatus: dbUser.hotelManagerVerificationStatus || null,
    hotelManagerVerificationNotes: dbUser.hotelManagerVerificationNotes || null,
    hotelManagerVerifiedAt: dbUser.hotelManagerVerifiedAt || null,
  } as User;
}

// ✅ Função para preparar dados para upsert (compatibilidade)
function prepareUpsertData(userData: UpsertUser): any {
  const now = sql`now()`;
  
  // Extrair apenas os campos que existem no schema
  return {
    id: userData.id,
    email: userData.email || null,
    firstName: userData.firstName || null,
    lastName: userData.lastName || null,
    fullName: userData.fullName || null,
    profileImageUrl: userData.profileImageUrl || null,
    phone: userData.phone || null,
    
    // Campos do sistema antigo
    userType: userData.userType || 'client',
    roles: userData.roles || ['client'],
    canOfferServices: userData.canOfferServices ?? false,
    isVerified: userData.isVerified ?? false,
    registrationCompleted: userData.registrationCompleted ?? false,
    rating: userData.rating || '0.00',
    totalReviews: userData.totalReviews || 0,
    verificationStatus: userData.verificationStatus || 'pending',
    verificationNotes: userData.verificationNotes || null,
    identityDocumentUrl: userData.identityDocumentUrl || null,
    identityDocumentType: userData.identityDocumentType || null,
    documentNumber: userData.documentNumber || null,
    dateOfBirth: userData.dateOfBirth || null,
    verificationBadge: userData.verificationBadge || null,
    badgeEarnedDate: userData.badgeEarnedDate || null,
    
    // ✅ SISTEMA DE CAPACIDADES
    canBookServices: userData.canBookServices ?? true,
    canDrive: userData.canDrive ?? false,
    canManageHotels: userData.canManageHotels ?? false,
    isAdmin: userData.isAdmin ?? false,
    
    // ✅ Status de verificação (valores ENUM - passados como string, Drizzle converte)
    driverVerificationStatus: userData.driverVerificationStatus || null,
    driverVerificationNotes: userData.driverVerificationNotes || null,
    driverVerifiedAt: userData.driverVerifiedAt || null,
    
    hotelManagerVerificationStatus: userData.hotelManagerVerificationStatus || null,
    hotelManagerVerificationNotes: userData.hotelManagerVerificationNotes || null,
    hotelManagerVerifiedAt: userData.hotelManagerVerifiedAt || null,
    
    // ✅ Documentos do motorista
    driverLicenseNumber: userData.driverLicenseNumber || null,
    driverLicenseCountry: userData.driverLicenseCountry || 'Moçambique',
    driverLicenseExpiry: userData.driverLicenseExpiry || null,
    driverVehicleType: userData.driverVehicleType || null,
    driverYearsExperience: userData.driverYearsExperience || null,
    
    // ✅ Documentos da empresa
    businessTaxId: userData.businessTaxId || null,
    businessRegistrationNumber: userData.businessRegistrationNumber || null,
    businessLegalName: userData.businessLegalName || null,
    
    // ✅ Tipo de conta
    accountType: userData.accountType || 'individual',
    companyName: userData.companyName || null,
    companyVatNumber: userData.companyVatNumber || null,
    companyAddress: userData.companyAddress || null,
    companyPhone: userData.companyPhone || null,
    
    // ✅ Metadados de capacidades
    capabilitiesUpdatedAt: userData.capabilitiesUpdatedAt || null,
    lastCapacityActivation: userData.lastCapacityActivation || null,
    
    // Timestamps
    createdAt: userData.createdAt || now,
    updatedAt: now,
  };
}

export class DatabaseAuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user ? mapDbUserToUser(user) : undefined;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    try {
      // ✅ CORREÇÃO: Usando id field como Firebase UID (conforme schema atual)
      const [user] = await db.select().from(users).where(eq(users.id, firebaseUid));
      return user ? mapDbUserToUser(user) : undefined;
    } catch (error) {
      console.error('Error fetching user by Firebase UID:', error);
      return undefined;
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // ✅ ATUALIZADO: Converter userType antigo para capacidades
      const userType = userData.userType || 'client';
      
      // ✅ Preparar dados com tipos corretos (usando as any para campos ENUM)
      const userValues: any = {
        id: userData.id,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        fullName: userData.fullName || null,
        profileImageUrl: userData.profileImageUrl || null,
        phone: userData.phone || null,
        userType: userType,
        roles: userData.roles || ['client'],
        canOfferServices: userData.canOfferServices ?? false,
        
        // ✅ Mapear userType antigo para capacidades
        canBookServices: true,
        canDrive: userType === 'driver' || userType === 'admin',
        canManageHotels: userType === 'host' || userType === 'admin',
        isAdmin: userType === 'admin',
        accountType: 'individual',
        
        // Status de verificação baseado no userType (como string - Drizzle converte)
        driverVerificationStatus: (userType === 'driver' || userType === 'admin') ? 'pending' : null,
        hotelManagerVerificationStatus: (userType === 'host' || userType === 'admin') ? 'pending' : null,
        
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
      };

      const [user] = await db
        .insert(users)
        .values(userValues)
        .returning();
      
      return mapDbUserToUser(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // ✅ Preparar dados com a função auxiliar
      const preparedData = prepareUpsertData(userData);
      
      // ✅ Remover createdAt do update para não sobrescrever
      const { createdAt, ...updateData } = preparedData;
      
      const [user] = await db
        .insert(users)
        .values(preparedData as any) // ✅ Usar as any para contornar verificação de tipo
        .onConflictDoUpdate({
          target: users.id,
          set: updateData as any, // ✅ Usar as any para contornar verificação de tipo
        })
        .returning();
      
      return mapDbUserToUser(user);
    } catch (error) {
      console.error('Error upserting user:', error);
      throw new Error('Failed to upsert user');
    }
  }
}

// Export singleton (para compatibilidade com código legado)
export const authStorage = new DatabaseAuthStorage();

// ✅ ADICIONADO: Função auxiliar para converter usuário antigo para novo formato
export function convertLegacyUserToCapabilities(user: User): any {
  const userType = user.userType || 'client';
  
  return {
    ...user,
    // Mapear userType antigo para capacidades
    canBookServices: true,
    canDrive: userType === 'driver' || userType === 'admin',
    canManageHotels: userType === 'host' || userType === 'admin',
    isAdmin: userType === 'admin',
    
    // Status de verificação
    driverVerificationStatus: (userType === 'driver' || userType === 'admin') ? (user.verificationStatus || 'pending') : null,
    hotelManagerVerificationStatus: (userType === 'host' || userType === 'admin') ? (user.verificationStatus || 'pending') : null,
    
    // Converter roles antigos
    roles: user.roles || [userType],
  };
}

// ✅ ADICIONADO: Função para migrar usuário antigo para novo sistema
export async function migrateUserToCapabilities(userId: string): Promise<User | undefined> {
  try {
    const [dbUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!dbUser) return undefined;
    
    const user = mapDbUserToUser(dbUser);
    const convertedUser = convertLegacyUserToCapabilities(user);
    
    // Atualizar usuário no banco (usando as any para campos ENUM)
    const updateData: any = {
      canBookServices: convertedUser.canBookServices,
      canDrive: convertedUser.canDrive,
      canManageHotels: convertedUser.canManageHotels,
      isAdmin: convertedUser.isAdmin,
      driverVerificationStatus: convertedUser.driverVerificationStatus,
      hotelManagerVerificationStatus: convertedUser.hotelManagerVerificationStatus,
      capabilitiesUpdatedAt: sql`now()`,
      updatedAt: sql`now()`,
    };
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    
    return mapDbUserToUser(updatedUser);
  } catch (error) {
    console.error('Error migrating user to capabilities:', error);
    return undefined;
  }
}