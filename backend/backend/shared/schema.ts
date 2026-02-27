// shared/schema.ts - VERSÃO COMPLETA FINAL (24/02/2026)
// ✅ INCLUI TODAS AS TABELAS DE CAPACIDADES E GESTÃO DE PAGAMENTOS
// ✅ INCLUI TABELAS DE RECLAMAÇÕES E VALIDAÇÕES
// ✅ MANTÉM TODO O CÓDIGO EXISTENTE INTACTO

import { sql } from "drizzle-orm";
import {
  pgTable, text, varchar, timestamp, numeric, integer, boolean,
  jsonb, index, uuid, uniqueIndex, primaryKey, pgEnum, date
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== ENUMS GLOBAIS ====================
export const statusEnum = pgEnum("status", [
  'pending', 'active', 'available', 'confirmed', 'cancelled',
  'completed', 'expired', 'in_progress', 'checked_in', 'checked_out',
  'approved', 'rejected', 'pending_payment'
]);
export const serviceTypeEnum = pgEnum("service_type", ['ride', 'accommodation', 'event', 'hotel']);
export const userTypeEnum = pgEnum("user_type", ['client', 'driver', 'host', 'admin']);
export const partnershipLevelEnum = pgEnum("partnership_level", ['bronze', 'silver', 'gold', 'platinum']);
export const verificationStatusEnum = pgEnum("verification_status", ['pending', 'in_review', 'verified', 'rejected', 'suspended']);
export const paymentMethodEnum = pgEnum("payment_method", ['card', 'mpesa', 'bank', 'mobile_money', 'bank_transfer', 'pending']);
export const rideTypeEnum = pgEnum("ride_type", ['regular', 'premium', 'shared', 'express']);
export const vehicleTypeEnum = pgEnum("vehicle_type", ['economy', 'comfort', 'luxury', 'family', 'premium', 'van', 'suv']);

// ==================== ENUMS PARA SISTEMA HOTELEIRO E PAGAMENTOS ====================
export const bookingStatusEnum = pgEnum("booking_status", [
  'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  'pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled', 'expired', 'partial'
]);
export const paymentTypeEnum = pgEnum("payment_type", ['deposit', 'partial', 'final', 'full']);
export const roomStatusEnum = pgEnum("room_status", [
  'available', 'occupied', 'maintenance', 'cleaning', 'out_of_service'
]);

// ==================== ENUMS PARA SISTEMA DE REVIEWS ====================
export const reportReasonEnum = pgEnum("report_reason", ['inappropriate', 'fake', 'spam', 'offensive', 'other']);
export const reportStatusEnum = pgEnum("report_status", ['pending', 'reviewed', 'resolved', 'dismissed']);

// ==================== ENUMS PARA SISTEMA DE CAPACIDADES E PAGAMENTOS ====================
export const accountTypeEnum = pgEnum("account_type", ['individual', 'company']);
export const capabilityTypeEnum = pgEnum("capability_type", ['driver', 'hotel_manager', 'admin', 'book_services']);
export const providerTypeEnum = pgEnum("provider_type", ['driver', 'hotel', 'event_space']);
export const payoutStatusEnum = pgEnum("payout_status", ['pending', 'processing', 'paid', 'failed']);

// ==================== ENUMS PARA RECLAMAÇÕES ====================
export const complaintTypeEnum = pgEnum("complaint_type", [
  'client_to_provider', 'provider_to_client', 'platform_issue'
]);
export const complaintStatusEnum = pgEnum("complaint_status", [
  'new', 'investigating', 'resolved', 'dismissed'
]);
export const complaintPriorityEnum = pgEnum("complaint_priority", [
  'low', 'medium', 'high', 'urgent'
]);

// ==================== TABELAS BASE (EXISTENTES) ====================
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: index("sessions_expire_idx").on(table.expire),
  })
);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("firstName"),
  lastName: varchar("lastName"),
  fullName: text("fullName"),
  profileImageUrl: varchar("profileImageUrl"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  phone: text("phone").unique(),
  // ✅ NOVO (25/02/2026) - Firebase UID sincronizado automaticamente
  firebase_uid: varchar("firebase_uid", { length: 255 }).unique(),
  userType: userTypeEnum("userType").default('client'),
  roles: text("roles").array().default(sql`ARRAY[]::text[]`),
  canOfferServices: boolean("canOfferServices").default(false),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00"),
  totalReviews: integer("totalReviews").default(0),
  isVerified: boolean("isVerified").default(false),
  verificationStatus: verificationStatusEnum("verificationStatus").default('pending'),
  verificationDate: timestamp("verificationDate"),
  verificationNotes: text("verificationNotes"),
  identityDocumentUrl: text("identityDocumentUrl"),
  identityDocumentType: text("identityDocumentType"),
  documentNumber: text("documentNumber"),
  dateOfBirth: timestamp("dateOfBirth"),
  registrationCompleted: boolean("registrationCompleted").default(false),
  verificationBadge: text("verificationBadge"),
  badgeEarnedDate: timestamp("badgeEarnedDate"),
  
  // SISTEMA DE CAPACIDADES
  canBookServices: boolean("can_book_services").default(true),
  canDrive: boolean("can_drive").default(false),
  canManageHotels: boolean("can_manage_hotels").default(false),
  isAdmin: boolean("is_admin").default(false),
  
  driverVerificationStatus: verificationStatusEnum("driver_verification_status"),
  driverVerificationNotes: text("driver_verification_notes"),
  driverVerifiedAt: timestamp("driver_verified_at"),
  
  hotelManagerVerificationStatus: verificationStatusEnum("hotel_manager_verification_status"),
  hotelManagerVerificationNotes: text("hotel_manager_verification_notes"),
  hotelManagerVerifiedAt: timestamp("hotel_manager_verified_at"),
  
  driverLicenseNumber: varchar("driver_license_number", { length: 50 }),
  driverLicenseCountry: varchar("driver_license_country", { length: 50 }).default('Moçambique'),
  driverLicenseExpiry: date("driver_license_expiry"),
  driverVehicleType: varchar("driver_vehicle_type", { length: 50 }),
  driverYearsExperience: integer("driver_years_experience"),
  
  businessTaxId: varchar("business_tax_id", { length: 50 }),
  businessRegistrationNumber: varchar("business_registration_number", { length: 100 }),
  businessLegalName: varchar("business_legal_name", { length: 255 }),
  
  accountType: accountTypeEnum("account_type").default('individual'),
  companyName: varchar("company_name", { length: 255 }),
  companyVatNumber: varchar("company_vat_number", { length: 50 }),
  companyAddress: text("company_address"),
  companyPhone: varchar("company_phone", { length: 50 }),
  
  capabilitiesUpdatedAt: timestamp("capabilities_updated_at"),
  lastCapacityActivation: timestamp("last_capacity_activation"),
  
  // NOVAS COLUNAS PARA CLIENTES (24/02/2026)
  clientVerificationStatus: verificationStatusEnum("client_verification_status").default('verified'),
  clientVerificationNotes: text("client_verification_notes"),
  clientVerifiedAt: timestamp("client_verified_at"),
  clientSuspendedAt: timestamp("client_suspended_at"),
  clientSuspensionReason: text("client_suspension_reason"),
  clientSuspensionEndDate: date("client_suspension_end_date"),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  phoneIdx: index("users_phone_idx").on(table.phone),
  firebaseUidIdx: index("users_firebase_uid_idx").on(table.firebase_uid),
  userTypeIdx: index("users_user_type_idx").on(table.userType),
  canBookServicesIdx: index("users_can_book_services_idx").on(table.canBookServices),
  canDriveIdx: index("users_can_drive_idx").on(table.canDrive),
  canManageHotelsIdx: index("users_can_manage_hotels_idx").on(table.canManageHotels),
  isAdminIdx: index("users_is_admin_idx").on(table.isAdmin),
  driverVerificationStatusIdx: index("users_driver_verification_status_idx").on(table.driverVerificationStatus),
  hotelManagerVerificationStatusIdx: index("users_hotel_manager_verification_status_idx").on(table.hotelManagerVerificationStatus),
  accountTypeIdx: index("users_account_type_idx").on(table.accountType),
  clientVerificationStatusIdx: index("users_client_verification_status_idx").on(table.clientVerificationStatus),
}));

// ==================== NOVAS TABELAS DE PERFIS ESPECIALIZADOS (25/02/2026) ====================

// Tabela de perfis de motoristas
export const driverProfiles = pgTable("driver_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  license_number: varchar("license_number", { length: 50 }).notNull(),
  license_country: varchar("license_country", { length: 50 }).default('Moçambique'),
  license_expiry: date("license_expiry").notNull(),
  vehicle_type: varchar("vehicle_type", { length: 100 }),
  years_experience: integer("years_experience").default(0),
  verification_status: text("verification_status").default('pending'),
  documents: jsonb("documents"),
  notes: text("notes"),
  rejected_reason: text("rejected_reason"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  user_idx: index("driver_profiles_user_id_idx").on(table.user_id),
  verification_idx: index("driver_profiles_verification_status_idx").on(table.verification_status),
  license_idx: index("driver_profiles_license_number_idx").on(table.license_number),
}));

// Tabela de perfis de gestores de hotéis
export const hotelManagerProfiles = pgTable("hotel_manager_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  business_tax_id: varchar("business_tax_id", { length: 50 }).notNull().unique(),
  business_registration_number: varchar("business_registration_number", { length: 100 }),
  business_legal_name: varchar("business_legal_name", { length: 255 }).notNull(),
  business_address: text("business_address"),
  business_phone: varchar("business_phone", { length: 50 }),
  business_email: varchar("business_email", { length: 255 }),
  verification_status: text("verification_status").default('pending'),
  documents: jsonb("documents"),
  notes: text("notes"),
  rejected_reason: text("rejected_reason"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  user_idx: index("hotel_manager_profiles_user_id_idx").on(table.user_id),
  verification_idx: index("hotel_manager_profiles_verification_status_idx").on(table.verification_status),
  tax_idx: index("hotel_manager_profiles_business_tax_id_idx").on(table.business_tax_id),
}));

// Tabela de perfis de gestores de espaços para eventos
export const eventSpaceManagerProfiles = pgTable("event_space_manager_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  business_tax_id: varchar("business_tax_id", { length: 50 }).notNull().unique(),
  business_registration_number: varchar("business_registration_number", { length: 100 }),
  business_legal_name: varchar("business_legal_name", { length: 255 }).notNull(),
  verification_status: text("verification_status").default('pending'),
  documents: jsonb("documents"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  user_idx: index("event_space_manager_profiles_user_id_idx").on(table.user_id),
  verification_idx: index("event_space_manager_profiles_verification_status_idx").on(table.verification_status),
}));

// Tabela de rastreamento de documentos de verificação
export const verificationDocuments = pgTable("verification_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  profile_type: text("profile_type").notNull(),
  document_type: text("document_type").notNull(),
  document_url: text("document_url").notNull(),
  document_number: varchar("document_number", { length: 100 }),
  expiry_date: date("expiry_date"),
  verification_status: text("verification_status").default('pending'),
  reviewer_id: text("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  review_notes: text("review_notes"),
  reviewed_at: timestamp("reviewed_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  user_idx: index("verification_documents_user_id_idx").on(table.user_id),
  profile_type_idx: index("verification_documents_profile_type_idx").on(table.profile_type),
  verification_idx: index("verification_documents_verification_status_idx").on(table.verification_status),
}));

// Tabela de auditoria de mudanças nas capacidades
export const capabilityChangesLog = pgTable("capability_changes_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  capability: text("capability").notNull(),
  old_value: boolean("old_value"),
  new_value: boolean("new_value"),
  reason: text("reason"),
  changed_by: text("changed_by").references(() => users.id, { onDelete: "set null" }),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  user_idx: index("capability_changes_log_user_id_idx").on(table.user_id),
  created_at_idx: index("capability_changes_log_created_at_idx").on(table.created_at),
}));

// ==================== TABELA DE MAPEAMENTO FIREBASE (25/02/2026) ====================
// Sincroniza Firebase UID com users.firebase_uid
export const firebase_user_mapping = pgTable("firebase_user_mapping", {
  firebase_uid: varchar("firebase_uid", { length: 255 }).primaryKey(),
  user_id: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  user_idx: index("firebase_user_mapping_user_id_idx").on(table.user_id),
}));

// ==================== TABELA DE DOCUMENTOS DE CAPACIDADE ====================
export const userCapacityDocuments = pgTable("user_capacity_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  capacity: varchar("capacity", { length: 50 }).notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(),
  documentUrl: text("document_url").notNull(),
  documentNumber: varchar("document_number", { length: 100 }),
  expiryDate: date("expiry_date"),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: text("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"),
  reviewNotes: text("review_notes"),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdx: index("user_capacity_documents_user_idx").on(table.userId),
  capacityIdx: index("user_capacity_documents_capacity_idx").on(table.capacity),
  statusIdx: index("user_capacity_documents_status_idx").on(table.isVerified, table.capacity),
}));

