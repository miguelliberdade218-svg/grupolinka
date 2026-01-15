import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import { bookings, users } from '../../shared/schema';
import { 
  ServiceType,
  PaymentMethod,
  PaymentStatus 
} from '../../src/shared/types';
import type { 
  Fee, 
  Payment, 
  PaymentData,
  FeeData,
  Earnings,
  RevenueReport,
  Transaction,
  TransactionFilters,
  TimePeriod
} from '../types';

// In-memory storage for billing data until proper tables are added
class InMemoryBillingStorage {
  private fees: Map<string, Fee> = new Map();
  private payments: Map<string, Payment> = new Map();
  private transactions: Map<string, Transaction> = new Map();

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createFee(bookingId: string, feeData: FeeData): Promise<Fee> {
    const fee: Fee = {
      id: this.generateId('fee'),
      bookingId,
      type: feeData.type as any,
      amount: Number(feeData.amount), // CORRIGIDO: number em vez de string
      percentage: feeData.percentage,
      description: feeData.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.fees.set(fee.id, fee);
    return fee;
  }

  async createPayment(bookingId: string, paymentData: PaymentData): Promise<Payment> {
    const payment: Payment = {
      id: this.generateId('pay'),
      bookingId,
      amount: Number(paymentData.amount), // CORRIGIDO: number em vez de string
      currency: paymentData.currency || 'MZN', // CORRIGIDO: valor padrão MZN
      status: 'completed',
      method: paymentData.method,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.payments.set(payment.id, payment);
    
    // Create transaction record
    const transaction: Transaction = {
      id: this.generateId('txn'),
      type: 'payment',
      amount: Number(paymentData.amount), // CORRIGIDO: garantir que é number
      currency: paymentData.currency || 'MZN', // CORRIGIDO: valor padrão MZN
      status: 'completed',
      userId: 'user_id', // Would get from booking
      bookingId,
      createdAt: new Date(),
    };
    
    this.transactions.set(transaction.id, transaction);
    
    return payment;
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(p => p.bookingId === bookingId);
  }

  async getFeesByBooking(bookingId: string): Promise<Fee[]> {
    return Array.from(this.fees.values()).filter(f => f.bookingId === bookingId);
  }

  async getTransactions(filters: TransactionFilters): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values());

    if (filters.userId) {
      transactions = transactions.filter(t => t.userId === filters.userId);
    }
    if (filters.type) {
      transactions = transactions.filter(t => t.type === filters.type);
    }
    if (filters.status) {
      transactions = transactions.filter(t => t.status === filters.status);
    }
    if (filters.dateRange) {
      transactions = transactions.filter(t => 
        t.createdAt >= filters.dateRange!.from && t.createdAt <= filters.dateRange!.to
      );
    }

    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTotalRevenue(period?: TimePeriod): Promise<number> {
    let transactions = Array.from(this.transactions.values()).filter(t => t.type === 'payment');

    if (period) {
      transactions = transactions.filter(t => 
        t.createdAt >= period.startDate && t.createdAt <= period.endDate
      );
    }

    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }
}

export interface IBillingStorage {
  // Fee management
  createFee(bookingId: string, feeData: FeeData): Promise<Fee>;
  calculatePlatformFee(amount: number, serviceType: ServiceType): Promise<number>;
  getFeesReport(dateRange?: { from: Date; to: Date }): Promise<any>;
  
  // Payments
  processPayment(bookingId: string, paymentMethod: PaymentMethod): Promise<Payment>;
  issueRefund(paymentId: string, amount: number, reason: string): Promise<any>;
  
  // Provider earnings
  calculateProviderEarnings(providerId: string, period: TimePeriod): Promise<Earnings>;
  generatePayoutReport(providerId: string): Promise<any>;
  
  // Financial analytics
  getPlatformRevenue(period: TimePeriod): Promise<RevenueReport>;
  getTransactionHistory(filters: TransactionFilters): Promise<Transaction[]>;
}

export class DatabaseBillingStorage implements IBillingStorage {
  private memoryStorage = new InMemoryBillingStorage();

  // ===== FEE MANAGEMENT =====
  
  async createFee(bookingId: string, feeData: FeeData): Promise<Fee> {
    try {
      // TODO: Replace with actual database operations when fees table is added
      return this.memoryStorage.createFee(bookingId, feeData);
    } catch (error) {
      console.error('Error creating fee:', error);
      throw new Error('Failed to create fee');
    }
  }

  async calculatePlatformFee(amount: number, serviceType: ServiceType): Promise<number> {
    try {
      // Platform fee rates
      const feeRates = {
        ride: 0.10, // 10%
        stay: 0.12, // 12%
        event: 0.08, // 8%
      };

      const rate = feeRates[serviceType] || 0.10;
      return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating platform fee:', error);
      return 0;
    }
  }

  async getFeesReport(dateRange?: { from: Date; to: Date }): Promise<any> {
    try {
      // TODO: Implement when fees table is added
      return {
        totalFees: 0,
        feesByType: {},
        period: dateRange,
      };
    } catch (error) {
      console.error('Error generating fees report:', error);
      return { totalFees: 0, feesByType: {}, period: dateRange };
    }
  }

  // ===== PAYMENTS =====
  
  async processPayment(bookingId: string, paymentMethod: PaymentMethod): Promise<Payment> {
    try {
      // Get booking details
      const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId));

