// Exportar serviços
export { authService } from './services/authService.js';

// Exportar tipos de entrada para autenticação (movidos para shared/types.ts)
export type {
  CreateClientInput,
  ActivateDriverCapacityInput,
  ActivateHotelManagerCapacityInput,
  UploadVerificationDocumentInput,
  ApproveCapabilityInput,
  RejectCapabilityInput
} from '../../../shared/types.js';

// Exportar schemas
export {
  baseSignupSchema,
  clientSignupSchema,
  driverSignupSchema,
  hotelManagerSignupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  activateCapacitySchema,
  verifyCapacitySchema,
  uploadDocumentSchema,
  updateProfileSchema
} from './schemas/authSchemas.js';

export type {
  ClientSignupInput,
  DriverSignupInput,
  HotelManagerSignupInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ActivateCapacityInput,
  VerifyCapacityInput,
  UploadDocumentInput,
  UpdateProfileInput
} from './schemas/authSchemas.js';

// Exportar tipos
export type {
  ApiResponse,
  UserProfileResponse,
  SignupResponse,
  CapacityActivationResponse,
  ForgotPasswordResponse,
  PendingVerificationsResponse,
  UserWithDocuments,
  UsersFilter,
  EmailTemplateData,
  EmailService,
  FirebaseUser,
  FirebaseAuthService,
  DocumentUploadResult,
  DocumentService,
  AuthServiceInterface
} from './types/authTypes.js';