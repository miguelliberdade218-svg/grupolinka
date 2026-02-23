import { z } from 'zod';

// ==================== SCHEMAS BASE ====================

export const baseSignupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  phone: z.string().optional(),
  accountType: z.enum(['individual', 'company']).default('individual'),
});

// ==================== SCHEMAS DE SIGNUP ====================

export const clientSignupSchema = baseSignupSchema.extend({
  // Cliente sempre pode reservar serviços
  wantsToBeClient: z.boolean().default(true),
  // Dados da empresa (se for empresa)
  companyName: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
});

export const driverSignupSchema = baseSignupSchema.extend({
  wantsToBeDriver: z.boolean().default(true),
  // Dados obrigatórios do motorista
  driverLicenseNumber: z.string().min(1, 'Número da carta de condução é obrigatório'),
  driverLicenseCountry: z.string().default('Moçambique'),
  driverLicenseExpiry: z.string().refine((date) => {
    const expiryDate = new Date(date);
    const today = new Date();
    return expiryDate > today;
  }, 'Carta de condução expirada'),
  driverVehicleType: z.string().min(1, 'Tipo de veículo é obrigatório'),
  driverYearsExperience: z.number().min(0).optional(),
});

export const hotelManagerSignupSchema = baseSignupSchema.extend({
  wantsToBeHotelManager: z.boolean().default(true),
  // Dados obrigatórios do negócio
  businessTaxId: z.string().min(1, 'NIF/NUIT é obrigatório'),
  businessRegistrationNumber: z.string().optional(),
  businessLegalName: z.string().min(1, 'Nome legal do negócio é obrigatório'),
});

// ==================== SCHEMAS DE AUTENTICAÇÃO ====================

export const loginSchema = z.object({
  email: z.string().email(),
  // Firebase token será validado separadamente
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// ==================== SCHEMAS DE CAPACIDADES ====================

export const activateCapacitySchema = z.object({
  capacity: z.enum(['drive', 'hotel_manager']),
  documents: z.array(z.object({
    type: z.string().min(1, 'Tipo do documento é obrigatório'),
    url: z.string().url('URL do documento inválida'),
    number: z.string().optional(),
    expiryDate: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
});

export const verifyCapacitySchema = z.object({
  capacity: z.enum(['drive', 'hotel_manager']),
  status: z.enum(['verified', 'rejected']),
  notes: z.string().optional(),
});

// ==================== SCHEMAS DE DOCUMENTOS ====================

export const uploadDocumentSchema = z.object({
  capacity: z.enum(['drive', 'hotel_manager']),
  documentType: z.string().min(1, 'Tipo do documento é obrigatório'),
  documentUrl: z.string().url('URL do documento inválida'),
  documentNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

// ==================== SCHEMAS DE PERFIL ====================

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório').optional(),
  lastName: z.string().min(1, 'Sobrenome é obrigatório').optional(),
  phone: z.string().optional(),
  accountType: z.enum(['individual', 'company']).optional(),
  companyName: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
});

// ==================== TIPOS EXPORTADOS ====================

export type ClientSignupInput = z.infer<typeof clientSignupSchema>;
export type DriverSignupInput = z.infer<typeof driverSignupSchema>;
export type HotelManagerSignupInput = z.infer<typeof hotelManagerSignupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ActivateCapacityInput = z.infer<typeof activateCapacitySchema>;
export type VerifyCapacityInput = z.infer<typeof verifyCapacitySchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;