// ==================== TABELAS PARA SISTEMA DE CAPACIDADES ====================

// Tabela de histórico de capabilities
export const capabilityAuditLog = pgTable("capability_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  capability_type: capabilityTypeEnum("capability_type").notNull(),
  old_value: boolean("old_value"),
  new_value: boolean("new_value"),
  old_status: verificationStatusEnum("old_status"),
  new_status: verificationStatusEnum("new_status"),
  changed_by: text("changed_by").references(() => users.id),
  reason: text("reason"),
  metadata: jsonb("metadata").default({}),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  user_idx: index("capability_audit_log_user_idx").on(table.user_id),
  changed_by_idx: index("capability_audit_log_changed_by_idx").on(table.changed_by),
  created_at_idx: index("capability_audit_log_created_at_idx").on(table.created_at),
}));

// ==================== TABELAS PARA SISTEMA DE PAGAMENTOS ====================

// Configuração de comissões (12% editável)
export const platformFeeConfig = pgTable("platform_fee_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  service_type: varchar("service_type", { length: 20 }).notNull(), // 'ride', 'hotel', 'event'
  fee_percentage: numeric("fee_percentage", { precision: 5, scale: 2 }).notNull().default("12.00"),
  min_fee_amount: numeric("min_fee_amount", { precision: 10, scale: 2 }).default("0"),
  max_fee_amount: numeric("max_fee_amount", { precision: 10, scale: 2 }),
  is_active: boolean("is_active").default(true),
  effective_from: date("effective_from").notNull().default(sql`CURRENT_DATE`),
  effective_to: date("effective_to"),
  created_by: text("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  service_type_idx: index("platform_fee_config_service_type_idx").on(table.service_type),
  active_idx: index("platform_fee_config_active_idx").on(table.is_active),
}));

// Entidades únicas por usuário
export const userEntities = pgTable("user_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().unique().references(() => users.id),
  entity_code: varchar("entity_code", { length: 20 }).notNull().unique(),
  entity_prefix: varchar("entity_prefix", { length: 5 }).notNull(),
  default_bank_id: uuid("default_bank_id"),
  is_active: boolean("is_active").default(true),
  verified_at: timestamp("verified_at"),
  verified_by: text("verified_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  user_idx: index("user_entities_user_idx").on(table.user_id),
  entity_code_idx: index("user_entities_entity_code_idx").on(table.entity_code),
}));

// Contas bancárias dos usuários
export const userBankAccounts = pgTable("user_bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().references(() => users.id),
  entity_id: uuid("entity_id").references(() => userEntities.id, { onDelete: "cascade" }),
  account_type: varchar("account_type", { length: 20 }).notNull(), // 'bank', 'mpesa', 'emola'
  bank_name: varchar("bank_name", { length: 100 }),
  account_number: varchar("account_number", { length: 50 }),
  account_holder: varchar("account_holder", { length: 200 }),
  iban: varchar("iban", { length: 50 }),
  swift: varchar("swift", { length: 20 }),
  mpesa_number: varchar("mpesa_number", { length: 20 }),
  is_default: boolean("is_default").default(false),
  is_active: boolean("is_active").default(true),
  verified_at: timestamp("verified_at"),
  verified_by: text("verified_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  user_idx: index("user_bank_accounts_user_idx").on(table.user_id),
  entity_idx: index("user_bank_accounts_entity_idx").on(table.entity_id),
  default_idx: index("user_bank_accounts_default_idx").on(table.user_id, table.is_default),
}));

// Referências de pagamento
export const paymentReferences = pgTable("payment_references", {
  id: uuid("id").primaryKey().defaultRandom(),
  reference_number: varchar("reference_number", { length: 50 }).notNull().unique(),
  booking_id: uuid("booking_id").notNull(),
  booking_type: varchar("booking_type", { length: 20 }).notNull(),
  provider_user_id: text("provider_user_id").notNull().references(() => users.id),
  provider_entity_id: uuid("provider_entity_id").references(() => userEntities.id),
  provider_entity_code: varchar("provider_entity_code", { length: 20 }),
  client_user_id: text("client_user_id").references(() => users.id),
  gross_amount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(),
  fee_percentage: numeric("fee_percentage", { precision: 5, scale: 2 }).notNull().default("12.00"),
  fee_amount: numeric("fee_amount", { precision: 10, scale: 2 }).default(sql`gross_amount * (fee_percentage / 100)`),
  net_amount: numeric("net_amount", { precision: 10, scale: 2 }).default(sql`gross_amount - (gross_amount * (fee_percentage / 100))`),
  service_date: date("service_date").notNull(),
  due_date: date("due_date").default(sql`service_date + INTERVAL '30 days'`),
  status: varchar("status", { length: 20 }).default('pending'),
  paid_at: timestamp("paid_at"),
  payment_method: varchar("payment_method", { length: 50 }),
  payment_proof_url: text("payment_proof_url"),
  confirmed_by: text("confirmed_by").references(() => users.id),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  reference_idx: index("payment_references_reference_idx").on(table.reference_number),
  booking_idx: index("payment_references_booking_idx").on(table.booking_id, table.booking_type),
  provider_idx: index("payment_references_provider_idx").on(table.provider_user_id),
  status_idx: index("payment_references_status_idx").on(table.status),
  due_date_idx: index("payment_references_due_date_idx").on(table.due_date).where(sql`status = 'pending'`),
}));

// Payouts para provedores
export const providerPayouts = pgTable("provider_payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  payout_reference: varchar("payout_reference", { length: 50 }).notNull().unique(),
  provider_id: text("provider_id").notNull().references(() => users.id),
  provider_type: providerTypeEnum("provider_type").notNull(),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),
  total_gross: numeric("total_gross", { precision: 10, scale: 2 }).notNull(),
  total_fees: numeric("total_fees", { precision: 10, scale: 2 }).notNull(),
  total_net: numeric("total_net", { precision: 10, scale: 2 }).notNull(),
  status: payoutStatusEnum("status").default('pending'),
  payment_method: varchar("payment_method", { length: 50 }),
  payment_reference: varchar("payment_reference", { length: 100 }),
  paid_at: timestamp("paid_at"),
  confirmed_by: text("confirmed_by").references(() => users.id),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  provider_idx: index("provider_payouts_provider_idx").on(table.provider_id, table.provider_type),
  period_idx: index("provider_payouts_period_idx").on(table.period_start, table.period_end),
  status_idx: index("provider_payouts_status_idx").on(table.status),
}));

// Relação entre payouts e referências
export const payoutReferences = pgTable("payout_references", {
  payout_id: uuid("payout_id").references(() => providerPayouts.id, { onDelete: "cascade" }).notNull(),
  payment_reference_id: uuid("payment_reference_id").references(() => paymentReferences.id).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  allocated_at: timestamp("allocated_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.payout_id, table.payment_reference_id] }),
  payout_idx: index("payout_references_payout_idx").on(table.payout_id),
  reference_idx: index("payout_references_reference_idx").on(table.payment_reference_id),
}));

// Sequências para referências
export const paymentSequences = pgTable("payment_sequences", {
  provider_id: text("provider_id").notNull(),
  provider_type: varchar("provider_type", { length: 20 }).notNull(),
  financial_year: integer("financial_year").notNull(),
  last_sequence: integer("last_sequence").default(0),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.provider_id, table.provider_type, table.financial_year] }),
}));

// Validações de comprovativos de pagamento
export const paymentProofValidations = pgTable("payment_proof_validations", {
  id: uuid("id").primaryKey().defaultRandom(),
  payment_id: uuid("payment_id").notNull(),
  validator_id: text("validator_id").references(() => users.id),
  validation_status: varchar("validation_status", { length: 20 }).notNull().default('pending'),
  validation_notes: text("validation_notes"),
  rejection_reason: text("rejection_reason"),
  validated_at: timestamp("validated_at"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  payment_idx: index("payment_proof_validations_payment_idx").on(table.payment_id),
  status_idx: index("payment_proof_validations_status_idx").on(table.validation_status),
}));

// ==================== TABELAS DE RECLAMAÇÕES/DENÚNCIAS ====================

export const complaints = pgTable("complaints", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporter_id: text("reporter_id").references(() => users.id).notNull(),
  reported_id: text("reported_id").references(() => users.id),
  complaint_type: complaintTypeEnum("complaint_type").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  booking_id: uuid("booking_id"),
  booking_type: varchar("booking_type", { length: 20 }),
  description: text("description").notNull(),
  status: complaintStatusEnum("status").default('new'),
  priority: complaintPriorityEnum("priority").default('medium'),
  assigned_admin_id: text("assigned_admin_id").references(() => users.id),
  resolution: text("resolution"),
  resolved_at: timestamp("resolved_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  reporter_idx: index("complaints_reporter_idx").on(table.reporter_id),
  reported_idx: index("complaints_reported_idx").on(table.reported_id),
  status_idx: index("complaints_status_idx").on(table.status),
  priority_idx: index("complaints_priority_idx").on(table.priority),
  assigned_idx: index("complaints_assigned_idx").on(table.assigned_admin_id),
}));

export const complaintAttachments = pgTable("complaint_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  complaint_id: uuid("complaint_id").references(() => complaints.id, { onDelete: "cascade" }).notNull(),
  file_url: text("file_url").notNull(),
  file_type: varchar("file_type", { length: 50 }),
  uploaded_by: text("uploaded_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => ({
  complaint_idx: index("complaint_attachments_complaint_idx").on(table.complaint_id),
}));

// ==================== TABELAS DE FATURAS DE PROVEDORES ====================

export const providerInvoices = pgTable("provider_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoice_number: varchar("invoice_number", { length: 50 }).unique().notNull(),
  provider_id: text("provider_id").notNull().references(() => users.id),
  provider_type: providerTypeEnum("provider_type").notNull(),
  period_start: date("period_start").notNull(),
  period_end: date("period_end").notNull(),
  total_gross_amount: numeric("total_gross_amount", { precision: 10, scale: 2 }).notNull(),
  platform_fee: numeric("platform_fee", { precision: 10, scale: 2 }).notNull(),
  net_amount: numeric("net_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default('pending'),
  issued_date: date("issued_date"),
  due_date: date("due_date"),
  paid_date: date("paid_date"),
  payment_method: varchar("payment_method", { length: 50 }),
  payment_reference: varchar("payment_reference", { length: 100 }),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  provider_idx: index("provider_invoices_provider_idx").on(table.provider_id, table.provider_type),
  period_idx: index("provider_invoices_period_idx").on(table.period_start, table.period_end),
  status_idx: index("provider_invoices_status_idx").on(table.status),
}));

export const invoicePayments = pgTable("invoice_payments", {
  invoice_id: uuid("invoice_id").references(() => providerInvoices.id, { onDelete: "cascade" }).notNull(),
  payment_id: uuid("payment_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  allocated_at: timestamp("allocated_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.invoice_id, table.payment_id] }),
  invoice_idx: index("invoice_payments_invoice_idx").on(table.invoice_id),
}));

// ==================== TABELAS DE LOCALIZAÇÃO ====================
export const mozambiqueLocations = pgTable("mozambique_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }),
  district: varchar("district", { length: 100 }),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  geom: text("geom"),
  type: varchar("type", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  nameIdx: index("locations_name_idx").on(table.name),
  provinceIdx: index("locations_province_idx").on(table.province),
  geoIdx: index("locations_geo_idx").on(table.lat, table.lng),
  typeIdx: index("locations_type_idx").on(table.type),
}));

// ==================== SISTEMA DE TRANSPORTE ====================
export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  driver_id: text("driver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  plate_number: varchar("plate_number", { length: 20 }).notNull().unique(),
  plate_number_raw: varchar("plate_number_raw", { length: 20 }).notNull(),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }).notNull(),
  year: integer("year"),
  vehicle_type: vehicleTypeEnum("vehicle_type").notNull(),
  max_passengers: integer("max_passengers").notNull(),
  features: text("features").array().default(sql`ARRAY[]::text[]`),
  photo_url: text("photo_url"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  driverIdx: index("vehicles_driver_idx").on(table.driver_id),
  plateIdx: index("vehicles_plate_idx").on(table.plate_number),
  activeIdx: index("vehicles_active_idx").on(table.is_active).where(sql`is_active = true`),
  typeIdx: index("vehicles_type_idx").on(table.vehicle_type),
}));

