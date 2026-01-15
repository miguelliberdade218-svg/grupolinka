import { sql } from "drizzle-orm";
import { db } from '../../db';
import { users, rides, bookings, ratings } from '../../shared/schema';
import { 
  AnalyticsData,
  TimePeriod,
  DateRange 
} from '../types';

export interface IAnalyticsStorage {
  // User analytics
  getUserMetrics(dateRange?: DateRange): Promise<{
    totalUsers: number;
    activeUsers: number;
    newRegistrations: number;
    verifiedUsers: number;
    usersByRole: { [role: string]: number };
  }>;
  
  // Business analytics
  getBusinessMetrics(dateRange?: DateRange): Promise<{
    totalRides: number;
    totalAccommodations: number;
    totalBookings: number;
    totalRevenue: number;
    conversionRate: number;
  }>;
  
  // Performance analytics
  getPerformanceMetrics(): Promise<{
    averageResponseTime: number;
    systemUptime: number;
    errorRate: number;
  }>;
  
  // Geographic analytics
  getGeographicData(): Promise<{
    topCities: Array<{ city: string; count: number }>;
    ridesByLocation: Array<{ location: string; rides: number }>;
  }>;
  
  // Revenue analytics
  getRevenueAnalytics(period: TimePeriod): Promise<{
    totalRevenue: number;
    revenueByService: { [service: string]: number };
    monthlyTrend: Array<{ month: string; revenue: number }>;
  }>;
  
  // Growth analytics
  getGrowthMetrics(period: TimePeriod): Promise<{
    userGrowthRate: number;
    bookingGrowthRate: number;
    revenueGrowthRate: number;
  }>;
}
export class DatabaseAnalyticsStorage implements IAnalyticsStorage {
  
  // ===== USER ANALYTICS =====
  
  async getUserMetrics(dateRange?: DateRange): Promise<{
    totalUsers: number;
    activeUsers: number;
    newRegistrations: number;
    verifiedUsers: number;
    usersByRole: { [role: string]: number };
  }> {
    try {
      // Total users
      const totalUsersResult = await db
        .select({ count: count() })
        .from(users);
      const totalUsers = totalUsersResult[0]?.count || 0;

      // Verified users
      const verifiedUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isVerified, true));
      const verifiedUsers = verifiedUsersResult[0]?.count || 0;

      // New registrations in date range
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const startDate = dateRange?.from || thirtyDaysAgo;
      const endDate = dateRange?.to || new Date();

