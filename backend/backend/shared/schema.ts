// shared/schema.ts - VERSÃO COMPLETA FINAL CORRIGIDA (13/01/2026) - SEM POSTGIS
// REMOVIDO: hotels_base, legacyRoomTypes, accommodations, hotelRooms, hotelFinancialReports (tabelas antigas)
// CORRIGIDO: Todas referências FK para hotels.id
// REMOVIDO: geometry - usando lat/lng numéricos e text para geom
// Nada de rides, vehicles, drivers foi modificado

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
export const verificationStatusEnum = pgEnum("verification_status", ['pending', 'in_review', 'verified', 'rejected']);
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

// ==================== TABELAS BASE ====================
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
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  phoneIdx: index("users_phone_idx").on(table.phone),
  userTypeIdx: index("users_user_type_idx").on(table.userType),
}));

// ==================== TABELAS DE REVIEWS DE HOTEL (SISTEMA COMPLETO) ====================
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

// ==================== TABELAS DE LOCALIZAÇÃO ====================
export const mozambiqueLocations = pgTable("mozambique_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }),
  district: varchar("district", { length: 100 }),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  geom: text("geom"), // Usando text em vez de geometry do PostGIS
  type: varchar("type", { length: 20 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  nameIdx: index("locations_name_idx").on(table.name),
  provinceIdx: index("locations_province_idx").on(table.province),
  geoIdx: index("locations_geo_idx").on(table.lat, table.lng),
  typeIdx: index("locations_type_idx").on(table.type),
}));

// ==================== SISTEMA DE TRANSPORTE (NÃO ALTERADO) ====================
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
  location_geom: text("location_geom"), // Usando text em vez de geometry do PostGIS
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