export const rides = pgTable("rides", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: text("driverId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  driverName: text("driverName"),
  fromAddress: varchar("fromAddress", { length: 255 }).notNull(),
  toAddress: varchar("toAddress", { length: 255 }).notNull(),
  fromCity: varchar("fromCity", { length: 100 }),
  toCity: varchar("toCity", { length: 100 }),
  fromDistrict: varchar("fromDistrict", { length: 100 }),
  toDistrict: varchar("toDistrict", { length: 100 }),
  fromLocality: varchar("fromLocality", { length: 100 }),
  fromProvince: varchar("fromProvince", { length: 100 }),
  toLocality: varchar("toLocality", { length: 100 }),
  toProvince: varchar("toProvince", { length: 100 }),
  departureDate: timestamp("departureDate").notNull(),
  departureTime: text("departureTime").notNull(),
  availableSeats: integer("availableSeats").notNull(),
  maxPassengers: integer("maxPassengers").default(4),
  pricePerSeat: varchar("pricePerSeat").notNull(),
  vehicleType: varchar("vehicleType", { length: 50 }),
  vehicle_uuid: uuid("vehicle_uuid").references(() => vehicles.id, { onDelete: "set null" }),
  additionalInfo: text("additionalInfo"),
  status: statusEnum("status").default('available'),
  type: rideTypeEnum("type").default("regular"),
  from_geom: text("from_geom"),
  to_geom: text("to_geom"),
  distance_real_km: numeric("distance_real_km", { precision: 10, scale: 2 }),
  polyline: text("polyline"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  fromLocationIdx: index("rides_from_location_idx").on(table.fromLocality, table.fromProvince),
  toLocationIdx: index("rides_to_location_idx").on(table.toLocality, table.toProvince),
  fromCityIdx: index("rides_from_city_idx").on(table.fromCity),
  toCityIdx: index("rides_to_city_idx").on(table.toCity),
  statusIdx: index("rides_status_idx").on(table.status),
  driverIdx: index("rides_driver_idx").on(table.driverId),
  fromDistrictIdx: index("rides_from_district_idx").on(table.fromDistrict),
  toDistrictIdx: index("rides_to_district_idx").on(table.toDistrict),
  vehicleIdx: index("rides_vehicle_idx").on(table.vehicle_uuid),
  departureDateIdx: index("rides_departure_date_idx").on(table.departureDate),
}));

// ==================== TABELA PRINCIPAL DE HOTÉIS ====================
export const hotels = pgTable("hotels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  address: text("address").notNull(),
  locality: varchar("locality", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).default('Moçambique'),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  location_geom: text("location_geom"),
  location_id: uuid("location_id").references(() => mozambiqueLocations.id, { onDelete: "set null" }),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  contact_email: text("contact_email").notNull(),
  contact_phone: text("contact_phone"),
  host_id: text("host_id").references(() => users.id, { onDelete: "set null" }),
  check_in_time: text("check_in_time").default('14:00:00'),
  check_out_time: text("check_out_time").default('12:00:00'),
  policies: text("policies"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00"),
  total_reviews: integer("total_reviews").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  created_by: text("created_by").references(() => users.id),
  updated_by: text("updated_by").references(() => users.id),
}, (table) => ({
  nameIdx: index("hotels_name_idx").on(table.name),
  slugIdx: uniqueIndex("hotels_slug_key").on(table.slug),
  locationIdx: index("hotels_location_idx").on(table.locality, table.province),
  activeIdx: index("hotels_active_idx").on(table.is_active).where(sql`is_active = true`),
  hostIdx: index("hotels_host_idx").on(table.host_id),
  ratingIdx: index("hotels_rating_idx").on(table.rating),
  locationIdIdx: index("hotels_location_id_idx").on(table.location_id).where(sql`location_id IS NOT NULL`),
}));

// ==================== TIPOS DE QUARTO ====================
export const roomTypes = pgTable("room_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotel_id: uuid("hotel_id").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 50 }),
  description: text("description"),
  capacity: integer("capacity"),
  base_price: numeric("base_price", { precision: 10, scale: 2 }),
  extra_adult_price: numeric("extra_adult_price", { precision: 10, scale: 2 }),
  extra_child_price: numeric("extra_child_price", { precision: 10, scale: 2 }),
  base_occupancy: integer("base_occupancy"),
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  total_units: integer("total_units"),
  is_active: boolean("is_active"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
  base_price_low: numeric("base_price_low"),
  base_price_high: numeric("base_price_high"),
  min_nights_default: integer("min_nights_default"),
  extra_night_price: numeric("extra_night_price"),
}, (table) => ({
  hotelIdx: index("room_types_hotel_idx").on(table.hotel_id),
  activeIdx: index("room_types_active_idx").on(table.is_active).where(sql`is_active = true`),
  priceIdx: index("room_types_price_idx").on(table.base_price),
}));

// ==================== FOTOS DE TIPOS DE QUARTO ====================
export const roomTypePhotos = pgTable('room_type_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  room_type_id: uuid('room_type_id').notNull().references(() => roomTypes.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  alt_text: varchar('alt_text', { length: 255 }),
  order: integer('order').default(0),
  is_featured: boolean('is_featured').default(false),
  is_primary: boolean('is_primary').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  roomTypeIdx: index('room_type_photos_room_type_id_idx').on(table.room_type_id),
  featuredIdx: index('room_type_photos_featured_idx').on(table.room_type_id, table.is_featured),
}));

// ==================== DISPONIBILIDADE DE QUARTOS ====================
export const roomAvailability = pgTable("roomAvailability", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  roomTypeId: uuid("roomTypeId").references(() => roomTypes.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date", { mode: 'date' }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }),
  availableUnits: integer("availableUnits").notNull().default(0),
  stopSell: boolean("stopSell").default(false),
  minStay: integer("minStay").default(1),
  maxStay: integer("maxStay"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  minNights: integer("minNights"),
  blockedReason: text("blockedReason"),
  maxAvailableUnits: integer("maxAvailableUnits"),
}, (table) => ({
  roomTypeDateIdx: index("room_availability_room_type_date_idx").on(table.roomTypeId, table.date),
  hotelDateIdx: index("room_availability_hotel_date_idx").on(table.hotelId, table.date),
  dateIdx: index("room_availability_date_idx").on(table.date),
  availableIdx: index("room_availability_available_idx").on(table.availableUnits).where(sql`availableUnits > 0`),
}));

// ==================== TABELAS DE RESERVAS HOTELEIRAS ====================
export const hotelBookings = pgTable("hotelBookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  roomTypeId: uuid("roomTypeId").references(() => roomTypes.id, { onDelete: "cascade" }).notNull(),
  roomId: uuid("roomId"),
  guestName: text("guestName").notNull(),
  guestEmail: text("guestEmail").notNull(),
  guestPhone: text("guestPhone"),
  checkIn: date("checkIn").notNull(),
  checkOut: date("checkOut").notNull(),
  nights: integer("nights").notNull(),
  units: integer("units").notNull().default(1),
  adults: integer("adults").notNull().default(2),
  children: integer("children").notNull().default(0),
  basePrice: numeric("basePrice", { precision: 10, scale: 2 }).notNull(),
  extraCharges: numeric("extraCharges", { precision: 10, scale: 2 }).default("0"),
  totalPrice: numeric("totalPrice", { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric("discountAmount", { precision: 10, scale: 2 }).default("0"),
  baseTotalPrice: numeric("baseTotalPrice", { precision: 10, scale: 2 }),
  promoCode: text("promoCode"),
  longStayDiscountPercent: numeric("longStayDiscountPercent", { precision: 5, scale: 2 }).default("0"),
  longStayDiscountAmount: numeric("longStayDiscountAmount", { precision: 10, scale: 2 }).default("0"),
  longStayTier: text("longStayTier"),
  specialRequests: text("specialRequests"),
  cancellationReason: text("cancellationReason"),
  status: text("status").notNull().default('confirmed'),
  paymentStatus: text("paymentStatus").notNull().default('pending'),
  paymentReference: text("paymentReference"),
  invoiceNumber: text("invoiceNumber"),
  reservationToken: text("reservationToken"),
  checkedInAt: timestamp("checkedInAt", { withTimezone: true }),
  checkedOutAt: timestamp("checkedOutAt", { withTimezone: true }),
  cancelledAt: timestamp("cancelledAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
  confirmedAt: timestamp("confirmedAt", { withTimezone: false }),
  confirmedBy: text("confirmedBy"),
  holdExpiresAt: timestamp("holdExpiresAt", { withTimezone: false }),
  companyId: uuid("companyId"),
  reminderSent: boolean("reminderSent").default(false),
  lastReminderSent: timestamp("lastReminderSent", { withTimezone: false }),
  reminderCount: integer("reminderCount").default(0),
  userId: uuid("userId"),
}, (table) => ({
  hotelIdx: index("hotelBookings_hotelId_idx").on(table.hotelId),
  guestEmailIdx: index("hotelBookings_guestEmail_idx").on(table.guestEmail),
  datesIdx: index("hotelBookings_dates_idx").on(table.checkIn, table.checkOut),
  statusIdx: index("hotelBookings_status_idx").on(table.status),
  paymentStatusIdx: index("hotelBookings_paymentStatus_idx").on(table.paymentStatus),
  roomTypeIdx: index("hotelBookings_roomTypeId_idx").on(table.roomTypeId),
  createdAtIdx: index("hotelBookings_createdAt_idx").on(table.createdAt),
}));

// ==================== TABELA DE PAGAMENTOS HOTELEIROS ====================
export const hotelPayments = pgTable("hotel_payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  booking_id: uuid("booking_id").references(() => hotelBookings.id, { onDelete: "cascade" }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  payment_method: text("payment_method").notNull(),
  payment_reference: text("payment_reference"),
  notes: text("notes"),
  payment_type: text("payment_type", { enum: ["partial", "full"] }),
  status: text("status").notNull().default('paid'),
  confirmed_by: text("confirmed_by"),
  proof_image_url: text("proof_image_url"),
  paid_at: timestamp("paid_at", { withTimezone: true }).defaultNow(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  is_manual: boolean("is_manual").default(true),
}, (table) => ({
  bookingIdx: index("idx_hotel_payments_booking_id").on(table.booking_id),
  statusIdx: index("idx_hotel_payments_status").on(table.status),
  paidAtIdx: index("idx_hotel_payments_paid_at").on(table.paid_at),
}));

export const hotelBookingUnits = pgTable("hotelBookingUnits", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("bookingId").references(() => hotelBookings.id, { onDelete: "cascade" }).notNull(),
  roomTypeId: uuid("roomTypeId").references(() => roomTypes.id, { onDelete: "cascade" }).notNull(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  unitNumber: integer("unitNumber").notNull(),
  status: text("status").notNull().default('reserved'),
  createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: false }).defaultNow(),
}, (table) => ({
  bookingIdx: index("hotelBookingUnits_bookingId_idx").on(table.bookingId),
  dateStatusIdx: index("hotelBookingUnits_date_status_idx").on(table.date, table.status),
  uniqueUnitPerDate: uniqueIndex("unique_unit_per_date").on(
    table.hotelId,
    table.roomTypeId,
    table.date,
    table.unitNumber
  ),
}));

export const hotelBookingLogs = pgTable("hotelBookingLogs", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("bookingId").references(() => hotelBookings.id, { onDelete: "cascade" }).notNull(),
  action: text("action").notNull(),
  performedBy: text("performedBy").notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt", { withTimezone: false }).defaultNow(),
}, (table) => ({
  bookingIdx: index("hotelBookingLogs_bookingId_idx").on(table.bookingId),
  createdAtIdx: index("hotelBookingLogs_createdAt_idx").on(table.createdAt),
}));

export const hotelPromotions = pgTable("hotel_promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotel_id: uuid("hotel_id").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  room_type_id: uuid("room_type_id").references(() => roomTypes.id, { onDelete: "cascade" }),
  promo_code: text("promo_code").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  discount_percent: integer("discount_percent"),
  discount_amount: numeric("discount_amount", { precision: 10, scale: 2 }),
  start_date: timestamp("start_date", { mode: 'date' }).notNull(),
  end_date: timestamp("end_date", { mode: 'date' }).notNull(),
  max_uses: integer("max_uses"),
  current_uses: integer("current_uses").default(0),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  hotelIdx: index("hotel_promotions_hotel_idx").on(table.hotel_id),
  promoCodeIdx: index("hotel_promotions_promo_code_idx").on(table.promo_code),
  activeIdx: index("hotel_promotions_active_idx").on(table.is_active).where(sql`is_active = true`),
  datesIdx: index("hotel_promotions_dates_idx").on(table.start_date, table.end_date),
}));

export const hotelSeasons = pgTable("hotelSeasons", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  multiplier: numeric("multiplier").notNull().default("1.00"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  hotelIdx: index("hotelSeasons_hotelId_idx").on(table.hotelId),
  datesIdx: index("hotelSeasons_dates_idx").on(table.startDate, table.endDate),
  activeIdx: index("hotelSeasons_active_idx").on(table.isActive).where(sql`isActive = true`),
}));

