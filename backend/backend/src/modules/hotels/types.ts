/**
 * Hotel Module Types
 * Based on modulo_hoteis_event_spaces_schema_final_20251223.sql
 */

import { z } from 'zod';

// ===== HOTEL TYPES =====

export interface Hotel {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  address: string;
  locality?: string | null;
  province?: string | null;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  locationGeom?: any; // PostGIS geometry
  images?: string[];
  amenities?: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  hostId: string;
  checkInTime?: string;
  checkOutTime?: string;
  policies?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  geom?: any; // PostGIS geometry
  rating?: number | null;
  totalReviews?: number | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface HotelRoomType {
  id: string;
  hotelId: string;
  name: string;
  description?: string | null;
  maxOccupancy: number;
  basePrice: number;
  availableUnits: number;
  amenities?: string[];
  images?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HotelSeason {
  id: string;
  hotelId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  multiplier: number;
  description?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HotelPromotion {
  id: string;
  hotelId: string;
  name: string;
  code?: string | null;
  discountType: 'percentage' | 'fixed' | 'free_night';
  discountValue: number;
  minStay?: number | null;
  maxStay?: number | null;
  validFrom: Date;
  validTo: Date;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HotelBooking {
  id: string;
  hotelId: string;
  roomTypeId: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  children: number;
  units: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'checked_in' | 'checked_out' | 'no_show';
  totalAmount: number;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  finalAmount: number;
  paymentStatus: 'pending' | 'partial' | 'completed' | 'failed' | 'refunded';
  invoiceNumber?: string | null;
  promoCode?: string | null;
  userId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HotelBookingUnit {
  id: string;
  bookingId: string;
  roomTypeId: string;
  hotelId: string;
  date: Date;
  unitNumber: string;
  status: 'reserved' | 'occupied' | 'available' | 'maintenance';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HotelBookingLog {
  id: string;
  bookingId: string;
  action: string;
  details?: any;
  userId?: string | null;
  createdAt?: Date;
}

export interface HotelReview {
  id: string;
  hotelId: string;
  bookingId?: string | null;
  guestName: string;
  guestEmail: string;
  cleanlinessRating: number;
  comfortRating: number;
  locationRating: number;
  facilitiesRating: number;
  staffRating: number;
  valueRating: number;
  overallRating: number;
  title?: string | null;
  comment?: string | null;
  pros?: string | null;
  cons?: string | null;
  isVerified?: boolean;
  helpfulCount?: number;
  responseText?: string | null;
  responseDate?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HotelFinancialReport {
  id: string;
  hotelId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  hotelRevenue: number;
  eventRevenue: number;
  avgDailyRate: number;
  occupancyRate: number;
  revpar: number;
  cancellationRate: number;
  netRevenue: number;
  reportData: any;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===== EVENT SPACE TYPES =====

export interface EventSpace {
  id: string;
  hotelId: string;
  name: string;
  description?: string | null;
  capacityMin: number;
  capacityMax: number;
  eventTypes: string[];
  setupConfigurations: string[];
  basePrice: number;
  images?: string[];
  amenities?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventBooking {
  id: string;
  eventSpaceId: string;
  hotelId: string;
  startDatetime: Date;
  endDatetime: Date;
  eventType: string;
  expectedAttendees: number;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
  eventTitle?: string | null;
  eventDescription?: string | null;
  companyName?: string | null;
  specialRequests?: string | null;
  additionalServices?: any;
  setupConfiguration?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress';
  totalAmount: number;
  paymentStatus: 'pending' | 'partial' | 'completed' | 'failed' | 'refunded';
  invoiceNumber?: string | null;
  userId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventBookingLog {
  id: string;
  bookingId: string;
  action: string;
  details?: any;
  userId?: string | null;
  createdAt?: Date;
}

export interface EventAvailability {
  id: string;
  eventSpaceId: string;
  date: Date;
  startTime: string;
  endTime: string;
  price: number;
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ===== VALIDATION SCHEMAS =====

export const hotelSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  address: z.string().min(5),
  locality: z.string().optional(),
  province: z.string().optional(),
  country: z.string().default('Mozambique'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  hostId: z.string(),
  checkInTime: z.string().default('14:00:00'),
  checkOutTime: z.string().default('12:00:00'),
  policies: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const hotelRoomTypeSchema = z.object({
  hotelId: z.string(),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  maxOccupancy: z.number().int().positive(),
  basePrice: z.number().positive(),
  availableUnits: z.number().int().min(0),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const hotelBookingSchema = z.object({
  hotelId: z.string(),
  roomTypeId: z.string(),
  checkIn: z.string().transform(str => new Date(str)),
  checkOut: z.string().transform(str => new Date(str)),
  adults: z.number().int().positive(),
  children: z.number().int().min(0).default(0),
  units: z.number().int().positive(),
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string(),
  specialRequests: z.string().optional(),
  promoCode: z.string().optional(),
  userId: z.string().optional(),
});

export const eventSpaceSchema = z.object({
  hotelId: z.string(),
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  capacityMin: z.number().int().positive(),
  capacityMax: z.number().int().positive(),
  eventTypes: z.array(z.string()),
  setupConfigurations: z.array(z.string()),
  basePrice: z.number().positive(),
  images: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const eventBookingSchema = z.object({
  eventSpaceId: z.string(),
  hotelId: z.string(),
  startDatetime: z.string().transform(str => new Date(str)),
  endDatetime: z.string().transform(str => new Date(str)),
  eventType: z.string(),
  expectedAttendees: z.number().int().positive(),
  organizerName: z.string().min(2),
  organizerEmail: z.string().email(),
  organizerPhone: z.string(),
  eventTitle: z.string().optional(),
  eventDescription: z.string().optional(),
  companyName: z.string().optional(),
  specialRequests: z.string().optional(),
  additionalServices: z.any().optional(),
  setupConfiguration: z.string().optional(),
  userId: z.string().optional(),
});

// ===== TYPE INFERENCES =====

export type CreateHotelInput = z.infer<typeof hotelSchema>;
export type CreateHotelRoomTypeInput = z.infer<typeof hotelRoomTypeSchema>;
export type CreateHotelBookingInput = z.infer<typeof hotelBookingSchema>;
export type CreateEventSpaceInput = z.infer<typeof eventSpaceSchema>;
export type CreateEventBookingInput = z.infer<typeof eventBookingSchema>;