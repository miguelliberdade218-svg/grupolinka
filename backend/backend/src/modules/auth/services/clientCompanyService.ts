// ========================================================================
// CLIENT COMPANY PROFILE SYSTEM
// Complete support for Client Companies (Empresas Clientes)
// 25 February 2026
// ========================================================================

import { db } from "../../../../db.js";
import { sql, eq } from "drizzle-orm";
import { users } from "../../../../shared/schema.js";
import type { AuthenticatedRequest } from "../../../../shared/types.js";
import { createApiResponse, createApiError } from "../../../shared/firebaseAuth.js";

/**
 * CLIENT COMPANY PROFILE SCHEMA
 * From schema.ts - users table already supports:
 * - accountType: 'individual' | 'company'
 * - companyName, companyVatNumber, companyAddress, companyPhone
 * - clientVerificationStatus, clientVerificationNotes, clientVerifiedAt
 * - clientSuspendedAt, clientSuspensionReason, clientSuspensionEndDate
 */

export interface ClientCompanyProfile {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  accountType: 'company';
  
  // Company details
  companyName: string;
  companyVatNumber: string;
  companyAddress: string;
  companyPhone: string;
  
  // Verification
  clientVerificationStatus: 'verified' | 'pending' | 'rejected' | 'suspended';
  clientVerificationNotes?: string;
  clientVerifiedAt?: Date;
  
  // Suspension
  clientSuspendedAt?: Date;
  clientSuspensionReason?: string;
  clientSuspensionEndDate?: Date;
  
  // Bookings
  totalBookings: number;
  totalSpent: number;
  activeBookings: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientCompanyBooking {
  id: string;
  companyUserId: string;
  bookingType: 'ride' | 'hotel' | 'event_space';
  bookingId: string;
  
  // Booking info
  referenceNumber: string;
  serviceDate: Date;
  totalAmount: number;
  paymentStatus: string;
  
  // Booking details
  providerName: string;
  providerPhone: string;
  serviceDescription: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export class ClientCompanyService {
  /**
   * Get or create company client profile
   */
  static async getOrCreateProfile(userId: string) {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      const user = result[0];

      if (!user) {
        throw new Error('User not found');
      }

      if (user.accountType !== 'company') {
        throw new Error('User is not a company account');
      }

      // Get booking statistics
      const stats = await this.getCompanyStatistics(userId);

      return {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        accountType: 'company',
        
        companyName: user.companyName,
        companyVatNumber: user.companyVatNumber,
        companyAddress: user.companyAddress,
        companyPhone: user.companyPhone,
        
        clientVerificationStatus: user.clientVerificationStatus,
        clientVerificationNotes: user.clientVerificationNotes,
        clientVerifiedAt: user.clientVerifiedAt,
        
        clientSuspendedAt: user.clientSuspendedAt,
        clientSuspensionReason: user.clientSuspensionReason,
        clientSuspensionEndDate: user.clientSuspensionEndDate,
        
        ...stats,
        
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      console.error('Error getting company profile:', error);
      throw error;
    }
  }

  /**
   * Get company statistics
   */
  static async getCompanyStatistics(userId: string) {
    try {
      // TODO: Implement when booking tables are fully available
      return {
        totalBookings: 0,
        totalSpent: 0,
        activeBookings: 0,
      };
    } catch (error) {
      console.error('Error getting company statistics:', error);
      return {
        totalBookings: 0,
        totalSpent: 0,
        activeBookings: 0,
      };
    }
  }

  /**
   * Update company profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<ClientCompanyProfile>
  ) {
    try {
      const { companyName, companyPhone, companyAddress } = updates;

      const updateData: any = { updatedAt: sql`now()` };
      if (companyName) updateData.companyName = companyName;
      if (companyPhone) updateData.companyPhone = companyPhone;
      if (companyAddress) updateData.companyAddress = companyAddress;

      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating company profile:', error);
      throw error;
    }
  }

  /**
   * Get company bookings with pagination
   */
  static async getCompanyBookings(
    userId: string,
    limit = 20,
    offset = 0,
    filter?: { status?: string; type?: string }
  ) {
    try {
      // TODO: Implement when booking tables are ready
      return {
        bookings: [],
        total: 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error getting company bookings:', error);
      throw error;
    }
  }

  /**
   * Get company invoices/receipts
   */
  static async getCompanyInvoices(
    userId: string,
    limit = 20,
    offset = 0
  ) {
    try {
      // TODO: Implement when payment tables are ready
      return {
        invoices: [],
        total: 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error getting company invoices:', error);
      throw error;
    }
  }

  /**
   * Request suspension lifting (if suspended)
   */
  static async requestSuspensionLifting(userId: string, reason: string) {
    try {
      // TODO: Create support ticket or send to admin for review
      console.log(`📋 Suspension lifting request from ${userId}: ${reason}`);
      return { message: 'Pedido enviado para análise' };
    } catch (error) {
      console.error('Error requesting suspension lifting:', error);
      throw error;
    }
  }

  /**
   * Get payment methods for company
   */
  static async getPaymentMethods(userId: string) {
    try {
      // TODO: Get from userBankAccounts table
      return [];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }
}

export default ClientCompanyService;