export const longStayDiscountSettings = pgTable("longStayDiscountSettings", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  applyToAllRooms: boolean("applyToAllRooms").default(true),
  excludedRoomTypes: uuid("excludedRoomTypes").array().default(sql`ARRAY[]::uuid[]`),
  tier7NightsPercent: numeric("tier7NightsPercent", { precision: 5, scale: 2 }).default("10.00"),
  tier14NightsPercent: numeric("tier14NightsPercent", { precision: 5, scale: 2 }).default("15.00"),
  tier30NightsPercent: numeric("tier30NightsPercent", { precision: 5, scale: 2 }).default("20.00"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  createdBy: text("createdBy"),
  updatedBy: text("updatedBy"),
}, (table) => ({
  hotelIdx: uniqueIndex("long_stay_discount_settings_hotel_idx").on(table.hotelId),
}));

// ==================== TABELAS DE REVIEWS DE HOTEL ====================
export const hotelReviews = pgTable("hotelReviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("bookingId").references(() => hotelBookings.id, { onDelete: "cascade" }).notNull(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  userId: text("userId").notNull(),
  cleanlinessRating: integer("cleanlinessRating").notNull(),
  comfortRating: integer("comfortRating").notNull(),
  locationRating: integer("locationRating").notNull(),
  facilitiesRating: integer("facilitiesRating").notNull(),
  staffRating: integer("staffRating").notNull(),
  valueRating: integer("valueRating").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  comment: text("comment").notNull(),
  pros: text("pros"),
  cons: text("cons"),
  overallRating: numeric("overallRating", { precision: 3, scale: 2 }).default(sql`(
    ("cleanlinessRating" + "comfortRating" + "locationRating" + "facilitiesRating" + "staffRating" + "valueRating")::numeric / 6.0
  )`),
  isVerified: boolean("isVerified").default(true),
  isPublished: boolean("isPublished").default(true),
  helpfulVotes: integer("helpfulVotes").default(0),
  reportCount: integer("reportCount").default(0),
  hostResponse: text("hostResponse"),
  hostResponseAt: timestamp("hostResponseAt"),
  hostRespondedBy: text("hostRespondedBy"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  hotelIdx: index("hotel_reviews_hotel_id_idx").on(table.hotelId),
  bookingIdx: index("hotel_reviews_booking_id_idx").on(table.bookingId),
  ratingIdx: index("hotel_reviews_overall_rating_idx").on(table.overallRating),
  createdAtIdx: index("hotel_reviews_created_at_idx").on(table.createdAt),
  bookingIdUnique: uniqueIndex("hotel_reviews_booking_id_key").on(table.bookingId),
}));

export const reviewHelpfulVotes = pgTable("reviewHelpfulVotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id").references(() => hotelReviews.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  reviewIdx: index("review_helpful_votes_review_id_idx").on(table.reviewId),
  userReviewUnique: uniqueIndex("review_helpful_votes_review_user_unique").on(table.reviewId, table.userId),
}));

export const reviewReports = pgTable("reviewReports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id").references(() => hotelReviews.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(),
  reason: reportReasonEnum("reason"),
  status: reportStatusEnum("status").default('pending'),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  reviewIdx: index("review_reports_review_id_idx").on(table.reviewId),
  statusIdx: index("review_reports_status_idx").on(table.status),
}));

// ==================== FOTOS DE ESPAÇOS PARA EVENTOS ====================
export const eventSpacePhotos = pgTable('event_space_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  event_space_id: uuid('event_space_id').notNull().references(() => eventSpaces.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  alt_text: varchar('alt_text', { length: 255 }),
  order: integer('order').default(0),
  is_featured: boolean('is_featured').default(false),
  is_primary: boolean('is_primary').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  deleted_at: timestamp('deleted_at'),
}, (table) => ({
  eventSpaceIdx: index('event_space_photos_event_space_id_idx').on(table.event_space_id),
  featuredIdx: index('event_space_photos_featured_idx').on(table.event_space_id, table.is_featured),
  primaryIdx: index('event_space_photos_primary_idx').on(table.event_space_id, table.is_primary).where(sql`is_primary = true AND deleted_at IS NULL`),
}));

// ==================== ESPAÇOS PARA EVENTOS ====================
export const eventSpaces = pgTable("eventSpaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  capacityMin: integer("capacityMin").notNull().default(10),
  capacityMax: integer("capacityMax").notNull().default(100),
  pricePerDay: numeric("pricePerDay", { precision: 10, scale: 2 }),
  basePricePerDay: numeric("basePricePerDay", { precision: 10, scale: 2 }).notNull().default("0"),
  weekendSurchargePercent: integer("weekendSurchargePercent").default(0),
  eventTypes: text("eventTypes").array().default(sql`ARRAY[]::text[]`),
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  spaceType: text("spaceType"),
  hasStage: boolean("hasStage").default(false),
  naturalLight: boolean("naturalLight").default(false),
  loadingAccess: boolean("loadingAccess").default(false),
  dressingRooms: integer("dressingRooms").default(0),
  insuranceRequired: boolean("insuranceRequired").default(false),
  alcoholAllowed: boolean("alcoholAllowed").default(false),
  floorPlanImage: text("floorPlanImage"),
  virtualTourUrl: text("virtualTourUrl"),
  approvalRequired: boolean("approvalRequired").default(false),
  slug: text("slug").unique(),
  isActive: boolean("isActive").default(true),
  isFeatured: boolean("isFeatured").default(false),
  viewCount: integer("viewCount").default(0),
  averageRating: numeric("averageRating", { precision: 3, scale: 2 }),
  bookingCount: integer("bookingCount").default(0),
  lastBookedDate: date("lastBookedDate"),
  managedByHotelManagerId: uuid("managedByHotelManagerId"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  areaSqm: integer("areaSqm"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  locationGeom: text("locationGeom"),
  mainImage: text("mainImage"),
  termsAndRules: text("termsAndRules"),
  offersCatering: boolean("offersCatering").default(false).notNull(),
  cateringMenuUrls: text("cateringMenuUrls").array().default(sql`ARRAY[]::text[]`).notNull(),
  cateringDiscountPercent: integer("cateringDiscountPercent").default(0),
  equipment: jsonb("equipment").default(sql`'{}'::jsonb`),
  setupOptions: text("setupOptions").array().default(sql`ARRAY[]::text[]`),
  capacityTheater: integer("capacityTheater"),
  capacityClassroom: integer("capacityClassroom"),
  capacityBanquet: integer("capacityBanquet"),
  capacityStanding: integer("capacityStanding"),
  capacityCocktail: integer("capacityCocktail"),
  stageDimensions: text("stageDimensions"),
  securityDeposit: numeric("securityDeposit", { precision: 10, scale: 2 }).default("0"),
  allowedEventTypes: text("allowedEventTypes").array().default(sql`ARRAY[]::text[]`),
  prohibitedEventTypes: text("prohibitedEventTypes").array().default(sql`ARRAY[]::text[]`),
  noiseRestriction: text("noiseRestriction"),
}, (table) => ({
  hotelIdx: index("eventSpaces_hotelId_idx").on(table.hotelId),
  activeIdx: index("eventSpaces_isActive_idx").on(table.isActive),
  slugIdx: uniqueIndex("eventSpaces_slug_key").on(table.slug),
  priceIdx: index("eventSpaces_price_idx").on(table.pricePerDay, table.basePricePerDay),
}));

export const eventSpacesCompatible = pgTable("event_spaces_compatible", {
  id: uuid("id"),
  hotel_id: uuid("hotel_id"),
  hotelId: uuid("hotelId"),
  name: text("name"),
  description: text("description"),
  capacity_min: integer("capacity_min"),
  capacityMin: integer("capacityMin"),
  capacity_max: integer("capacity_max"),
  capacityMax: integer("capacityMax"),
  base_price_hourly: numeric("base_price_hourly", { precision: 10, scale: 2 }),
  basePriceHourly: numeric("basePriceHourly", { precision: 10, scale: 2 }),
  base_price_half_day: numeric("base_price_half_day", { precision: 10, scale: 2 }),
  basePriceHalfDay: numeric("basePriceHalfDay", { precision: 10, scale: 2 }),
  base_price_full_day: numeric("base_price_full_day", { precision: 10, scale: 2 }),
  basePriceFullDay: numeric("basePriceFullDay", { precision: 10, scale: 2 }),
  price_per_hour: numeric("price_per_hour", { precision: 10, scale: 2 }),
  pricePerHour: numeric("pricePerHour", { precision: 10, scale: 2 }),
  weekend_surcharge_percent: integer("weekend_surcharge_percent"),
  weekendSurchargePercent: integer("weekendSurchargePercent"),
  isActive: boolean("isActive"),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const eventAvailability = pgTable("eventAvailability", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventSpaceId: uuid("eventSpaceId").references(() => eventSpaces.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  priceOverride: numeric("priceOverride", { precision: 10, scale: 2 }),
  isAvailable: boolean("isAvailable").default(true),
  stopSell: boolean("stopSell").default(false),
  availableUnits: integer("availableUnits").notNull().default(1),
  maxUnits: integer("maxUnits").notNull().default(1),
  price: numeric("price", { precision: 10, scale: 2 }),
  minBookingHoursDefault: integer("minBookingHoursDefault").default(4),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  spaceDateIdx: uniqueIndex("eventAvailability_space_date_idx").on(table.eventSpaceId, table.date),
  availableIdx: index("eventAvailability_isAvailable_idx").on(table.isAvailable),
}));

// ==================== TABELAS DE REVIEWS DE EVENT SPACES ====================
export const eventSpaceReviews = pgTable("eventSpaceReviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("bookingId").references(() => eventBookings.id, { onDelete: "cascade" }).notNull(),
  eventSpaceId: uuid("eventSpaceId").references(() => eventSpaces.id, { onDelete: "cascade" }).notNull(),
  userId: text("userId").notNull(),
  venueRating: integer("venueRating").notNull(),
  facilitiesRating: integer("facilitiesRating").notNull(),
  locationRating: integer("locationRating").notNull(),
  servicesRating: integer("servicesRating").notNull(),
  staffRating: integer("staffRating").notNull(),
  valueRating: integer("valueRating").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  comment: text("comment").notNull(),
  pros: text("pros"),
  cons: text("cons"),
  overallRating: numeric("overallRating", { precision: 3, scale: 2 }).default(sql`(
    ("venueRating" + "facilitiesRating" + "locationRating" + "servicesRating" + "staffRating" + "valueRating")::numeric / 6.0
  )`),
  isVerified: boolean("isVerified").default(true),
  isPublished: boolean("isPublished").default(true),
  helpfulVotes: integer("helpfulVotes").default(0),
  reportCount: integer("reportCount").default(0),
  organizerResponse: text("organizerResponse"),
  organizerResponseAt: timestamp("organizerResponseAt"),
  organizerRespondedBy: text("organizerRespondedBy"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  eventSpaceIdx: index("event_space_reviews_event_space_id_idx").on(table.eventSpaceId),
  bookingIdx: index("event_space_reviews_booking_id_idx").on(table.bookingId),
  ratingIdx: index("event_space_reviews_overall_rating_idx").on(table.overallRating),
  createdAtIdx: index("event_space_reviews_created_at_idx").on(table.createdAt),
  bookingIdUnique: uniqueIndex("event_space_reviews_booking_id_key").on(table.bookingId),
}));

export const eventSpaceReviewHelpfulVotes = pgTable("eventSpaceReviewHelpfulVotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id").references(() => eventSpaceReviews.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(),
  isHelpful: boolean("is_helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  reviewIdx: index("event_space_helpful_votes_review_id_idx").on(table.reviewId),
  userReviewUnique: uniqueIndex("event_space_helpful_votes_review_user_unique").on(table.reviewId, table.userId),
}));

export const eventSpaceReviewReports = pgTable("eventSpaceReviewReports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id").references(() => eventSpaceReviews.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").notNull(),
  reason: reportReasonEnum("reason"),
  status: reportStatusEnum("status").default('pending'),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  reviewIdx: index("event_space_review_reports_review_id_idx").on(table.reviewId),
  statusIdx: index("event_space_review_reports_status_idx").on(table.status),
}));

