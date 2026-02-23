export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface RegisterRequest {
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

export interface RegisterResponse {
  success: boolean;
  user?: UserProfile;
  error?: string; // Para compatibilidade com código antigo
  message?: string; // Novo campo padrão
}

export interface UserProfile {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  accountType?: 'individual' | 'company';
  companyName?: string | null;
  companyVatNumber?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;

  // Sistema de capacidades
  canBookServices: boolean;
  canDrive: boolean;
  canManageHotels: boolean;
  isAdmin: boolean;

  // Status de verificação
  driverVerificationStatus: string | null;
  hotelManagerVerificationStatus: string | null;

  // Dados específicos
  driverLicenseNumber?: string | null;
  driverVehicleType?: string | null;
  businessTaxId?: string | null;

  // Campos legados para compatibilidade
  name?: string;
  avatar?: string;
  roles?: string[];
  isVerified?: boolean;
  createdAt?: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  accountType?: 'individual' | 'company';
  companyName?: string;
  companyVatNumber?: string;
  companyAddress?: string;
  companyPhone?: string;
}

// Novos tipos para capacidades
export interface ActivateCapacityRequest {
  capacity: 'drive' | 'hotel_manager' | 'manageHotels';
  documents?: Array<{
    type: string;
    url: string;
    number?: string;
    expiryDate?: string;
  }>;
  notes?: string;
}

export interface ActivateCapacityResponse {
  success: boolean;
  message: string;
  requiresVerification: boolean;
  user: UserProfile;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

// Tipos para permissões (mantidos para compatibilidade)

export interface RolePermission {
  role: string;
  permission: string;
}

export interface PermissionMatrix {
  [role: string]: string[];
}

// Tipos para contas específicas (atualizados)

export interface DriverInfo {
  driverLicenseNumber: string;
  driverLicenseCountry?: string;
  driverLicenseExpiry: string;
  driverVehicleType: string;
  driverYearsExperience?: number;
  verificationStatus: 'pending' | 'verified' | 'rejected' | null;
  verifiedAt?: string;
}

export interface HotelManagerInfo {
  businessTaxId: string;
  businessRegistrationNumber?: string;
  businessLegalName: string;
  companyName?: string;
  companyVatNumber?: string;
  companyAddress?: string;
  companyPhone?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | null;
  verifiedAt?: string;
}