      const newRegistrationsResult = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          gte(users.createdAt, startDate),
          lte(users.createdAt, endDate)
        ));
      const newRegistrations = newRegistrationsResult[0]?.count || 0;

      // Active users (users with bookings in the last 30 days)
      const activeUsersResult = await db
        .select({ count: count(bookings.passengerId) })
        .from(bookings)
        .where(gte(bookings.createdAt, thirtyDaysAgo));
      const activeUsers = activeUsersResult[0]?.count || 0;

      // Users by role
      const roleData = await db
        .select({
          userType: users.userType,
          count: count(),
        })
        .from(users)
        .groupBy(users.userType);

      const usersByRole: { [role: string]: number } = {};
      roleData.forEach(item => {
        if (item.userType) {
          usersByRole[item.userType] = Number(item.count);
        }
      });

      return {
        totalUsers: Number(totalUsers),
        activeUsers: Number(activeUsers),
        newRegistrations: Number(newRegistrations),
        verifiedUsers: Number(verifiedUsers),
        usersByRole,
      };
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newRegistrations: 0,
        verifiedUsers: 0,
        usersByRole: {},
      };
    }
  }

  // ===== BUSINESS ANALYTICS =====
  
  async getBusinessMetrics(dateRange?: DateRange): Promise<{
    totalRides: number;
    totalAccommodations: number;
    totalBookings: number;
    totalRevenue: number;
    conversionRate: number;
  }> {
    try {
      // Total rides
      const totalRidesResult = await db
        .select({ count: count() })
        .from(rides);
      const totalRides = totalRidesResult[0]?.count || 0;

      // Total accommodations
      const totalAccommodationsResult = await db
        .select({ count: count() })
        .from(accommodations);
      const totalAccommodations = totalAccommodationsResult[0]?.count || 0;

      // Total bookings and revenue
      const startDate = dateRange?.from || new Date(0);
      const endDate = dateRange?.to || new Date();

      const bookingDataResult = await db
        .select({ 
          count: count(),
          revenue: sum(bookings.totalPrice).as('revenue'),
        })
        .from(bookings)
        .where(and(
          gte(bookings.createdAt, startDate),
          lte(bookings.createdAt, endDate)
        ));
      const bookingData = bookingDataResult[0] || { count: 0, revenue: 0 };

      // Calculate conversion rate (bookings vs rides created)
      const rideViewsResult = await db
        .select({ count: count() })
        .from(rides)
        .where(and(
          gte(rides.createdAt, startDate),
          lte(rides.createdAt, endDate)
        ));
      const rideViews = rideViewsResult[0]?.count || 0;

      const conversionRate = rideViews > 0 
        ? (Number(bookingData.count) / Number(rideViews)) * 100 
        : 0;

      return {
        totalRides: Number(totalRides),
        totalAccommodations: Number(totalAccommodations),
        totalBookings: Number(bookingData.count),
        totalRevenue: Number(bookingData.revenue) || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error fetching business metrics:', error);
      return {
        totalRides: 0,
        totalAccommodations: 0,
        totalBookings: 0,
        totalRevenue: 0,
        conversionRate: 0,
      };
    }
  }

  // ===== PERFORMANCE ANALYTICS =====
  
  async getPerformanceMetrics(): Promise<{
    averageResponseTime: number;
    systemUptime: number;
    errorRate: number;
  }> {
    try {
      // These would typically come from monitoring systems
      return {
        averageResponseTime: 150, // ms
        systemUptime: 99.9, // percentage
        errorRate: 0.1, // percentage
      };
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return {
        averageResponseTime: 0,
        systemUptime: 0,
        errorRate: 0,
      };
    }
  }

  // ===== GEOGRAPHIC ANALYTICS =====
  
  async getGeographicData(): Promise<{
    topCities: Array<{ city: string; count: number }>;
    ridesByLocation: Array<{ location: string; rides: number }>;
  }> {
    try {
      // Top cities by ride origin
      const topCities = await db
        .select({
          city: rides.fromLocation,
          count: count(),
        })
        .from(rides)
        .groupBy(rides.fromLocation)
        .orderBy(desc(count()))
        .limit(10);

      // Rides by location
      const ridesByLocation = await db
        .select({
          location: rides.fromLocation,
          rides: count(),
        })
        .from(rides)
        .groupBy(rides.fromLocation)
        .orderBy(desc(count()));

      return {
        topCities: topCities.map(item => ({
          city: item.city || 'Unknown',
          count: Number(item.count),
        })),
        ridesByLocation: ridesByLocation.map(item => ({
          location: item.location || 'Unknown',
          rides: Number(item.rides),
        })),
      };
    } catch (error) {
      console.error('Error fetching geographic data:', error);
      return {
        topCities: [],
        ridesByLocation: [],
      };
    }
  }

  // ===== REVENUE ANALYTICS =====
  
  async getRevenueAnalytics(period: TimePeriod): Promise<{
    totalRevenue: number;
    revenueByService: { [service: string]: number };
    monthlyTrend: Array<{ month: string; revenue: number }>;
  }> {
    try {
      // Total revenue in period
      const totalRevenueResult = await db
        .select({ revenue: sum(bookings.totalPrice).as('revenue') })
        .from(bookings)
        .where(and(
          eq(bookings.status, 'completed'),
          gte(bookings.createdAt, period.startDate),
          lte(bookings.createdAt, period.endDate)
        ));
      const totalRevenue = totalRevenueResult[0]?.revenue || 0;

      // Revenue by service
      const revenueByService = {
        rides: Number(totalRevenue) || 0,
        accommodations: 0,
        events: 0,
      };

      // Monthly trend
      const monthlyTrend: Array<{ month: string; revenue: number }> = [];
      const months = this.getMonthsBetween(period.startDate, period.endDate);

      for (const month of months) {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const monthRevenueResult = await db
          .select({ revenue: sum(bookings.totalPrice).as('revenue') })
          .from(bookings)
          .where(and(
            eq(bookings.status, 'completed'),
            gte(bookings.createdAt, startOfMonth),
            lte(bookings.createdAt, endOfMonth)
          ));

        const monthRevenue = monthRevenueResult[0]?.revenue || 0;

        monthlyTrend.push({
          month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
          revenue: Number(monthRevenue),
        });
      }

      return {
        totalRevenue: Number(totalRevenue),
        revenueByService,
        monthlyTrend,
      };
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      return {
        totalRevenue: 0,
        revenueByService: { rides: 0, accommodations: 0, events: 0 },
        monthlyTrend: [],
      };
    }
  }

  // ===== GROWTH ANALYTICS =====
  
  async getGrowthMetrics(period: TimePeriod): Promise<{
    userGrowthRate: number;
    bookingGrowthRate: number;
    revenueGrowthRate: number;
  }> {
    try {
      const periodDays = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const previousPeriodStart = new Date(period.startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousPeriodEnd = new Date(period.startDate.getTime() - 1);

      // User growth
      const currentUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          gte(users.createdAt, period.startDate),
          lte(users.createdAt, period.endDate)
        ));
      const currentUsers = currentUsersResult[0]?.count || 0;

      const previousUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          gte(users.createdAt, previousPeriodStart),
          lte(users.createdAt, previousPeriodEnd)
        ));
      const previousUsers = previousUsersResult[0]?.count || 0;

      const userGrowthRate = previousUsers > 0
        ? ((Number(currentUsers) - Number(previousUsers)) / Number(previousUsers)) * 100
        : 0;

      // Booking growth
      const currentBookingsResult = await db
        .select({ count: count() })
        .from(bookings)
        .where(and(
          gte(bookings.createdAt, period.startDate),
          lte(bookings.createdAt, period.endDate)
        ));
      const currentBookings = currentBookingsResult[0]?.count || 0;

      const previousBookingsResult = await db
        .select({ count: count() })
        .from(bookings)
        .where(and(
          gte(bookings.createdAt, previousPeriodStart),
          lte(bookings.createdAt, previousPeriodEnd)
        ));
      const previousBookings = previousBookingsResult[0]?.count || 0;

      const bookingGrowthRate = previousBookings > 0
        ? ((Number(currentBookings) - Number(previousBookings)) / Number(previousBookings)) * 100
        : 0;

      // Revenue growth
      const currentRevenueResult = await db
        .select({ revenue: sum(bookings.totalPrice).as('revenue') })
        .from(bookings)
        .where(and(
          eq(bookings.status, 'completed'),
          gte(bookings.createdAt, period.startDate),
          lte(bookings.createdAt, period.endDate)
        ));
      const currentRevenue = currentRevenueResult[0]?.revenue || 0;

      const previousRevenueResult = await db
        .select({ revenue: sum(bookings.totalPrice).as('revenue') })
        .from(bookings)
        .where(and(
          eq(bookings.status, 'completed'),
          gte(bookings.createdAt, previousPeriodStart),
          lte(bookings.createdAt, previousPeriodEnd)
        ));
      const previousRevenue = previousRevenueResult[0]?.revenue || 0;

      const revenueGrowthRate = Number(previousRevenue) > 0
        ? ((Number(currentRevenue) - Number(previousRevenue)) / Number(previousRevenue)) * 100
        : 0;

      return {
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,
        bookingGrowthRate: Math.round(bookingGrowthRate * 100) / 100,
        revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
      };
    } catch (error) {
      console.error('Error calculating growth metrics:', error);
      return {
        userGrowthRate: 0,
        bookingGrowthRate: 0,
        revenueGrowthRate: 0,
      };
    }
  }

  // ===== COMPREHENSIVE ANALYTICS =====
  
  async getComprehensiveAnalytics(dateRange?: DateRange): Promise<AnalyticsData> {
    try {
      const userMetrics = await this.getUserMetrics(dateRange);
      const businessMetrics = await this.getBusinessMetrics(dateRange);
      const performanceMetrics = await this.getPerformanceMetrics();

      return {
        userMetrics: {
          totalUsers: userMetrics.totalUsers,
          activeUsers: userMetrics.activeUsers,
          newRegistrations: userMetrics.newRegistrations,
          verifiedUsers: userMetrics.verifiedUsers,
        },
        businessMetrics: {
          totalRides: businessMetrics.totalRides,
          totalAccommodations: businessMetrics.totalAccommodations,
          totalBookings: businessMetrics.totalBookings,
          totalRevenue: businessMetrics.totalRevenue,
        },
        performanceMetrics,
      };
    } catch (error) {
      console.error('Error fetching comprehensive analytics:', error);
      return {
        userMetrics: {
          totalUsers: 0,
          activeUsers: 0,
          newRegistrations: 0,
          verifiedUsers: 0,
        },
        businessMetrics: {
          totalRides: 0,
          totalAccommodations: 0,
          totalBookings: 0,
          totalRevenue: 0,
        },
        performanceMetrics: {
          averageResponseTime: 0,
          systemUptime: 0,
          errorRate: 0,
        },
      };
    }
  }
  // ===== UTILITY METHODS =====
  
  private getMonthsBetween(startDate: Date, endDate: Date): Date[] {
    const months: Date[] = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (current <= end) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  async getPopularRoutes(limit: number = 10): Promise<Array<{ route: string; count: number }>> {
    try {
      const routes = await db
        .select({
          route: sql`${rides.fromLocation} || ' → ' || ${rides.toLocation}`.as('route'),
          count: count(),
        })
        .from(rides)
        .groupBy(rides.fromLocation, rides.toLocation)
        .orderBy(desc(count()))
        .limit(limit);

      return routes.map(item => ({
        route: item.route as string,
        count: Number(item.count),
      }));
    } catch (error) {
      console.error('Error fetching popular routes:', error);
      return [];
    }
  }

  async getUserRetentionRate(days: number = 30): Promise<number> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Users who registered in the period
      const newUsersResult = await db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, startDate));
      const newUsers = newUsersResult[0]?.count || 0;

      // Users who made a booking after registration
      const activeUsersResult = await db
        .select({ count: count() })
        .from(users)
        .innerJoin(bookings, eq(users.id, bookings.passengerId))
        .where(and(
          gte(users.createdAt, startDate),
          gte(bookings.createdAt, users.createdAt)
        ));
      const activeUsers = activeUsersResult[0]?.count || 0;

      return newUsers > 0
        ? (Number(activeUsers) / Number(newUsers)) * 100
        : 0;
    } catch (error) {
      console.error('Error calculating user retention rate:', error);
      return 0;
    }
  }
}

export const analyticsStorage = new DatabaseAnalyticsStorage();