// ==================== RESERVAS DE EVENTOS ====================
export const eventBookings = pgTable("eventBookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventSpaceId: uuid("eventSpaceId").references(() => eventSpaces.id, { onDelete: "cascade" }).notNull(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  organizerName: text("organizerName").notNull(),
  organizerEmail: text("organizerEmail").notNull(),
  organizerPhone: text("organizerPhone"),
  eventTitle: text("eventTitle").notNull(),
  eventDescription: text("eventDescription"),
  eventType: text("eventType").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  durationDays: integer("durationDays"),
  expectedAttendees: integer("expectedAttendees").notNull().default(10),
  specialRequests: text("specialRequests"),
  additionalServices: jsonb("additionalServices").default(sql`'{}'::jsonb`),
  cateringRequired: boolean("cateringRequired").notNull().default(false),
  basePrice: numeric("basePrice", { precision: 10, scale: 2 }).notNull(),
  equipmentFees: numeric("equipmentFees", { precision: 10, scale: 2 }).default(sql`0.00`),
  serviceFees: numeric("serviceFees", { precision: 10, scale: 2 }).default(sql`0.00`),
  weekendSurcharge: numeric("weekendSurcharge", { precision: 10, scale: 2 }).default(sql`0.00`),
  securityDeposit: numeric("securityDeposit", { precision: 10, scale: 2 }).default(sql`0.00`),
  depositPaid: numeric("depositPaid", { precision: 10, scale: 2 }).default(sql`0.00`),
  balanceDue: numeric("balanceDue", { precision: 10, scale: 2 }).default(sql`0.00`),
  totalPrice: numeric("totalPrice", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('pending_approval'),
  paymentStatus: text("paymentStatus").notNull().default('pending'),
  paymentReference: text("paymentReference"),
  invoiceNumber: text("invoiceNumber"),
  cancellationReason: text("cancellationReason"),
  cancelledAt: timestamp("cancelledAt"),
  userId: uuid("userId"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  eventSpaceIdx: index("eventBookings_eventSpaceId_idx").on(table.eventSpaceId),
  hotelIdx: index("eventBookings_hotelId_idx").on(table.hotelId),
  organizerEmailIdx: index("eventBookings_organizerEmail_idx").on(table.organizerEmail),
  statusIdx: index("eventBookings_status_idx").on(table.status),
}));

export const eventPayments = pgTable("event_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventBookingId: uuid("event_booking_id").references(() => eventBookings.id, { onDelete: "cascade" }),
  hotelId: uuid("hotel_id").references(() => hotels.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentType: text("payment_type").default("event_payment"),
  referenceNumber: text("reference_number"),
  proofImageUrl: text("proof_image_url"),
  status: text("status").default("pending"),
  confirmedBy: uuid("confirmed_by").references(() => users.id, { onDelete: "set null" }),
  paidAt: timestamp("paid_at", { withTimezone: false }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
}, (table) => ({
  eventBookingIdx: index("event_payments_event_booking_idx").on(table.eventBookingId),
  hotelIdx: index("event_payments_hotel_idx").on(table.hotelId),
  statusIdx: index("event_payments_status_idx").on(table.status),
}));

export const eventBookingLogs = pgTable("eventBookingLogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("bookingId").references(() => eventBookings.id, { onDelete: "cascade" }).notNull(),
  action: text("action").notNull(),
  performedBy: uuid("performedBy"),           
  details: jsonb("details").default(sql`'{}'::jsonb`),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  bookingIdx: index("eventBookingLogs_bookingId_idx").on(table.bookingId),
  createdAtIdx: index("eventBookingLogs_createdAt_idx").on(table.createdAt),
}));

export const eventSpaceLogs = pgTable("eventSpaceLogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventSpaceId: uuid("eventSpaceId").references(() => eventSpaces.id, { onDelete: "cascade" }).notNull(),
  action: text("action").notNull(),
  details: jsonb("details").default(sql`'{}'::jsonb`),
  userId: uuid("userId"),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  eventSpaceIdx: index("eventSpaceLogs_eventSpaceId_idx").on(table.eventSpaceId),
  createdAtIdx: index("eventSpaceLogs_createdAt_idx").on(table.createdAt),
}));

// ==================== TABELAS DE BOOKINGS E PAGAMENTOS ====================
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  rideId: uuid("rideId").references(() => rides.id, { onDelete: "cascade" }),
  passengerId: text("passengerId").references(() => users.id, { onDelete: "cascade" }),
  accommodationId: uuid("accommodationId").references(() => hotels.id, { onDelete: "cascade" }), // ✅ CORRIGIDO: accommodationId em vez de hotelId
  roomTypeId: uuid("roomTypeId").references(() => roomTypes.id, { onDelete: "cascade" }),
  type: serviceTypeEnum("type").default('ride'),
  status: statusEnum("status").default('pending'),
  totalPrice: numeric("totalPrice", { precision: 10, scale: 2 }).notNull(),
  seatsBooked: integer("seatsBooked").notNull(),
  passengers: integer("passengers").default(1),
  guestName: text("guestName"),
  guestEmail: text("guestEmail"),
  guestPhone: text("guestPhone"),
  checkInDate: timestamp("checkInDate"),
  checkOutDate: timestamp("checkOutDate"),
  nightsCount: integer("nightsCount"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  statusIdx: index("bookings_status_idx").on(table.status),
  typeIdx: index("bookings_type_idx").on(table.type),
  passengerIdx: index("bookings_passenger_idx").on(table.passengerId),
  accommodationIdx: index("bookings_accommodation_idx").on(table.accommodationId), // ✅ CORRIGIDO
}));

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  booking_id: uuid("booking_id").references(() => bookings.id),
  hotel_booking_id: uuid("hotel_booking_id").references(() => hotelBookings.id, { onDelete: "set null" }),
  invoice_number: text("invoice_number").unique(),
  issue_date: date("issue_date").default(sql`CURRENT_DATE`),
  due_date: date("due_date"),
  total_amount: numeric("total_amount", { precision: 10, scale: 2 }),
  tax_amount: numeric("tax_amount", { precision: 10, scale: 2 }).default("0"),
  status: text("status").default("pending"),
  payment_terms: text("payment_terms"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: false }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: false }).defaultNow(),
}, (table) => ({
  invoiceNumberKey: uniqueIndex("invoices_invoice_number_key").on(table.invoice_number),
  hotelBookingIdx: index("idx_invoices_hotel_booking_id").on(table.hotel_booking_id),
}));

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  serviceType: serviceTypeEnum("service_type").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  platformFee: numeric("platform_fee", { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  cardLast4: text("card_last_4"),
  cardBrand: text("card_brand"),
  mpesaNumber: text("mpesa_number"),
  paymentStatus: paymentStatusEnum("payment_status").default('pending'),
  paymentReference: text("payment_reference"),
  paidAt: timestamp("paid_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
  reminderSent: boolean("reminder_sent").default(false),
  lastReminderSent: timestamp("last_reminder_sent", { withTimezone: false }),
  dueDate: date("due_date").default(sql`CURRENT_DATE + '7 days'::interval`),
  reminderCount: integer("reminder_count").default(0),
  gatewayPaymentId: text("gateway_payment_id"),
  gatewayResponse: jsonb("gateway_response"),
  refundedAmount: numeric("refunded_amount", { precision: 10, scale: 2 }).default("0"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  referenceNumber: text("referencenumber"),
  proofImageUrl: text("proofimageurl"),
  confirmedBy: uuid("confirmedby").references(() => users.id, { onDelete: "cascade" }),
  confirmationDate: timestamp("confirmationdate", { withTimezone: false }),
  paymentType: paymentTypeEnum("paymenttype"),
  isManualPayment: boolean("ismanualpayment").default(false),
}, (table) => ({
  bookingIdx: index("idx_payments_booking").on(table.bookingId, table.paymentStatus),
  confirmationDateIdx: index("idx_payments_confirmationdate").on(table.confirmationDate),
  isManualIdx: index("idx_payments_ismanualpayment").on(table.isManualPayment),
  paymentTypeIdx: index("idx_payments_paymenttype").on(table.paymentType),
  pendingIdx: index("idx_payments_pending").on(table.paymentStatus, table.dueDate).where(sql`payment_status = 'pending'::payment_status`),
  revenueIdx: index("idx_payments_revenue").on(table.createdAt, table.total, table.paymentStatus).desc(),
  serviceIdx: index("idx_payments_service").on(table.serviceType, table.createdAt).desc(),
  userIdx: index("idx_payments_user").on(table.userId, table.createdAt).desc(),
  createdAtIdx: index("payments_createdAt_idx").on(table.createdAt),
  paymentStatusIdx: index("payments_paymentStatus_idx").on(table.paymentStatus),
}));

// ==================== TABELAS ADICIONAIS ====================
export const advancePaymentPromotions = pgTable("advance_payment_promotions", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotel_id: uuid("hotel_id").references(() => hotels.id, { onDelete: "cascade" }),
  event_space_id: uuid("event_space_id").references(() => eventSpaces.id, { onDelete: "cascade" }),
  promotion_type: text("promotion_type").notNull(),
  discount_percentage: numeric("discount_percentage", { precision: 5, scale: 2 }).notNull(),
  additional_benefits: jsonb("additional_benefits").default(sql`'{}'::jsonb`),
  min_days_in_advance: integer("min_days_in_advance"),
  max_days_in_advance: integer("max_days_in_advance"),
  require_full_payment: boolean("require_full_payment").default(false),
  is_active: boolean("is_active").default(true),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const paymentOptions = pgTable("payment_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotel_id: uuid("hotel_id").references(() => hotels.id, { onDelete: "cascade" }),
  event_space_id: uuid("event_space_id").references(() => eventSpaces.id, { onDelete: "cascade" }),
  advance_payment_enabled: boolean("advance_payment_enabled").default(true),
  advance_payment_discount_percentage: numeric("advance_payment_discount_percentage", { precision: 5, scale: 2 }).default("10.00"),
  advance_payment_required_percentage: numeric("advance_payment_required_percentage", { precision: 5, scale: 2 }).default("0.00"),
  advance_payment_due_days: integer("advance_payment_due_days").default(7),
  deposit_enabled: boolean("deposit_enabled").default(true),
  deposit_percentage: numeric("deposit_percentage", { precision: 5, scale: 2 }).default("30.00"),
  deposit_due_days: integer("deposit_due_days").default(3),
  final_payment_due_days: integer("final_payment_due_days").default(7),
  pay_at_location_enabled: boolean("pay_at_location_enabled").default(true),
  pay_at_location_surcharge_percentage: numeric("pay_at_location_surcharge_percentage", { precision: 5, scale: 2 }).default("0.00"),
  installment_enabled: boolean("installment_enabled").default(false),
  default_payment_option: text("default_payment_option").default('advance_payment'),
  allow_customer_choice: boolean("allow_customer_choice").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  hotel_id: uuid("hotel_id").references(() => hotels.id, { onDelete: "cascade" }),
  created_by: uuid("created_by").references(() => users.id),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.role, table.hotel_id] }),
  hotelIdx: index("user_roles_hotel_idx").on(table.hotel_id),
  userIdx: index("user_roles_user_idx").on(table.user_id),
}));

export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromUserId: text("fromUserId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  toUserId: text("toUserId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  serviceType: serviceTypeEnum("serviceType").notNull(),
  bookingId: uuid("bookingId"),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  toUserIdx: index("ratings_to_user_idx").on(table.toUserId),
  serviceTypeIdx: index("ratings_service_type_idx").on(table.serviceType),
}));

export const chatRooms = pgTable("chatRooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantOneId: text("participantOneId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  participantTwoId: text("participantTwoId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  bookingId: uuid("bookingId"),
  serviceType: serviceTypeEnum("serviceType"),
  lastMessage: text("lastMessage"),
  lastMessageAt: timestamp("lastMessageAt"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  participantsIdx: index("chat_rooms_participants_idx").on(table.participantOneId, table.participantTwoId),
}));

export const chatMessages = pgTable("chatMessages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatRoomId: uuid("chatRoomId").references(() => chatRooms.id, { onDelete: "cascade" }).notNull(),
  fromUserId: text("fromUserId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  toUserId: text("toUserId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  message: text("message").notNull(),
  messageType: text("messageType").default("text"),
  bookingId: uuid("bookingId"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  chatRoomIdx: index("chat_messages_room_idx").on(table.chatRoomId),
  fromUserIdx: index("chat_messages_from_user_idx").on(table.fromUserId),
}));

export const partnershipProposals = pgTable("partnershipProposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: statusEnum("status").notNull().default('pending'),
  startDate: timestamp("startDate").defaultNow(),
  endDate: timestamp("endDate").notNull(),
  province: varchar("province"),
  city: varchar("city"),
  offerFuel: boolean("offerFuel").default(false),
  offerMeals: boolean("offerMeals").default(false),
  offerFreeAccommodation: boolean("offerFreeAccommodation").default(false),
  premiumRate: numeric("premiumRate").default("0"),
  minimumDriverLevel: partnershipLevelEnum("minimumDriverLevel").default('bronze'),
  requiredVehicleType: varchar("requiredVehicleType").default("any"),
  currentApplicants: integer("currentApplicants").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  statusIdx: index("partnership_proposals_status_idx").on(table.status),
  hotelIdx: index("partnership_proposals_hotel_idx").on(table.hotelId),
}));

export const partnershipApplications = pgTable("partnershipApplications", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposalId").references(() => partnershipProposals.id, { onDelete: "cascade" }).notNull(),
  driverId: text("driverId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: statusEnum("status").default('pending'),
  applicationDate: timestamp("applicationDate").defaultNow(),
  acceptedAt: timestamp("acceptedAt"),
  completedAt: timestamp("completedAt"),
  message: text("message"),
  estimatedCompletion: timestamp("estimatedCompletion"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  statusIdx: index("partnership_applications_status_idx").on(table.status),
  driverIdx: index("partnership_applications_driver_idx").on(table.driverId),
}));

