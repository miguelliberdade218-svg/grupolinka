import { eq, and, or, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { hotels, users } from '../../shared/schema';
import { 
  Accommodation, 
  CreateAccommodationData, 
  UpdateAccommodationData, 
  AccommodationSearchCriteria,
  PartnershipProgram,
  User 
} from '../types';

// Helper function for proper type mapping
function mapToAccommodation(hotel: any, host?: any): Accommodation {
  return {
    id: hotel.id,
    name: hotel.name,
    type: hotel.type || 'hotel',
    hostId: hotel.host_id,
    address: hotel.address,
    locality: hotel.locality,
    province: hotel.province,
    country: hotel.country || 'Moçambique',
    lat: hotel.lat ? Number(hotel.lat) : null,
    lng: hotel.lng ? Number(hotel.lng) : null,
    rating: hotel.rating ? Number(hotel.rating) : 0,
    reviewCount: hotel.total_reviews || 0,
    images: hotel.images || [],
    amenities: hotel.amenities || [],
    description: hotel.description,
    distanceFromCenter: 0, // Campo não existe em hotels
    isAvailable: hotel.is_active ?? true,
    offerDriverDiscounts: false, // Campo específico de accommodations
    driverDiscountRate: 0, // Campo específico de accommodations
    minimumDriverLevel: 'bronze', // Campo específico de accommodations
    partnershipBadgeVisible: false, // Campo específico de accommodations
    maxGuests: 2, // Valor padrão
    pricePerNight: 0, // Precisa buscar do room_types
    searchRadius: 50, // Valor padrão
    checkInTime: hotel.check_in_time || "14:00",
    checkOutTime: hotel.check_out_time || "12:00",
    policies: hotel.policies,
    contactEmail: hotel.contact_email,
    contactPhone: hotel.contact_phone,
    isFeatured: hotel.is_featured || false,
    accommodationDiscount: 10, // Valor padrão para compatibilidade
    transportDiscount: 15, // Valor padrão para compatibilidade
    enablePartnerships: false, // Campo específico de accommodations
    host: host ? mapToUser(host) : null,
    createdAt: hotel.created_at || new Date(),
    updatedAt: hotel.updated_at || new Date(),
  } as Accommodation;
}

function mapToUser(user: any): User {
  return {
    ...user,
    rating: user.rating ? Number(user.rating) : 0,
    totalReviews: user.totalReviews || 0,
    isVerified: user.isVerified ?? false,
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date(),
    email: user.email || '',
    phone: user.phone || '',
    userType: user.userType || 'client',
    roles: user.roles || ['client'],
    canOfferServices: user.canOfferServices ?? false
  } as User;
}

export interface IAccommodationStorage {
  // Accommodation management
  createAccommodation(data: CreateAccommodationData): Promise<Accommodation>;
  updateAccommodation(id: string, data: UpdateAccommodationData): Promise<Accommodation>;
  deleteAccommodation(id: string): Promise<void>;
  getAccommodation(id: string): Promise<Accommodation | undefined>;
  
  // Search and discovery
  searchAccommodations(criteria: AccommodationSearchCriteria): Promise<Accommodation[]>;
  getAccommodationsByHost(hostId: string): Promise<Accommodation[]>;
  getAvailableAccommodations(checkIn?: Date, checkOut?: Date): Promise<Accommodation[]>;
  getFeaturedAccommodations(limit?: number): Promise<Accommodation[]>;
  
  // Partnership features
  updatePartnershipProgram(id: string, program: PartnershipProgram): Promise<Accommodation>;
  getPartnerAccommodations(): Promise<Accommodation[]>;
  getDriverDiscountEligible(accommodationId: string, driverLevel: string): Promise<boolean>;
  
  // Availability management
  updateAccommodationAvailability(id: string, isAvailable: boolean): Promise<Accommodation>;
  
  // Analytics
  getAccommodationStatistics(hostId?: string): Promise<{
    totalAccommodations: number;
    activeAccommodations: number;
    partnerAccommodations: number;
    averagePrice: number;
  }>;
}

export class DatabaseAccommodationStorage implements IAccommodationStorage {
  
  // ===== ACCOMMODATION MANAGEMENT =====
  
  async createAccommodation(data: CreateAccommodationData): Promise<Accommodation> {
    try {
      // Para hotels, precisamos adaptar os dados
      const hotelData: any = {
        name: data.name,
        type: data.type || 'hotel',
        host_id: data.hostId,
        address: data.address,
        locality: data.locality || '',
        province: data.province || '',
        contact_email: data.contactEmail || '',
        contact_phone: data.contactPhone || '',
        lat: data.lat?.toString(),
        lng: data.lng?.toString(),
        images: data.images || [],
        amenities: data.amenities || [],
        description: data.description,
        is_active: true,
      };

      const [hotel] = await db
        .insert(hotels)
        .values(hotelData)
        .returning();
      
      return mapToAccommodation(hotel);
    } catch (error) {
      console.error('Error creating accommodation (hotel):', error);
      throw new Error('Failed to create accommodation');
    }
  }

  async updateAccommodation(id: string, data: UpdateAccommodationData): Promise<Accommodation> {
    try {
      const updateData: any = {};
      
      // Mapear campos do accommodation para hotel
      if (data.name !== undefined) updateData.name = data.name;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.locality !== undefined) updateData.locality = data.locality;
      if (data.province !== undefined) updateData.province = data.province;
      if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail;
      if (data.contactPhone !== undefined) updateData.contact_phone = data.contactPhone;
      if (data.images !== undefined) updateData.images = data.images;
      if (data.amenities !== undefined) updateData.amenities = data.amenities;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isAvailable !== undefined) updateData.is_active = data.isAvailable;

      const [hotel] = await db
        .update(hotels)
        .set(updateData)
        .where(eq(hotels.id, id))
        .returning();
      
      return mapToAccommodation(hotel);
    } catch (error) {
      console.error('Error updating accommodation (hotel):', error);
      throw new Error('Failed to update accommodation');
    }
  }

  async deleteAccommodation(id: string): Promise<void> {
    try {
      // Soft delete: marcar como inativo
      await db.update(hotels)
        .set({ is_active: false })
        .where(eq(hotels.id, id));
    } catch (error) {
      console.error('Error deleting accommodation (hotel):', error);
      throw new Error('Failed to delete accommodation');
    }
  }

  async getAccommodation(id: string): Promise<Accommodation | undefined> {
    try {
      const result = await db
        .select({
          hotel: hotels,
          host: users
        })
        .from(hotels)
        .leftJoin(users, eq(hotels.host_id, users.id))
        .where(eq(hotels.id, id));
      
      if (result.length === 0) return undefined;
      
      const { hotel, host } = result[0];
      return mapToAccommodation(hotel, host);
    } catch (error) {
      console.error('Error fetching accommodation (hotel):', error);
      return undefined;
    }
  }

  // ===== SEARCH AND DISCOVERY =====
  
  async searchAccommodations(criteria: AccommodationSearchCriteria): Promise<Accommodation[]> {
    try {
      let query = db
        .select({
          hotel: hotels,
          host: users
        })
        .from(hotels)
        .leftJoin(users, eq(hotels.host_id, users.id));

      const conditions = [eq(hotels.is_active, criteria.isAvailable ?? true)];

      if (criteria.location) {
        conditions.push(
          or(
            sql`${hotels.address} ILIKE ${`%${criteria.location}%`}`,
            sql`${hotels.locality} ILIKE ${`%${criteria.location}%`}`,
            sql`${hotels.province} ILIKE ${`%${criteria.location}%`}`
          )
        );
      }

      if (criteria.type) {
        conditions.push(eq(hotels.type, criteria.type));
      }

      // Para preço, precisamos buscar do room_types - implementação simplificada
      if (criteria.minPrice || criteria.maxPrice) {
        // Filtro básico por agora - precisa ser aprimorado com join com room_types
        console.log('Price filtering not fully implemented for hotels yet');
      }

      if (criteria.guests) {
        // Para hotels, precisamos verificar capacidade dos quartos - simplificado
        console.log('Guest filtering not fully implemented for hotels yet');
      }

      if (criteria.amenities && criteria.amenities.length > 0) {
        conditions.push(sql`${hotels.amenities} && ${criteria.amenities}`);
      }

      if (criteria.hostId) {
        conditions.push(eq(hotels.host_id, criteria.hostId));
      }

      const results = await query
        .where(and(...conditions))
        .orderBy(desc(hotels.rating), desc(hotels.is_featured))
        .limit(50);

      return results.map(({ hotel, host }) => 
        mapToAccommodation(hotel, host)
      );
    } catch (error) {
      console.error('Error searching accommodations (hotels):', error);
      return [];
    }
  }

  async getAccommodationsByHost(hostId: string): Promise<Accommodation[]> {
    try {
      const hotelList = await db
        .select()
        .from(hotels)
        .where(eq(hotels.host_id, hostId))
        .orderBy(desc(hotels.rating));
      
      return hotelList.map(hotel => mapToAccommodation(hotel));
    } catch (error) {
      console.error('Error fetching accommodations by host (hotels):', error);
      return [];
    }
  }

  async getAvailableAccommodations(checkIn?: Date, checkOut?: Date): Promise<Accommodation[]> {
    try {
      const results = await db
        .select({
          hotel: hotels,
          host: users
        })
        .from(hotels)
        .leftJoin(users, eq(hotels.host_id, users.id))
        .where(eq(hotels.is_active, true))
        .orderBy(desc(hotels.rating), desc(hotels.is_featured))
        .limit(100);

      return results.map(({ hotel, host }) => 
        mapToAccommodation(hotel, host)
      );
    } catch (error) {
      console.error('Error fetching available accommodations (hotels):', error);
      return [];
    }
  }

  async getFeaturedAccommodations(limit: number = 10): Promise<Accommodation[]> {
    try {
      const results = await db
        .select({
          hotel: hotels,
          host: users
        })
        .from(hotels)
        .leftJoin(users, eq(hotels.host_id, users.id))
        .where(and(
          eq(hotels.is_active, true),
          eq(hotels.is_featured, true),
          sql`CAST(${hotels.rating} AS DECIMAL) >= 4.0`
        ))
        .orderBy(desc(hotels.rating), desc(hotels.total_reviews))
        .limit(limit);

      return results.map(({ hotel, host }) => 
        mapToAccommodation(hotel, host)
      );
    } catch (error) {
      console.error('Error fetching featured accommodations (hotels):', error);
      return [];
    }
  }

  // ===== PARTNERSHIP FEATURES =====
  
  async updatePartnershipProgram(id: string, program: PartnershipProgram): Promise<Accommodation> {
    try {
      // Para hotels, estas funcionalidades precisam ser adaptadas
      console.log('Partnership program update for hotels not fully implemented');
      const hotel = await this.getAccommodation(id);
      if (!hotel) throw new Error('Accommodation not found');
      return hotel;
    } catch (error) {
      console.error('Error updating partnership program (hotels):', error);
      throw error;
    }
  }

  async getPartnerAccommodations(): Promise<Accommodation[]> {
    try {
      // Para hotels, retornar hotéis em destaque
      const results = await db
        .select({
          hotel: hotels,
          host: users
        })
        .from(hotels)
        .leftJoin(users, eq(hotels.host_id, users.id))
        .where(and(
          eq(hotels.is_active, true),
          eq(hotels.is_featured, true)
        ))
        .orderBy(desc(hotels.rating));

      return results.map(({ hotel, host }) => 
        mapToAccommodation(hotel, host)
      );
    } catch (error) {
      console.error('Error fetching partner accommodations (hotels):', error);
      return [];
    }
  }

  async getDriverDiscountEligible(accommodationId: string, driverLevel: string): Promise<boolean> {
    try {
      // Para hotels, retornar false por padrão
      return false;
    } catch (error) {
      console.error('Error checking driver discount eligibility (hotels):', error);
      return false;
    }
  }

  // ===== AVAILABILITY MANAGEMENT =====
  
  async updateAccommodationAvailability(id: string, isAvailable: boolean): Promise<Accommodation> {
    try {
      return this.updateAccommodation(id, { isAvailable });
    } catch (error) {
      console.error('Error updating accommodation availability (hotels):', error);
      throw error;
    }
  }

  // ===== ANALYTICS =====
  
  async getAccommodationStatistics(hostId?: string): Promise<{
    totalAccommodations: number;
    activeAccommodations: number;
    partnerAccommodations: number;
    averagePrice: number;
  }> {
    try {
      const baseCondition = hostId ? eq(hotels.host_id, hostId) : sql`1=1`;

      const [totalAccommodations] = await db
        .select({ count: sql`count(*)` })
        .from(hotels)
        .where(baseCondition);

      const [activeAccommodations] = await db
        .select({ count: sql`count(*)` })
        .from(hotels)
        .where(and(baseCondition, eq(hotels.is_active, true)));

      // Para hotels, "partner" = featured
      const [partnerAccommodations] = await db
        .select({ count: sql`count(*)` })
        .from(hotels)
        .where(and(baseCondition, eq(hotels.is_featured, true)));

      return {
        totalAccommodations: Number(totalAccommodations.count),
        activeAccommodations: Number(activeAccommodations.count),
        partnerAccommodations: Number(partnerAccommodations.count),
        averagePrice: 0, // Precisa calcular a partir dos room_types
      };
    } catch (error) {
      console.error('Error fetching accommodation statistics (hotels):', error);
      return {
        totalAccommodations: 0,
        activeAccommodations: 0,
        partnerAccommodations: 0,
        averagePrice: 0,
      };
    }
  }
}

export const accommodationStorage = new DatabaseAccommodationStorage();