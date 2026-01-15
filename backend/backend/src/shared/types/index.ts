// Tipos compartilhados entre módulos

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  isVerified: boolean;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Role types para o sistema
export type UserRole = 'client' | 'driver' | 'hotel' | 'event' | 'admin';

// Status types para bookings
export type BookingStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'confirmed' 
  | 'in_progress'
  | 'completed' 
  | 'cancelled' 
  | 'rejected';

// Service types
export type ServiceType = 'ride' | 'accommodation' | 'event';