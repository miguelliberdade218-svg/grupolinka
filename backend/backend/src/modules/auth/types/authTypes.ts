import type { User, UserCapacityDocument } from '../../../../shared/schema.js';

// ==================== TIPOS DE RESPOSTA ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorCode?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface UserProfileResponse {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  accountType: 'individual' | 'company' | null;
  
  // Capacidades
  canBookServices: boolean;
  canDrive: boolean;
  canManageHotels: boolean;
  isAdmin: boolean;
  
  // Status de verificação
  driverVerificationStatus: string | null;
  hotelManagerVerificationStatus: string | null;
  
  // Dados específicos
  driverLicenseNumber: string | null;
  driverVehicleType: string | null;
  businessTaxId: string | null;
  companyName: string | null;
  companyVatNumber: string | null;
  companyAddress: string | null;
  companyPhone: string | null;
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
  capabilitiesUpdatedAt: Date | null;
  lastCapacityActivation: Date | null;
  
  // Documentos
  capacityDocuments?: UserCapacityDocument[];
}

export interface SignupResponse {
  user: UserProfileResponse;
  message: string;
  requiresVerification?: boolean;
}

export interface CapacityActivationResponse {
  user: UserProfileResponse;
  documents: UserCapacityDocument[];
  message: string;
  requiresVerification: boolean;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

// ==================== TIPOS PARA ADMIN ====================

export interface PendingVerificationsResponse {
  drivers: UserProfileResponse[];
  hotelManagers: UserProfileResponse[];
  total: number;
}

export interface UserWithDocuments extends UserProfileResponse {
  capacityDocuments: UserCapacityDocument[];
}

// ==================== TIPOS PARA FILTROS ====================

export interface UsersFilter {
  capacity?: 'drive' | 'hotel_manager';
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'in_review';
  accountType?: 'individual' | 'company';
  search?: string;
  page?: number;
  limit?: number;
}

// ==================== TIPOS PARA EMAIL ====================

export interface EmailTemplateData {
  to: string;
  subject: string;
  template: 'welcome' | 'password-reset' | 'verification-approved' | 'verification-rejected';
  data: {
    name?: string;
    resetLink?: string;
    verificationType?: string;
    reason?: string;
    [key: string]: any;
  };
}

export interface EmailService {
  sendEmail(templateData: EmailTemplateData): Promise<boolean>;
}

// ==================== TIPOS PARA FIREBASE ====================

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
}

export interface FirebaseAuthService {
  verifyToken(token: string): Promise<FirebaseUser>;
  createUser(email: string, password: string): Promise<FirebaseUser>;
  updateUser(uid: string, data: { displayName?: string; photoURL?: string }): Promise<void>;
  sendPasswordResetEmail(email: string): Promise<void>;
  verifyPasswordResetCode(code: string): Promise<string>;
  confirmPasswordReset(code: string, newPassword: string): Promise<void>;
}

// ==================== TIPOS PARA DOCUMENTOS ====================

export interface DocumentUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface DocumentService {
  uploadDocument(file: Buffer, fileName: string, folder: string): Promise<DocumentUploadResult>;
  deleteDocument(url: string): Promise<boolean>;
}

// ==================== TIPOS PARA O SERVIÇO DE AUTH ====================

export interface AuthServiceInterface {
  // Criação de usuários
  createClient(data: any): Promise<User>;
  createDriver(data: any): Promise<User>;
  createHotelManager(data: any): Promise<User>;
  
  // Ativação de capacidades
  activateCapacity(data: any): Promise<{ user: User; documents: UserCapacityDocument[] }>;
  
  // Busca de usuários
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserWithCapabilities(id: string): Promise<any>;
  
  // Recuperação de senha
  initiatePasswordReset(data: any): Promise<{ success: boolean; message: string }>;
  
  // Verificação de capacidades
  verifyCapacity(userId: string, capacity: 'drive' | 'hotel_manager', status: 'verified' | 'rejected', notes?: string): Promise<User>;
  
  // Listagem para admin
  getUsersByCapacity(capacity: 'drive' | 'hotel_manager', status?: string): Promise<User[]>;
  getPendingVerifications(): Promise<{ drivers: User[]; hotelManagers: User[] }>;
}