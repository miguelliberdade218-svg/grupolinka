// types/clientTypes.ts

// ===== RIDE TYPES ESPECÍFICOS PARA CLIENTES =====
export interface RideSearchCriteria {
  fromLocation?: string;
  toLocation?: string;
  departureDate?: Date;
  minSeats?: number;
  maxPrice?: number;
  driverId?: string;
}

export interface CreateRideData {
  driverId: string;
  fromLocation: string;
  toLocation: string;
  departureDate: Date;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  vehicleType?: string;
  additionalInfo?: string;
}

export interface UpdateRideData {
  fromLocation?: string;
  toLocation?: string;
  departureDate?: Date;
  departureTime?: string;
  availableSeats?: number;
  pricePerSeat?: number;
  vehicleType?: string;
  additionalInfo?: string;
  status?: string;
}

export interface Ride extends BaseEntity {
  driverId: string;
  fromLocation: string;
  toLocation: string;
  departureDate: Date;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: string;
  vehicleType?: string;
  additionalInfo?: string;
  status: string;
  driver?: User;
}

export interface RideWithMatching extends Ride {
  matchScore: number;
  matchType: string;
  matchDescription: string;
  fromProvince?: string;
  toProvince?: string;
}

// ===== BOOKING TYPES ESPECÍFICOS PARA CLIENTES =====
export interface CreateBookingData {
  rideId?: string;
  accommodationId?: string;
  eventId?: string;
  type: BookingType;
  passengerId: string;
  seatsBooked?: number;
  totalPrice: number;
  guestInfo: {
    name: string;
    email: string;
    phone: string;
  };
  details: {
    passengers?: number;
    checkIn?: string;
    checkOut?: string;
    totalAmount: number;
  };
}

export interface Booking extends BaseEntity {
  id: string;
  rideId?: string;
  passengerId?: string;
  seatsBooked: number;
  totalPrice: string;
  status?: string;
  accommodationId?: string;
  eventId?: string;
  type: BookingType;
  guestInfo: {
    name: string;
    email: string;
    phone: string;
  };
  details: {
    passengers?: number;
    checkIn?: string;
    checkOut?: string;
    totalAmount: number;
  };
  clientId?: string;
  providerId?: string;
  serviceName?: string;
}

// ===== USER TYPES =====
export interface User extends BaseEntity {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;

  // ✅ SISTEMA DE CAPACIDADES (substitui userType e roles)
  canBookServices: boolean;
  canDrive: boolean;
  canManageHotels: boolean;
  isAdmin: boolean;

  // ✅ STATUS DE VERIFICAÇÃO
  driverVerificationStatus: VerificationStatus | null;
  hotelManagerVerificationStatus: VerificationStatus | null;

  // ✅ DADOS ESPECÍFICOS
  driverLicenseNumber: string | null;
  driverVehicleType: string | null;
  businessTaxId: string | null;
  companyName: string | null;
  companyVatNumber: string | null;
  companyAddress: string | null;
  companyPhone: string | null;

  // ✅ TIPO DE CONTA
  accountType: AccountType;

  // Campos legados (manter compatibilidade)
  userType?: UserRole;
  roles?: UserRole[];
  canOfferServices?: boolean;
  isVerified?: boolean;
  verificationStatus?: VerificationStatus;
  profileImageUrl?: string | null;
  avatar?: string | null;
  rating?: number;
  totalReviews?: number;
}

// ===== DRIVER STATS =====
export interface DriverStats {
  totalRides: number;
  completedRides: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
}

// ===== BASE TYPES =====
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date | null;
}

export type UserRole = 'client' | 'driver' | 'hotel_manager' | 'admin';
export type BookingType = 'ride' | 'accommodation' | 'event';
export type VerificationStatus = 'pending' | 'in_review' | 'verified' | 'rejected';
export type AccountType = 'individual' | 'company';