export const adminActions = pgTable("adminActions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: text("adminId").references(() => users.id, { onDelete: "set null" }).notNull(),
  targetUserId: text("targetUserId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  action: text("action").notNull(),
  reason: text("reason").notNull(),
  duration: integer("duration"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const priceRegulations = pgTable("priceRegulations", {
  id: uuid("id").primaryKey().defaultRandom(),
  rideType: rideTypeEnum("rideType").notNull(),
  minPricePerKm: numeric("minPricePerKm", { precision: 8, scale: 2 }).notNull(),
  maxPricePerKm: numeric("maxPricePerKm", { precision: 8, scale: 2 }).notNull(),
  baseFare: numeric("baseFare", { precision: 8, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const priceNegotiations = pgTable("priceNegotiations", {
  id: uuid("id").primaryKey().defaultRandom(),
  rideId: uuid("rideId").references(() => rides.id, { onDelete: "cascade" }),
  passengerId: text("passengerId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  driverId: text("driverId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  originalPrice: numeric("originalPrice", { precision: 8, scale: 2 }).notNull(),
  proposedPrice: numeric("proposedPrice", { precision: 8, scale: 2 }).notNull(),
  counterPrice: numeric("counterPrice", { precision: 8, scale: 2 }),
  status: statusEnum("status").default('pending'),
  message: text("message"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const pickupRequests = pgTable("pickupRequests", {
  id: uuid("id").primaryKey().defaultRandom(),
  rideId: uuid("rideId").references(() => rides.id, { onDelete: "cascade" }),
  passengerId: text("passengerId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  driverId: text("driverId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  pickupLocation: text("pickupLocation").notNull(),
  pickupLat: numeric("pickupLat", { precision: 10, scale: 7 }),
  pickupLng: numeric("pickupLng", { precision: 10, scale: 7 }),
  destinationLocation: text("destinationLocation").notNull(),
  destinationLat: numeric("destinationLat", { precision: 10, scale: 7 }),
  destinationLng: numeric("destinationLng", { precision: 10, scale: 7 }),
  requestedSeats: integer("requestedSeats").default(1),
  proposedPrice: numeric("proposedPrice", { precision: 8, scale: 2 }),
  status: statusEnum("status").default('pending'),
  message: text("message"),
  estimatedDetour: integer("estimatedDetour"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const driverStats = pgTable("driverStats", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: text("driverId").references(() => users.id, { onDelete: "cascade" }).unique().notNull(),
  totalRides: integer("totalRides").default(0),
  totalDistance: numeric("totalDistance", { precision: 10, scale: 2 }).default("0.00"),
  totalEarnings: numeric("totalEarnings", { precision: 12, scale: 2 }).default("0.00"),
  averageRating: numeric("averageRating", { precision: 3, scale: 2 }).default("0.00"),
  completedRidesThisMonth: integer("completedRidesThisMonth").default(0),
  completedRidesThisYear: integer("completedRidesThisYear").default(0),
  partnershipLevel: partnershipLevelEnum("partnershipLevel").default('bronze'),
  lastRideDate: timestamp("lastRideDate"),
  joinedAt: timestamp("joinedAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const driverDocuments = pgTable("driverDocuments", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: text("driverId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  vehicleRegistrationUrl: text("vehicleRegistrationUrl"),
  drivingLicenseUrl: text("drivingLicenseUrl"),
  vehicleInsuranceUrl: text("vehicleInsuranceUrl"),
  vehicleInspectionUrl: text("vehicleInspectionUrl"),
  vehicleMake: text("vehicleMake"),
  vehicleModel: text("vehicleModel"),
  vehicleYear: integer("vehicleYear"),
  vehiclePlate: text("vehiclePlate"),
  vehicleColor: text("vehicleColor"),
  isVerified: boolean("isVerified").default(false),
  verificationDate: timestamp("verificationDate"),
  verificationNotes: text("verificationNotes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const eventManagers = pgTable("eventManagers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  companyName: text("companyName").notNull(),
  companyType: text("companyType").notNull(),
  description: text("description"),
  contactEmail: text("contactEmail").notNull(),
  contactPhone: text("contactPhone"),
  website: text("website"),
  logo: text("logo"),
  isVerified: boolean("isVerified").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizerId: text("organizerId").references(() => users.id, { onDelete: "set null" }).notNull(),
  managerId: uuid("managerId").references(() => eventManagers.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("eventType").notNull(),
  category: text("category").notNull(),
  venue: text("venue").notNull(),
  address: text("address").notNull(),
  locality: varchar("locality", { length: 100 }),
  province: varchar("province", { length: 100 }),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  startTime: text("startTime"),
  endTime: text("endTime"),
  isPaid: boolean("isPaid").default(false),
  ticketPrice: numeric("ticketPrice", { precision: 8, scale: 2 }).default("0"),
  maxTickets: integer("maxTickets").default(100),
  ticketsSold: integer("ticketsSold").default(0),
  enablePartnerships: boolean("enablePartnerships").default(false),
  accommodationDiscount: integer("accommodationDiscount").default(10),
  transportDiscount: integer("transportDiscount").default(15),
  organizerName: text("organizerName"),
  organizerContact: text("organizerContact"),
  organizerEmail: text("organizerEmail"),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  maxAttendees: integer("maxAttendees"),
  currentAttendees: integer("currentAttendees").default(0),
  status: statusEnum("status").notNull().default('pending'),
  requiresApproval: boolean("requiresApproval").default(true),
  isPublic: boolean("isPublic").default(true),
  isFeatured: boolean("isFeatured").default(false),
  hasPartnerships: boolean("hasPartnerships").default(false),
  websiteUrl: text("websiteUrl"),
  socialMediaLinks: text("socialMediaLinks").array().default(sql`ARRAY[]::text[]`),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  eventLocationIdx: index("events_location_idx").on(table.locality, table.province),
  statusIdx: index("events_status_idx").on(table.status),
}));

export const loyaltyProgram = pgTable("loyaltyProgram", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  totalPoints: integer("totalPoints").default(0),
  currentPoints: integer("currentPoints").default(0),
  membershipLevel: partnershipLevelEnum("membershipLevel").default('bronze'),
  joinedAt: timestamp("joinedAt").defaultNow(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const pointsHistory = pgTable("pointsHistory", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  loyaltyId: uuid("loyaltyId").references(() => loyaltyProgram.id, { onDelete: "cascade" }),
  actionType: text("actionType").notNull(),
  pointsAmount: integer("pointsAmount").notNull(),
  reason: text("reason").notNull(),
  relatedId: uuid("relatedId"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const loyaltyRewards = pgTable("loyaltyRewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rewardType: text("rewardType").notNull(),
  pointsCost: integer("pointsCost").notNull(),
  discountValue: numeric("discountValue", { precision: 8, scale: 2 }),
  minimumLevel: partnershipLevelEnum("minimumLevel").default('bronze'),
  isActive: boolean("isActive").default(true),
  maxRedemptions: integer("maxRedemptions"),
  validUntil: timestamp("validUntil"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export const rewardRedemptions = pgTable("rewardRedemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rewardId: uuid("rewardId").references(() => loyaltyRewards.id, { onDelete: "cascade" }),
  pointsUsed: integer("pointsUsed").notNull(),
  status: statusEnum("status").notNull().default('active'),
  expiresAt: timestamp("expiresAt"),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  priority: text("priority").default("normal"),
  isRead: boolean("isRead").default(false),
  actionUrl: text("actionUrl"),
  relatedId: uuid("relatedId"),
  createdAt: timestamp("createdAt").defaultNow(),
  readAt: timestamp("readAt"),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
  isReadIdx: index("notifications_is_read_idx").on(table.isRead),
}));

export const systemSettings = pgTable("systemSettings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  type: varchar("type"),
  updatedBy: uuid("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// ==================== ZOD SCHEMAS ====================
const userTypeZod = z.enum(["client", "driver", "host", "admin"]);
const statusZod = z.enum(["pending", "active", "available", "confirmed", "cancelled", "completed", "expired", "in_progress", "checked_in", "checked_out", "approved", "rejected", "pending_payment"]);
const bookingStatusZod = z.enum(["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"]);
const paymentStatusZod = z.enum(["pending", "processing", "paid", "failed", "refunded", "cancelled", "expired", "partial"]);
const serviceTypeZod = z.enum(["ride", "accommodation", "event", "hotel"]);
const partnershipLevelZod = z.enum(["bronze", "silver", "gold", "platinum"]);
const verificationStatusZod = z.enum(["pending", "in_review", "verified", "rejected", "suspended"]);
const paymentMethodZod = z.enum(["card", "mpesa", "bank", "mobile_money", "bank_transfer", "pending"]);
const rideTypeZod = z.enum(["regular", "premium", "shared", "express"]);
const locationTypeZod = z.enum(["city", "town", "village"]);
const vehicleTypeZod = z.enum(["economy", "comfort", "luxury", "family", "premium", "van", "suv"]);
const reportReasonZod = z.enum(["inappropriate", "fake", "spam", "offensive", "other"]);
const reportStatusZod = z.enum(["pending", "reviewed", "resolved", "dismissed"]);
const accountTypeZod = z.enum(["individual", "company"]);
const capabilityTypeZod = z.enum(["driver", "hotel_manager", "admin", "book_services"]);
const providerTypeZod = z.enum(["driver", "hotel", "event_space"]);
const payoutStatusZod = z.enum(["pending", "processing", "paid", "failed"]);
const complaintTypeZod = z.enum(["client_to_provider", "provider_to_client", "platform_issue"]);
const complaintStatusZod = z.enum(["new", "investigating", "resolved", "dismissed"]);
const complaintPriorityZod = z.enum(["low", "medium", "high", "urgent"]);

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().optional(),
  phone: z.string().optional(),
  userType: userTypeZod,
  accountType: accountTypeZod.optional(),
  driverVerificationStatus: verificationStatusZod.optional(),
  hotelManagerVerificationStatus: verificationStatusZod.optional(),
  clientVerificationStatus: verificationStatusZod.optional(),
  verificationStatus: verificationStatusZod.optional(),
  rating: z.number().min(0).max(5).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  capabilitiesUpdatedAt: true,
  lastCapacityActivation: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  phone: true,
  userType: true,
  accountType: true,
  companyName: true,
  companyVatNumber: true,
  companyAddress: true,
  driverLicenseNumber: true,
  driverVehicleType: true,
  driverVerificationStatus: true,
  driverVerifiedAt: true,
  hotelManagerVerificationStatus: true,
  hotelManagerVerifiedAt: true,
  clientVerificationStatus: true,
  clientSuspendedAt: true,
  clientSuspensionReason: true,
  businessTaxId: true,
  canBookServices: true,
  canDrive: true,
  canManageHotels: true,
  isAdmin: true,
  roles: true,
  canOfferServices: true,
});

export const insertRideSchema = createInsertSchema(rides, {
  fromAddress: z.string().min(1),
  toAddress: z.string().min(1),
  fromCity: z.string().optional(),
  toCity: z.string().optional(),
  fromDistrict: z.string().optional(),
  toDistrict: z.string().optional(),
  fromLocality: z.string().optional(),
  fromProvince: z.string().optional(),
  toLocality: z.string().optional(),
  toProvince: z.string().optional(),
  departureDate: z.date(),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  availableSeats: z.number().int().min(1).max(10),
  pricePerSeat: z.string().min(1),
  status: statusZod.optional(),
  type: rideTypeZod.optional(),
  vehicleType: z.string().optional(),
  additionalInfo: z.string().optional(),
  distance_real_km: z.number().optional(),
  from_geom: z.string().optional(),
  to_geom: z.string().optional(),
  polyline: z.string().optional(),
}).omit({
  id: true,
  driverId: true,
  driverName: true,
  vehicle_uuid: true,
  maxPassengers: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRideSchema = createInsertSchema(rides, {
  fromAddress: z.string().min(1).optional(),
  toAddress: z.string().min(1).optional(),
  fromCity: z.string().optional(),
  toCity: z.string().optional(),
  fromDistrict: z.string().optional(),
  toDistrict: z.string().optional(),
  fromLocality: z.string().optional(),
  fromProvince: z.string().optional(),
  toLocality: z.string().optional(),
  toProvince: z.string().optional(),
  departureDate: z.date().optional(),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  availableSeats: z.number().int().min(1).max(10).optional(),
  pricePerSeat: z.string().min(1).optional(),
  status: statusZod.optional(),
  type: rideTypeZod.optional(),
  vehicleType: z.string().optional(),
  additionalInfo: z.string().optional(),
  distance_real_km: z.number().optional(),
  from_geom: z.string().optional(),
  to_geom: z.string().optional(),
  polyline: z.string().optional(),
}).partial().omit({
  id: true,
  driverId: true,
  driverName: true,
  vehicle_uuid: true,
  maxPassengers: true,
  createdAt: true,
  updatedAt: true,
});

export const vehicleSchema = z.object({
  plateNumber: z.string().min(3).max(20),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  color: z.string().min(1).max(50),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  vehicleType: vehicleTypeZod,
  maxPassengers: z.number().min(1).max(50),
  features: z.array(z.string()).optional(),
  photoUrl: z.string().url().optional().or(z.literal(''))
});

export const insertVehicleSchema = createInsertSchema(vehicles, {
  plate_number: z.string().min(3).max(20),
  plate_number_raw: z.string().min(3).max(20),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  color: z.string().min(1).max(50),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  vehicle_type: vehicleTypeZod,
  max_passengers: z.number().min(1).max(50),
  features: z.array(z.string()).optional(),
  photo_url: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
}).omit({
  id: true,
  driver_id: true,
  created_at: true,
  updated_at: true,
});

export const insertBookingSchema = createInsertSchema(bookings, {
  type: serviceTypeZod,
  status: statusZod,
  totalPrice: z.number().positive(),
  seatsBooked: z.number().int().min(1),
  passengers: z.number().int().min(1).optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  checkInDate: z.date().optional(),
  checkOutDate: z.date().optional(),
  nightsCount: z.number().int().optional(),
}).omit({
  id: true,
  rideId: true,
  passengerId: true,
  hotelId: true,
  roomTypeId: true,
  createdAt: true,
  updatedAt: true,
});

export const createRideSchema = z.object({
  fromLocation: z.object({
    name: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional()
  }),
  toLocation: z.object({
    name: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional()
  }),
  departureDate: z.string().datetime(),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  pricePerSeat: z.number().min(1),
  maxPassengers: z.number().min(1),
  vehicleId: z.string().uuid(),
  description: z.string().optional(),
  allowNegotiation: z.boolean().default(false),
  allowPickupEnRoute: z.boolean().default(true)
});

export const insertHotelBookingSchema = createInsertSchema(hotelBookings, {
  hotelId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  roomId: z.string().uuid().optional(),
  guestName: z.string().min(1),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  checkIn: z.date(),
  checkOut: z.date(),
  nights: z.number().int().positive(),
  units: z.number().int().positive().default(1),
  adults: z.number().int().positive().default(2),
  children: z.number().int().nonnegative().default(0),
  basePrice: z.number().positive(),
  extraCharges: z.number().nonnegative().default(0),
  totalPrice: z.number().positive(),
  discountAmount: z.number().nonnegative().default(0),
  baseTotalPrice: z.number().positive().optional(),
  promoCode: z.string().optional(),
  longStayDiscountPercent: z.number().min(0).max(100).default(0),
  longStayDiscountAmount: z.number().nonnegative().default(0),
  longStayTier: z.string().optional(),
  specialRequests: z.string().optional(),
  cancellationReason: z.string().optional(),
  status: z.string().default('confirmed'),
  paymentStatus: z.string().default('pending'),
  paymentReference: z.string().optional(),
  invoiceNumber: z.string().optional(),
  reservationToken: z.string().optional(),
  checkedInAt: z.date().optional(),
  checkedOutAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  confirmedAt: z.date().optional(),
  confirmedBy: z.string().optional(),
  holdExpiresAt: z.date().optional(),
  companyId: z.string().uuid().optional(),
  reminderSent: z.boolean().default(false),
  lastReminderSent: z.date().optional(),
  reminderCount: z.number().int().default(0),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHotelSchema = createInsertSchema(hotels, {
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  location_id: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
  host_id: true,
});

export const insertHotelReviewSchema = createInsertSchema(hotelReviews, {
  bookingId: z.string().uuid(),
  hotelId: z.string().uuid(),
  userId: z.string(),
  cleanlinessRating: z.number().int().min(1).max(5),
  comfortRating: z.number().int().min(1).max(5),
  locationRating: z.number().int().min(1).max(5),
  facilitiesRating: z.number().int().min(1).max(5),
  staffRating: z.number().int().min(1).max(5),
  valueRating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200),
  comment: z.string().min(1),
  pros: z.string().optional(),
  cons: z.string().optional(),
  isVerified: z.boolean().default(true),
  isPublished: z.boolean().default(true),
}).omit({
  id: true,
  overallRating: true,
  helpfulVotes: true,
  reportCount: true,
  hostResponse: true,
  hostResponseAt: true,
  hostRespondedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSpaceReviewSchema = createInsertSchema(eventSpaceReviews, {
  bookingId: z.string().uuid(),
  eventSpaceId: z.string().uuid(),
  userId: z.string(),
  venueRating: z.number().int().min(1).max(5),
  facilitiesRating: z.number().int().min(1).max(5),
  locationRating: z.number().int().min(1).max(5),
  servicesRating: z.number().int().min(1).max(5),
  staffRating: z.number().int().min(1).max(5),
  valueRating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200),
  comment: z.string().min(1),
  pros: z.string().optional(),
  cons: z.string().optional(),
  isVerified: z.boolean().default(true),
  isPublished: z.boolean().default(true),
}).omit({
  id: true,
  overallRating: true,
  helpfulVotes: true,
  reportCount: true,
  organizerResponse: true,
  organizerResponseAt: true,
  organizerRespondedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReviewHelpfulVoteSchema = createInsertSchema(reviewHelpfulVotes, {
  reviewId: z.string().uuid(),
  userId: z.string(),
  isHelpful: z.boolean(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertEventSpaceReviewHelpfulVoteSchema = createInsertSchema(eventSpaceReviewHelpfulVotes, {
  reviewId: z.string().uuid(),
  userId: z.string(),
  isHelpful: z.boolean(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertReviewReportSchema = createInsertSchema(reviewReports, {
  reviewId: z.string().uuid(),
  userId: z.string(),
  reason: reportReasonZod,
  status: reportStatusZod.optional(),
  details: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSpaceReviewReportSchema = createInsertSchema(eventSpaceReviewReports, {
  reviewId: z.string().uuid(),
  userId: z.string(),
  reason: reportReasonZod,
  status: reportStatusZod.optional(),
  details: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoomTypeSchema = createInsertSchema(roomTypes, {
  name: z.string().min(1).max(100),
  base_price: z.number().positive(),
  total_units: z.number().int().positive(),
  base_occupancy: z.number().int().positive().default(2),
  min_nights_default: z.number().int().positive().default(1),
  extra_adult_price: z.number().nonnegative(),
  extra_child_price: z.number().nonnegative(),
  is_active: z.boolean().default(true),
}).omit({
  id: true,
  hotel_id: true,
  created_at: true,
  updated_at: true,
  slug: true,
  description: true,
  capacity: true,
  base_price_low: true,
  base_price_high: true,
  min_nights_default: true,
  extra_night_price: true,
});

export const insertRoomTypePhotoSchema = createInsertSchema(roomTypePhotos, {
  room_type_id: z.string().uuid(),
  url: z.string().url(),
  alt_text: z.string().max(255).optional(),
  order: z.number().int().default(0),
  is_featured: z.boolean().default(false),
  is_primary: z.boolean().default(false),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

export const insertEventSpacePhotoSchema = createInsertSchema(eventSpacePhotos, {
  event_space_id: z.string().uuid(),
  url: z.string().url(),
  alt_text: z.string().max(255).optional(),
  order: z.number().int().default(0),
  is_featured: z.boolean().default(false),
  is_primary: z.boolean().default(false),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
});

export const insertRoomAvailabilitySchema = createInsertSchema(roomAvailability, {
  date: z.date(),
  price: z.number().positive(),
  availableUnits: z.number().int().nonnegative(),
  stopSell: z.boolean().default(false),
  minNights: z.number().int().positive().default(1),
}).omit({
  id: true,
  hotelId: true,
  roomTypeId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSpaceSchema = createInsertSchema(eventSpaces, {
  name: z.string().min(1),
  description: z.string().optional(),
  capacityMin: z.number().int().positive(),
  capacityMax: z.number().int().positive(),
  pricePerDay: z.number().positive().optional(),
  basePricePerDay: z.number().positive().default(0),
  weekendSurchargePercent: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  offersCatering: z.boolean().default(false),
  cateringMenuUrls: z.array(z.string()).default([]),
  cateringDiscountPercent: z.number().min(0).max(100).default(0),
}).omit({
  id: true,
  hotelId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventBookingSchema = createInsertSchema(eventBookings, {
  organizerName: z.string().min(1),
  organizerEmail: z.string().email(),
  organizerPhone: z.string().optional(),
  eventTitle: z.string().min(1),
  eventType: z.string().min(1),
  startDate: z.date(),
  endDate: z.date(),
  durationDays: z.number().int().positive().optional(),
  expectedAttendees: z.number().int().positive(),
  cateringRequired: z.boolean().default(false),
  basePrice: z.number().positive(),
  totalPrice: z.number().positive(),
  status: z.string().default('pending_approval'),
  paymentStatus: z.string().default('pending'),
}).omit({
  id: true,
  eventSpaceId: true,
  hotelId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMozambiqueLocationSchema = createInsertSchema(mozambiqueLocations, {
  name: z.string().min(1).max(100),
  province: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  type: locationTypeZod,
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
}).omit({
  id: true,
  geom: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHotelPaymentSchema = createInsertSchema(hotelPayments, {
  booking_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: z.string().min(1),
  payment_reference: z.string().optional(),
  notes: z.string().optional(),
  payment_type: z.enum(['partial', 'full']).optional(),
  status: z.string().default('paid'),
  confirmed_by: z.string().optional(),
  proof_image_url: z.string().optional(),
  paid_at: z.date().optional(),
  metadata: z.record(z.any()).optional(),
  is_manual: z.boolean().default(true),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// ==================== NOVOS ZOD SCHEMAS ====================

export const insertUserCapacityDocumentSchema = createInsertSchema(userCapacityDocuments, {
  documentUrl: z.string().url(),
  expiryDate: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isVerified: true,
  verifiedBy: true,
  verifiedAt: true,
  verificationNotes: true,
});

export const activateCapacitySchema = z.object({
  capacity: z.enum(["drive", "hotel_manager"]),
  documents: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
    number: z.string().optional(),
    expiryDate: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
});

export const signupWithCapacitiesSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  wantsToBeClient: z.boolean().default(true),
  wantsToBeDriver: z.boolean().default(false),
  wantsToBeHotelManager: z.boolean().default(false),
  driverLicenseNumber: z.string().optional(),
  driverVehicleType: z.string().optional(),
  businessTaxId: z.string().optional(),
  companyName: z.string().optional(),
  companyVatNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  accountType: z.enum(["individual", "company"]).default("individual"),
});

export const approveCapabilitySchema = z.object({
  userId: z.string(),
  capabilityType: capabilityTypeZod,
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const rejectCapabilitySchema = z.object({
  userId: z.string(),
  capabilityType: capabilityTypeZod,
  reason: z.string().min(1, "Motivo é obrigatório"),
  notes: z.string().optional(),
});

export const suspendCapabilitySchema = z.object({
  userId: z.string(),
  capabilityType: capabilityTypeZod,
  reason: z.string().min(1, "Motivo é obrigatório"),
  notes: z.string().optional(),
});

export const insertPlatformFeeConfigSchema = createInsertSchema(platformFeeConfig, {
  service_type: z.enum(['ride', 'hotel', 'event']),
  fee_percentage: z.number().min(0).max(100).default(12),
  effective_from: z.string().optional(),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertUserEntitySchema = createInsertSchema(userEntities, {
  entity_code: z.string().min(3).max(20),
  entity_prefix: z.string().min(2).max(5),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  verified_at: true,
  verified_by: true,
});

export const insertUserBankAccountSchema = createInsertSchema(userBankAccounts, {
  account_type: z.enum(['bank', 'mpesa', 'emola']),
  mpesa_number: z.string().optional(),
  iban: z.string().optional(),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  verified_at: true,
  verified_by: true,
});

export const insertPaymentReferenceSchema = createInsertSchema(paymentReferences, {
  reference_number: z.string(),
  booking_id: z.string().uuid(),
  booking_type: z.enum(['ride', 'hotel', 'event']),
  gross_amount: z.number().positive(),
}).omit({
  id: true,
  fee_amount: true,
  net_amount: true,
  due_date: true,
  created_at: true,
  updated_at: true,
});

export const insertProviderPayoutSchema = createInsertSchema(providerPayouts, {
  payout_reference: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  total_gross: z.number().positive(),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  paid_at: true,
  confirmed_by: true,
});

export const insertComplaintSchema = createInsertSchema(complaints, {
  complaint_type: complaintTypeZod,
  category: z.string().min(1),
  description: z.string().min(10),
  priority: complaintPriorityZod.optional(),
}).omit({
  id: true,
  status: true,
  assigned_admin_id: true,
  resolution: true,
  resolved_at: true,
  created_at: true,
  updated_at: true,
});

export const insertComplaintAttachmentSchema = createInsertSchema(complaintAttachments, {
  file_url: z.string().url(),
  file_type: z.string().optional(),
}).omit({
  id: true,
  created_at: true,
});

export const insertProviderInvoiceSchema = createInsertSchema(providerInvoices, {
  invoice_number: z.string(),
  total_gross_amount: z.number().positive(),
  platform_fee: z.number().positive(),
  net_amount: z.number().positive(),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  paid_date: true,
});

// ==================== TIPOS TYPESCRIPT ====================
export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type UserCapacityDocument = typeof userCapacityDocuments.$inferSelect;
export type UserCapacityDocumentInsert = typeof userCapacityDocuments.$inferInsert;
export type CapabilityAuditLog = typeof capabilityAuditLog.$inferSelect;
export type CapabilityAuditLogInsert = typeof capabilityAuditLog.$inferInsert;
export type PlatformFeeConfig = typeof platformFeeConfig.$inferSelect;
export type PlatformFeeConfigInsert = typeof platformFeeConfig.$inferInsert;
export type UserEntity = typeof userEntities.$inferSelect;
export type UserEntityInsert = typeof userEntities.$inferInsert;
export type UserBankAccount = typeof userBankAccounts.$inferSelect;
export type UserBankAccountInsert = typeof userBankAccounts.$inferInsert;
export type PaymentReference = typeof paymentReferences.$inferSelect;
export type PaymentReferenceInsert = typeof paymentReferences.$inferInsert;
export type ProviderPayout = typeof providerPayouts.$inferSelect;
export type ProviderPayoutInsert = typeof providerPayouts.$inferInsert;
export type PayoutReference = typeof payoutReferences.$inferSelect;
export type PayoutReferenceInsert = typeof payoutReferences.$inferInsert;
export type PaymentSequence = typeof paymentSequences.$inferSelect;
export type PaymentSequenceInsert = typeof paymentSequences.$inferInsert;
export type PaymentProofValidation = typeof paymentProofValidations.$inferSelect;
export type PaymentProofValidationInsert = typeof paymentProofValidations.$inferInsert;
export type Complaint = typeof complaints.$inferSelect;
export type ComplaintInsert = typeof complaints.$inferInsert;
export type ComplaintAttachment = typeof complaintAttachments.$inferSelect;
export type ComplaintAttachmentInsert = typeof complaintAttachments.$inferInsert;
export type ProviderInvoice = typeof providerInvoices.$inferSelect;
export type ProviderInvoiceInsert = typeof providerInvoices.$inferInsert;
export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type InvoicePaymentInsert = typeof invoicePayments.$inferInsert;
export type Ride = typeof rides.$inferSelect;
export type RideInsert = typeof rides.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type VehicleInsert = typeof vehicles.$inferInsert;
export type Hotel = typeof hotels.$inferSelect;
export type HotelInsert = typeof hotels.$inferInsert;
export type RoomType = typeof roomTypes.$inferSelect;
export type RoomTypeInsert = typeof roomTypes.$inferInsert;
export type RoomTypePhoto = typeof roomTypePhotos.$inferSelect;
export type NewRoomTypePhoto = typeof roomTypePhotos.$inferInsert;
export type RoomAvailability = typeof roomAvailability.$inferSelect;
export type RoomAvailabilityInsert = typeof roomAvailability.$inferInsert;
export type HotelBooking = typeof hotelBookings.$inferSelect;
export type HotelBookingInsert = typeof hotelBookings.$inferInsert;
export type HotelPayment = typeof hotelPayments.$inferSelect;
export type HotelPaymentInsert = typeof hotelPayments.$inferInsert;
export type HotelBookingUnit = typeof hotelBookingUnits.$inferSelect;
export type HotelBookingUnitInsert = typeof hotelBookingUnits.$inferInsert;
export type HotelBookingLog = typeof hotelBookingLogs.$inferSelect;
export type HotelBookingLogInsert = typeof hotelBookingLogs.$inferInsert;
export type HotelSeason = typeof hotelSeasons.$inferSelect;
export type HotelSeasonInsert = typeof hotelSeasons.$inferInsert;
export type HotelPromotion = typeof hotelPromotions.$inferSelect;
export type HotelPromotionInsert = typeof hotelPromotions.$inferInsert;
export type HotelReview = typeof hotelReviews.$inferSelect;
export type HotelReviewInsert = typeof hotelReviews.$inferInsert;
export type ReviewHelpfulVote = typeof reviewHelpfulVotes.$inferSelect;
export type ReviewHelpfulVoteInsert = typeof reviewHelpfulVotes.$inferInsert;
export type ReviewReport = typeof reviewReports.$inferSelect;
export type ReviewReportInsert = typeof reviewReports.$inferInsert;
export type EventSpacePhoto = typeof eventSpacePhotos.$inferSelect;
export type NewEventSpacePhoto = typeof eventSpacePhotos.$inferInsert;
export type EventSpace = typeof eventSpaces.$inferSelect;
export type EventSpaceInsert = typeof eventSpaces.$inferInsert;
export type EventSpacesCompatible = typeof eventSpacesCompatible.$inferSelect;
export type EventSpaceReview = typeof eventSpaceReviews.$inferSelect;
export type EventSpaceReviewInsert = typeof eventSpaceReviews.$inferInsert;
export type EventSpaceReviewHelpfulVote = typeof eventSpaceReviewHelpfulVotes.$inferSelect;
export type EventSpaceReviewHelpfulVoteInsert = typeof eventSpaceReviewHelpfulVotes.$inferInsert;
export type EventSpaceReviewReport = typeof eventSpaceReviewReports.$inferSelect;
export type EventSpaceReviewReportInsert = typeof eventSpaceReviewReports.$inferInsert;
export type EventSpaceAvailability = typeof eventAvailability.$inferSelect;
export type EventSpaceAvailabilityInsert = typeof eventAvailability.$inferInsert;
export type EventBooking = typeof eventBookings.$inferSelect;
export type EventBookingInsert = typeof eventBookings.$inferInsert;
export type EventBookingLog = typeof eventBookingLogs.$inferSelect;
export type EventBookingLogInsert = typeof eventBookingLogs.$inferInsert;
export type EventSpaceLog = typeof eventSpaceLogs.$inferSelect;
export type EventSpaceLogInsert = typeof eventSpaceLogs.$inferInsert;
export type EventPayment = typeof eventPayments.$inferSelect;
export type EventPaymentInsert = typeof eventPayments.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type BookingInsert = typeof bookings.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceInsert = typeof invoices.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type PaymentInsert = typeof payments.$inferInsert;
export type MozambiqueLocation = typeof mozambiqueLocations.$inferSelect;
export type MozambiqueLocationInsert = typeof mozambiqueLocations.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type UserRoleInsert = typeof userRoles.$inferInsert;
export type AdvancePaymentPromotion = typeof advancePaymentPromotions.$inferSelect;
export type AdvancePaymentPromotionInsert = typeof advancePaymentPromotions.$inferInsert;
export type PaymentOption = typeof paymentOptions.$inferSelect;
export type PaymentOptionInsert = typeof paymentOptions.$inferInsert;

export interface UserWithCapabilities {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  canBookServices: boolean;
  canDrive: boolean;
  canManageHotels: boolean;
  isAdmin: boolean;
  driverVerificationStatus: string | null;
  hotelManagerVerificationStatus: string | null;
  clientVerificationStatus: string | null;
  accountType: string | null;
  companyName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type HotelPaymentCamelCase = {
  id: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string | null;
  notes: string | null;
  paymentType: 'partial' | 'full' | null;
  status: string;
  confirmedBy: string | null;
  proofImageUrl: string | null;
  paidAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  metadata: Record<string, any> | null;
  isManual: boolean | null;
};

export function convertHotelPaymentToCamelCase(payment: HotelPayment): HotelPaymentCamelCase {
  return {
    id: payment.id,
    bookingId: payment.booking_id,
    amount: Number(payment.amount),
    paymentMethod: payment.payment_method,
    paymentReference: payment.payment_reference,
    notes: payment.notes,
    paymentType: payment.payment_type as 'partial' | 'full' | null,
    status: payment.status,
    confirmedBy: payment.confirmed_by,
    proofImageUrl: payment.proof_image_url,
    paidAt: payment.paid_at,
    createdAt: payment.created_at,
    updatedAt: payment.updated_at,
    metadata: payment.metadata as Record<string, any> | null,
    isManual: payment.is_manual,
  };
}

export function convertHotelPaymentToSnakeCase(payment: Partial<HotelPaymentCamelCase>): Partial<HotelPaymentInsert> {
  return {
    booking_id: payment.bookingId,
    amount: payment.amount?.toString(),
    payment_method: payment.paymentMethod,
    payment_reference: payment.paymentReference,
    notes: payment.notes,
    payment_type: payment.paymentType,
    status: payment.status,
    confirmed_by: payment.confirmedBy,
    proof_image_url: payment.proofImageUrl,
    paid_at: payment.paidAt,
    metadata: payment.metadata,
    is_manual: payment.isManual,
  };
}

export interface CreateHotelPaymentRequest {
  bookingId: string;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
  notes?: string;
  paymentType?: 'partial' | 'full';
  status?: string;
  confirmedBy?: string;
  proofImageUrl?: string;
  paidAt?: Date;
  metadata?: Record<string, any>;
  isManual?: boolean;
}

export interface HotelWithLocation extends Hotel {
  mozambiqueLocation?: MozambiqueLocation | null;
}

export interface CreateHotelRequest {
  name: string;
  slug: string;
  description?: string;
  address: string;
  locality: string;
  province: string;
  country?: string;
  lat?: number;
  lng?: number;
  location_id?: string;
  contact_email: string;
  contact_phone?: string;
}

export interface UpdateHotelRequest {
  name?: string;
  description?: string;
  address?: string;
  locality?: string;
  province?: string;
  country?: string;
  lat?: number;
  lng?: number;
  location_id?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface HotelSearchParams {
  location: LocationSuggestion | null;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  searchRadius?: number;
  roomTypeFilter?: string;
  maxPrice?: number;
  requiredAmenities?: string[];
}

export interface LocationSuggestion {
  id: string;
  name: string;
  province: string | null;
  district: string | null;
  lat: number;
  lng: number;
  type: string;
  distance_m?: number;
}

export interface EventSpaceSearchParams {
  location: LocationSuggestion | null;
  eventDate?: string;
  capacity?: number;
  eventType?: string;
  maxPrice?: number;
  amenities?: string[];
}

export interface RideSearchParams {
  fromLocation: LocationSuggestion | null;
  toLocation: LocationSuggestion | null;
  date?: string;
  passengers?: number;
  rideType?: string;
  maxPrice?: number;
  vehicleType?: string;
}

export interface CreateRideRequest {
  fromLocation: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
  };
  toLocation: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
  };
  departureDate: string;
  departureTime: string;
  pricePerSeat: number;
  maxPassengers: number;
  vehicleId: string;
  description?: string;
  allowNegotiation?: boolean;
  allowPickupEnRoute?: boolean;
}

export interface SearchBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface IntelligentSearchParams {
  location: LocationSuggestion | null;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  searchRadius?: number;
}

export interface CompleteHotelSystem {
  hotels: Hotel[];
  room_types: RoomType[];
  room_availability: RoomAvailability[];
  hotel_bookings: HotelBooking[];
  hotel_payments: HotelPayment[];
  hotel_booking_units: HotelBookingUnit[];
  hotel_seasons: HotelSeason[];
  hotel_promotions: HotelPromotion[];
  hotel_reviews: HotelReview[];
  review_helpful_votes: ReviewHelpfulVote[];
  review_reports: ReviewReport[];
  event_spaces: EventSpace[];
  event_space_reviews: EventSpaceReview[];
  event_space_review_helpful_votes: EventSpaceReviewHelpfulVote[];
  event_space_review_reports: EventSpaceReviewReport[];
  event_space_availability: EventSpaceAvailability[];
  event_bookings: EventBooking[];
  event_booking_logs: EventBookingLog[];
  event_space_logs: EventSpaceLog[];
  user_roles: UserRole[];
  advance_payment_promotions: AdvancePaymentPromotion[];
  payment_options: PaymentOption[];
  room_type_photos: RoomTypePhoto[];
  event_space_photos: EventSpacePhoto[];
  user_capacity_documents: UserCapacityDocument[];
  capability_audit_log: CapabilityAuditLog[];
  platform_fee_config: PlatformFeeConfig[];
  user_entities: UserEntity[];
  user_bank_accounts: UserBankAccount[];
  payment_references: PaymentReference[];
  provider_payouts: ProviderPayout[];
  payout_references: PayoutReference[];
  payment_sequences: PaymentSequence[];
  payment_proof_validations: PaymentProofValidation[];
  complaints: Complaint[];
  complaint_attachments: ComplaintAttachment[];
  provider_invoices: ProviderInvoice[];
  invoice_payments: InvoicePayment[];
};