      if (!booking) throw new Error('Booking not found');

      const paymentData: PaymentData = {
        method: paymentMethod,
        amount: Number(booking.totalPrice),
        currency: 'MZN', // Moeda padrão: Meticais
        description: `Payment for booking ${bookingId}`,
      };

      return this.memoryStorage.createPayment(bookingId, paymentData);
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Failed to process payment');
    }
  }

  async issueRefund(paymentId: string, amount: number, reason: string): Promise<any> {
    try {
      // TODO: Implement refund logic
      const refund = {
        id: `refund_${Date.now()}`,
        paymentId,
        amount,
        reason,
        status: 'processed',
        createdAt: new Date(),
      };

      console.log('Refund issued:', refund);
      return refund;
    } catch (error) {
      console.error('Error issuing refund:', error);
      throw new Error('Failed to issue refund');
    }
  }

  // ===== PROVIDER EARNINGS =====
  
  async calculateProviderEarnings(providerId: string, period: TimePeriod): Promise<Earnings> {
    try {
      // Get completed bookings for the provider in the period
      const providerBookings = await db
        .select({
          totalPrice: bookings.totalPrice,
          createdAt: bookings.createdAt,
        })
        .from(bookings)
        .where(and(
          eq(bookings.passengerId, providerId), // This would be different for drivers vs hosts
          eq(bookings.status, 'completed'),
          gte(bookings.createdAt, period.startDate),
          lte(bookings.createdAt, period.endDate)
        ));

      const totalEarnings = providerBookings.reduce((sum, booking) => 
        sum + Number(booking.totalPrice), 0
      );

      // Calculate platform fees (assuming 10% platform fee)
      const platformFees = totalEarnings * 0.10;
      const netEarnings = totalEarnings - platformFees;

      return {
        totalEarnings,
        platformFees,
        netEarnings,
        period,
      };
    } catch (error) {
      console.error('Error calculating provider earnings:', error);
      return {
        totalEarnings: 0,
        platformFees: 0,
        netEarnings: 0,
        period,
      };
    }
  }

  async generatePayoutReport(providerId: string): Promise<any> {
    try {
      const currentMonth = {
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      };

      const earnings = await this.calculateProviderEarnings(providerId, currentMonth);

      return {
        providerId,
        period: currentMonth,
        earnings,
        payoutStatus: 'pending',
        payoutDate: null,
      };
    } catch (error) {
      console.error('Error generating payout report:', error);
      throw new Error('Failed to generate payout report');
    }
  }

  // ===== FINANCIAL ANALYTICS =====
  
  async getPlatformRevenue(period: TimePeriod): Promise<RevenueReport> {
    try {
      // Get completed bookings in the period
      const [revenueData] = await db
        .select({
          totalRevenue: sql`SUM(CAST(${bookings.totalPrice} AS DECIMAL))`,
          transactionCount: sql`COUNT(*)`,
        })
        .from(bookings)
        .where(and(
          eq(bookings.status, 'completed'),
          gte(bookings.createdAt, period.startDate),
          lte(bookings.createdAt, period.endDate)
        ));

      const totalRevenue = Number(revenueData.totalRevenue) || 0;
      const transactionCount = Number(revenueData.transactionCount) || 0;
      
      // Calculate platform fees (assuming 10% average)
      const platformFees = totalRevenue * 0.10;
      const netRevenue = totalRevenue - platformFees;

      return {
        totalRevenue,
        platformFees,
        netRevenue,
        transactionCount,
        period,
      };
    } catch (error) {
      console.error('Error calculating platform revenue:', error);
      return {
        totalRevenue: 0,
        platformFees: 0,
        netRevenue: 0,
        transactionCount: 0,
        period,
      };
    }
  }

  async getTransactionHistory(filters: TransactionFilters): Promise<Transaction[]> {
    try {
      return this.memoryStorage.getTransactions(filters);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  // ===== UTILITY METHODS =====
  
  async getMonthlyRevenueTrend(months: number = 12): Promise<Array<{ month: string; revenue: number }>> {
    try {
      const trends: Array<{ month: string; revenue: number }> = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const revenue = await this.memoryStorage.getTotalRevenue({
          startDate: startOfMonth,
          endDate: endOfMonth,
        });
        
        trends.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          revenue,
        });
      }
      
      return trends;
    } catch (error) {
      console.error('Error calculating revenue trend:', error);
      return [];
    }
  }

  async getTopEarningProviders(limit: number = 10): Promise<Array<{ providerId: string; earnings: number }>> {
    try {
      // TODO: Implement when proper provider tracking is added
      return [];
    } catch (error) {
      console.error('Error fetching top earning providers:', error);
      return [];
    }
  }

  async calculateTaxReport(year: number): Promise<any> {
    try {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      
      const yearlyRevenue = await this.getPlatformRevenue({
        startDate: startOfYear,
        endDate: endOfYear,
      });
      
      return {
        year,
        totalRevenue: yearlyRevenue.totalRevenue,
        platformFees: yearlyRevenue.platformFees,
        taxableIncome: yearlyRevenue.netRevenue,
        // Add more tax-specific calculations as needed
      };
    } catch (error) {
      console.error('Error calculating tax report:', error);
      throw new Error('Failed to calculate tax report');
    }
  }
}

export const billingStorage = new DatabaseBillingStorage();