// ==================== DISPONIBILIDADE DE QUARTOS ====================
export const roomAvailability = pgTable("roomAvailability", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  roomTypeId: uuid("roomTypeId").references(() => roomTypes.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date", { mode: 'date' }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }), // ✅ REMOVA O .notNull()
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

// ==================== ESPAÇOS PARA EVENTOS ====================
export const eventSpaces = pgTable("eventSpaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  capacityMin: integer("capacityMin").notNull().default(10),
  capacityMax: integer("capacityMax").notNull().default(100),
  basePriceHourly: numeric("basePriceHourly", { precision: 10, scale: 2 }),
  basePriceHalfDay: numeric("basePriceHalfDay", { precision: 10, scale: 2 }),
  basePriceFullDay: numeric("basePriceFullDay", { precision: 10, scale: 2 }),
  pricePerHour: numeric("pricePerHour", { precision: 10, scale: 2 }),
  pricePerDay: numeric("pricePerDay", { precision: 10, scale: 2 }),
  pricePerEvent: numeric("pricePerEvent", { precision: 10, scale: 2 }),
  weekendSurchargePercent: integer("weekendSurchargePercent").default(0),
  eventTypes: text("eventTypes").array().default(sql`ARRAY[]::text[]`),
  amenities: text("amenities").array().default(sql`ARRAY[]::text[]`),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  spaceType: text("spaceType"),
  ceilingHeight: numeric("ceilingHeight", { precision: 5, scale: 2 }),
  hasStage: boolean("hasStage").default(false),
  naturalLight: boolean("naturalLight").default(false),
  loadingAccess: boolean("loadingAccess").default(false),
  dressingRooms: integer("dressingRooms").default(0),
  insuranceRequired: boolean("insuranceRequired").default(false),
  alcoholAllowed: boolean("alcoholAllowed").default(false),
  includesCatering: boolean("includesCatering").default(false),
  includesFurniture: boolean("includesFurniture").default(false),
  includesCleaning: boolean("includesCleaning").default(false),
  includesSecurity: boolean("includesSecurity").default(false),
  floorPlanImage: text("floorPlanImage"),
  virtualTourUrl: text("virtualTourUrl"),
  approvalRequired: boolean("approvalRequired").default(false),
  slug: text("slug").unique(),
  isActive: boolean("isActive").default(true),
  isFeatured: boolean("isFeatured").default(false),
  viewCount: integer("viewCount").default(0),
  averageRating: numeric("averageRating", { precision: 3, scale: 2 }),
  bookingCount: integer("bookingCount").default(0),
  lastBookedDate: timestamp("lastBookedDate", { mode: 'date' }),
  managedByHotelManagerId: uuid("managedByHotelManagerId"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
  areaSqm: integer("areaSqm"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  locationGeom: text("locationGeom"),
  distanceFromCenterKm: numeric("distanceFromCenterKm", { precision: 10, scale: 2 }),
  popularityScore: integer("popularityScore").default(0),
  capacityTheater: integer("capacityTheater"),
  capacityClassroom: integer("capacityClassroom"),
  capacityBanquet: integer("capacityBanquet"),
  capacityStanding: integer("capacityStanding"),
  capacityCocktail: integer("capacityCocktail"),
  stageDimensions: text("stageDimensions"),
  securityDeposit: numeric("securityDeposit", { precision: 10, scale: 2 }),
  maxDurationHours: integer("maxDurationHours"),
  minBookingHours: integer("minBookingHours"),
  noiseRestriction: text("noiseRestriction"),
  allowedEventTypes: text("allowedEventTypes").array().default(sql`ARRAY[]::text[]`),
  prohibitedEventTypes: text("prohibitedEventTypes").array().default(sql`ARRAY[]::text[]`),
  equipment: jsonb("equipment").default(sql`'{}'::jsonb`),
  setupOptions: text("setupOptions").array().default(sql`ARRAY[]::text[]`),
}, (table) => ({
  hotelIdx: index("eventSpaces_hotelId_idx").on(table.hotelId),
  activeIdx: index("eventSpaces_isActive_idx").on(table.isActive),
  slugIdx: index("eventSpaces_slug_idx").on(table.slug),
}));

// VIEW para compatibilidade com snake_case
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
  date: timestamp("date", { mode: 'date' }).notNull(),
  slots: jsonb("slots").notNull().default(sql`'[]'::jsonb`),
  priceOverride: numeric("priceOverride", { precision: 10, scale: 2 }),
  isAvailable: boolean("isAvailable").default(true),
  stopSell: boolean("stopSell").default(false),
  minBookingHours: integer("minBookingHours").default(4),
  isMultiDayEvent: boolean("isMultiDayEvent").default(false),
  eventStartDate: timestamp("eventStartDate", { mode: 'date' }),
  eventEndDate: timestamp("eventEndDate", { mode: 'date' }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => ({
  spaceDateIdx: uniqueIndex("eventAvailability_space_date_idx").on(table.eventSpaceId, table.date),
  availableIdx: index("eventAvailability_isAvailable_idx").on(table.isAvailable),
}));

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
  startDatetime: timestamp("startDatetime").notNull(),
  endDatetime: timestamp("endDatetime").notNull(),
  durationHours: numeric("durationHours", { precision: 8, scale: 2 }),
  expectedAttendees: integer("expectedAttendees").notNull().default(10),
  specialRequests: text("specialRequests"),
  additionalServices: jsonb("additionalServices").default(sql`'{}'::jsonb`),
  basePrice: numeric("basePrice", { precision: 10, scale: 2 }).notNull(),
  equipmentFees: numeric("equipmentFees", { precision: 10, scale: 2 }).default(sql`0.00`),
  serviceFees: numeric("serviceFees", { precision: 10, scale: 2 }).default(sql`0.00`),
  weekendSurcharge: numeric("weekendSurcharge", { precision: 10, scale: 2 }).default(sql`0.00`),
  securityDeposit: numeric("securityDeposit", { precision: 10, scale: 2 }).default(sql`0.00`),
  depositPaid: numeric("depositPaid", { precision: 10, scale: 2 }).default(sql`0.00`),
  balanceDue: numeric("balanceDue", { precision: 10, scale: 2 }).default(sql`0.00`),
  totalPrice: numeric("totalPrice", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('confirmed'),
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

// Adicione após a definição de eventBookings (linha ~1896)

export const eventPayments = pgTable("event_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventBookingId: uuid("event_booking_id").references(() => eventBookings.id, { onDelete: "cascade" }),
  hotelId: uuid("hotel_id").references(() => hotels.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  
  // Informações do pagamento
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentType: text("payment_type").default("event_payment"), // deposit, full, partial, refund
  referenceNumber: text("reference_number"),
  proofImageUrl: text("proof_image_url"),
  
  // Status
  status: text("status").default("pending"), // pending, confirmed, failed, refunded
  confirmedBy: uuid("confirmed_by").references(() => users.id, { onDelete: "set null" }),
  
  // Datas
  paidAt: timestamp("paid_at", { withTimezone: false }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false }).defaultNow(),
  
  // Metadados
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
}, (table) => ({
  eventBookingIdx: index("event_payments_event_booking_idx").on(table.eventBookingId),
  hotelIdx: index("event_payments_hotel_idx").on(table.hotelId),
  statusIdx: index("event_payments_status_idx").on(table.status),
}));

export const eventBookingLogs = pgTable("eventBookingLogs", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("bookingId")
    .references(() => eventBookings.id, { onDelete: "cascade" })
    .notNull(),
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
  hotelId: uuid("hotelId").references(() => hotels.id, { onDelete: "cascade" }),
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
  hotelIdx: index("bookings_hotel_idx").on(table.hotelId),
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

// ==================== TABELAS REMOVIDAS/ELIMINADAS ====================
// NOTA: As seguintes tabelas foram removidas do schema por serem antigas/não usadas:
// - hotels_base (substituída por hotels)
// - accommodations (sistema antigo)
// - hotelRooms (sistema antigo)
// - legacyRoomTypes (sistema antigo)
// - hotelFinancialReports (não implementado ainda)

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
  proposalId: uuid("proposalId")
    .references(() => partnershipProposals.id, { onDelete: "cascade" })
    .notNull(),
  driverId: text("driverId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
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
const verificationStatusZod = z.enum(["pending", "in_review", "verified", "rejected"]);
const paymentMethodZod = z.enum(["card", "mpesa", "bank", "mobile_money", "bank_transfer", "pending"]);
const rideTypeZod = z.enum(["regular", "premium", "shared", "express"]);
const locationTypeZod = z.enum(["city", "town", "village"]);
const vehicleTypeZod = z.enum(["economy", "comfort", "luxury", "family", "premium", "van", "suv"]);
const reportReasonZod = z.enum(["inappropriate", "fake", "spam", "offensive", "other"]);
const reportStatusZod = z.enum(["pending", "reviewed", "resolved", "dismissed"]);

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().optional(),
  phone: z.string().optional(),
  userType: userTypeZod,
  verificationStatus: verificationStatusZod.optional(),
  rating: z.number().min(0).max(5).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  phone: true,
  userType: true,
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

// CORRIGIDO: agora usa createInsertSchema(hotels) em vez de createInsertSchema(hotels_base)
export const insertHotelSchema = createInsertSchema(hotels, {
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  is_active: z.boolean().default(true),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
  host_id: true,
});

// ==================== SCHEMAS PARA REVIEWS ====================
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

// SCHEMAS PARA EVENTOS CORRIGIDOS (CAMELCASE)
export const insertEventSpaceSchema = createInsertSchema(eventSpaces, {
  name: z.string().min(1),
  description: z.string().optional(),
  capacityMin: z.number().int().positive(),
  capacityMax: z.number().int().positive(),
  basePriceHourly: z.number().positive().optional(),
  pricePerHour: z.number().positive().optional(),
  weekendSurchargePercent: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
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
  startDatetime: z.date(),
  endDatetime: z.date(),
  expectedAttendees: z.number().int().positive(),
  basePrice: z.number().positive(),
  totalPrice: z.number().positive(),
  status: z.string().default('confirmed'),
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

// ==================== SCHEMAS PARA PAGAMENTOS HOTELEIROS ====================
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

// ==================== TIPOS TYPESCRIPT ====================
export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type Ride = typeof rides.$inferSelect;
export type RideInsert = typeof rides.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type VehicleInsert = typeof vehicles.$inferInsert;
export type Hotel = typeof hotels.$inferSelect;
export type HotelInsert = typeof hotels.$inferInsert;
export type RoomType = typeof roomTypes.$inferSelect;
export type RoomTypeInsert = typeof roomTypes.$inferInsert;
export type RoomAvailability = typeof roomAvailability.$inferSelect;
export type RoomAvailabilityInsert = typeof roomAvailability.$inferInsert;

// Tipos para as tabelas de reservas hoteleiras
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

// Tipos para sistemas de reviews
export type HotelReview = typeof hotelReviews.$inferSelect;
export type HotelReviewInsert = typeof hotelReviews.$inferInsert;
export type ReviewHelpfulVote = typeof reviewHelpfulVotes.$inferSelect;
export type ReviewHelpfulVoteInsert = typeof reviewHelpfulVotes.$inferInsert;
export type ReviewReport = typeof reviewReports.$inferSelect;
export type ReviewReportInsert = typeof reviewReports.$inferInsert;

export type EventSpaceReview = typeof eventSpaceReviews.$inferSelect;
export type EventSpaceReviewInsert = typeof eventSpaceReviews.$inferInsert;
export type EventSpaceReviewHelpfulVote = typeof eventSpaceReviewHelpfulVotes.$inferSelect;
export type EventSpaceReviewHelpfulVoteInsert = typeof eventSpaceReviewHelpfulVotes.$inferInsert;
export type EventSpaceReviewReport = typeof eventSpaceReviewReports.$inferSelect;
export type EventSpaceReviewReportInsert = typeof eventSpaceReviewReports.$inferInsert;

// Tipos para eventos (CAMELCASE CORRIGIDOS)
export type EventSpace = typeof eventSpaces.$inferSelect;
export type EventSpaceInsert = typeof eventSpaces.$inferInsert;
export type EventSpacesCompatible = typeof eventSpacesCompatible.$inferSelect;
export type EventBooking = typeof eventBookings.$inferSelect;
export type EventBookingInsert = typeof eventBookings.$inferInsert;
export type EventSpaceAvailability = typeof eventAvailability.$inferSelect;
export type EventSpaceAvailabilityInsert = typeof eventAvailability.$inferInsert;
export type EventBookingLog = typeof eventBookingLogs.$inferSelect;
export type EventBookingLogInsert = typeof eventBookingLogs.$inferInsert;
export type EventSpaceLog = typeof eventSpaceLogs.$inferSelect;
export type EventSpaceLogInsert = typeof eventSpaceLogs.$inferInsert;

// Adicione também ao tipo inferido (linha ~1896)
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

// ==================== TIPOS AUXILIARES COM CAMELCASE ====================
// Tipos auxiliares para hotelPayments que usam camelCase
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

// Função para converter de snake_case para camelCase
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

// Função para converter de camelCase para snake_case (para inserção)
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

// Interface para inserção com camelCase
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
}