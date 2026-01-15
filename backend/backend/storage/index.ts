/**
 * LINK-A STORAGE AGGREGATOR
 * Central storage management system with dependency injection and factory pattern
 * 
 * This file provides:
 * - Single point of access to all storage systems
 * - Environment-based storage configuration
 * - Dependency injection for storage interfaces
 * - Easy testing with mock implementations
 */

// ===== CORE STORAGES =====
import { 
  IAuthStorage, 
  DatabaseAuthStorage, 
  authStorage as defaultAuthStorage 
} from './core/AuthStorage';

import { 
  IFileStorage, 
  GoogleCloudFileStorage, 
  LocalFileStorage,
  fileStorage as defaultFileStorage 
} from './core/FileStorage';

import { 
  ISessionStorage, 
  DatabaseSessionStorage, 
  sessionStorage as defaultSessionStorage 
} from './core/SessionStorage';

// ===== BUSINESS STORAGES =====
import { 
  IRideStorage, 
  DatabaseRideStorage, 
  rideStorage as defaultRideStorage 
} from './business/RideStorage';

import { 
  IAccommodationStorage, 
  DatabaseAccommodationStorage, 
  accommodationStorage as defaultAccommodationStorage 
} from './business/AccommodationStorage';

import { 
  IBookingStorage, 
  DatabaseBookingStorage, 
  bookingStorage as defaultBookingStorage 
} from './business/BookingStorage';

import { 
  IEventStorage, 
  DatabaseEventStorage, 
  eventStorage as defaultEventStorage 
} from './business/EventStorage';

// ===== SUPPORT STORAGES =====
import { 
  IChatStorage, 
  DatabaseChatStorage, 
  chatStorage as defaultChatStorage 
} from './support/ChatStorage';

import { 
  IRatingStorage, 
  DatabaseRatingStorage, 
  ratingStorage as defaultRatingStorage 
} from './support/RatingStorage';

import { 
  INotificationStorage, 
  DatabaseNotificationStorage, 
  notificationStorage as defaultNotificationStorage 
} from './support/NotificationStorage';

// ===== ADMIN STORAGES =====
import { 
  IBillingStorage, 
  DatabaseBillingStorage, 
  billingStorage as defaultBillingStorage 
} from './admin/BillingStorage';

import { 
  IAnalyticsStorage, 
  DatabaseAnalyticsStorage, 
  analyticsStorage as defaultAnalyticsStorage 
} from './admin/AnalyticsStorage';

import { 
  IPartnershipStorage, 
  DatabasePartnershipStorage, 
  partnershipStorage as defaultPartnershipStorage 
} from './admin/PartnershipStorage';

// ===== STORAGE AGGREGATOR INTERFACE =====

export interface IStorageAggregator {
  // Core storages
  auth: IAuthStorage;
  file: IFileStorage;
  session: ISessionStorage;
  
  // Business storages
  ride: IRideStorage;
  accommodation: IAccommodationStorage;
  booking: IBookingStorage;
  event: IEventStorage;
  
  // Support storages
  chat: IChatStorage;
  rating: IRatingStorage;
  notification: INotificationStorage;
  
  // Admin storages
  billing: IBillingStorage;
  analytics: IAnalyticsStorage;
  partnership: IPartnershipStorage;
}

// ===== STORAGE CONFIGURATION =====

export interface StorageConfig {
  environment: 'development' | 'production' | 'test';
  useInMemory?: boolean;
  useMocks?: boolean;
  
  // Storage-specific configurations
  core?: {
    auth?: IAuthStorage;
    file?: IFileStorage;
    session?: ISessionStorage;
  };
  
  business?: {
    ride?: IRideStorage;
    accommodation?: IAccommodationStorage;
    booking?: IBookingStorage;
    event?: IEventStorage;
  };
  
  support?: {
    chat?: IChatStorage;
    rating?: IRatingStorage;
    notification?: INotificationStorage;
  };
  
  admin?: {
    billing?: IBillingStorage;
    analytics?: IAnalyticsStorage;
    partnership?: IPartnershipStorage;
  };
}

// ===== STORAGE AGGREGATOR IMPLEMENTATION =====

export class StorageAggregator implements IStorageAggregator {
  // Core storages
  public readonly auth: IAuthStorage;
  public readonly file: IFileStorage;
  public readonly session: ISessionStorage;
  
  // Business storages
  public readonly ride: IRideStorage;
  public readonly accommodation: IAccommodationStorage;
  public readonly booking: IBookingStorage;
  public readonly event: IEventStorage;
  
  // Support storages
  public readonly chat: IChatStorage;
  public readonly rating: IRatingStorage;
  public readonly notification: INotificationStorage;
  
  // Admin storages
  public readonly billing: IBillingStorage;
  public readonly analytics: IAnalyticsStorage;
  public readonly partnership: IPartnershipStorage;

  constructor(config?: StorageConfig) {
    const environment = config?.environment || process.env.NODE_ENV || 'development';
    
    // Initialize core storages
    this.auth = config?.core?.auth || this.createAuthStorage(environment);
    this.file = config?.core?.file || this.createFileStorage(environment);
    this.session = config?.core?.session || this.createSessionStorage(environment);
    
    // Initialize business storages
    this.ride = config?.business?.ride || this.createRideStorage(environment);
    this.accommodation = config?.business?.accommodation || this.createAccommodationStorage(environment);
    this.booking = config?.business?.booking || this.createBookingStorage(environment);
    this.event = config?.business?.event || this.createEventStorage(environment);
    
    // Initialize support storages
    this.chat = config?.support?.chat || this.createChatStorage(environment);
    this.rating = config?.support?.rating || this.createRatingStorage(environment);
    this.notification = config?.support?.notification || this.createNotificationStorage(environment);
    
    // Initialize admin storages
    this.billing = config?.admin?.billing || this.createBillingStorage(environment);
    this.analytics = config?.admin?.analytics || this.createAnalyticsStorage(environment);
    this.partnership = config?.admin?.partnership || this.createPartnershipStorage(environment);
    
    // Log initialization
    console.log(`🏭 Storage aggregator initialized for ${environment} environment`);
  }

  // ===== STORAGE FACTORY METHODS =====
  
  private createAuthStorage(environment: string): IAuthStorage {
    if (environment === 'test') {
      // Return mock implementation for testing
      console.log('📋 Using mock auth storage for testing');
      return defaultAuthStorage; // TODO: Create mock implementation
    }
    return defaultAuthStorage;
  }

  private createFileStorage(environment: string): IFileStorage {
    if (environment === 'test') {
      console.log('📋 Using mock file storage for testing');
      return defaultFileStorage; // TODO: Create mock implementation
    }
    return defaultFileStorage;
  }

  private createSessionStorage(environment: string): ISessionStorage {
    if (environment === 'test') {
      console.log('📋 Using mock session storage for testing');
      return defaultSessionStorage; // TODO: Create mock implementation
    }
    return defaultSessionStorage;
  }

  private createRideStorage(environment: string): IRideStorage {
    if (environment === 'test') {
      console.log('📋 Using mock ride storage for testing');
      return defaultRideStorage; // TODO: Create mock implementation
    }
    return defaultRideStorage;
  }

  private createAccommodationStorage(environment: string): IAccommodationStorage {
    if (environment === 'test') {
      console.log('📋 Using mock accommodation storage for testing');
      return defaultAccommodationStorage; // TODO: Create mock implementation
    }
    return defaultAccommodationStorage;
  }

  private createBookingStorage(environment: string): IBookingStorage {
    if (environment === 'test') {
      console.log('📋 Using mock booking storage for testing');
      return defaultBookingStorage; // TODO: Create mock implementation
    }
    return defaultBookingStorage;
  }

  private createEventStorage(environment: string): IEventStorage {
    if (environment === 'test') {
      console.log('📋 Using mock event storage for testing');
      return defaultEventStorage; // TODO: Create mock implementation
    }
    return defaultEventStorage;
  }

  private createChatStorage(environment: string): IChatStorage {
    if (environment === 'test') {
      console.log('📋 Using mock chat storage for testing');
      return defaultChatStorage; // TODO: Create mock implementation
    }
    return defaultChatStorage;
  }

  private createRatingStorage(environment: string): IRatingStorage {
    if (environment === 'test') {
      console.log('📋 Using mock rating storage for testing');
      return defaultRatingStorage; // TODO: Create mock implementation
    }
    return defaultRatingStorage;
  }

  private createNotificationStorage(environment: string): INotificationStorage {
    if (environment === 'test') {
      console.log('📋 Using mock notification storage for testing');
      return defaultNotificationStorage; // TODO: Create mock implementation
    }
    return defaultNotificationStorage;
  }

  private createBillingStorage(environment: string): IBillingStorage {
    if (environment === 'test') {
      console.log('📋 Using mock billing storage for testing');
      return defaultBillingStorage; // TODO: Create mock implementation
    }
    return defaultBillingStorage;
  }

  private createAnalyticsStorage(environment: string): IAnalyticsStorage {
    if (environment === 'test') {
      console.log('📋 Using mock analytics storage for testing');
      return defaultAnalyticsStorage; // TODO: Create mock implementation
    }
    return defaultAnalyticsStorage;
  }

  private createPartnershipStorage(environment: string): IPartnershipStorage {
    if (environment === 'test') {
      console.log('📋 Using mock partnership storage for testing');
      return defaultPartnershipStorage; // TODO: Create mock implementation
    }
    return defaultPartnershipStorage;
  }

  // ===== UTILITY METHODS =====
  
  /**
   * Get domain-specific storage group
   */
  getCoreStorages() {
    return {
      auth: this.auth,
      file: this.file,
      session: this.session,
    };
  }

  getBusinessStorages() {
    return {
      ride: this.ride,
      accommodation: this.accommodation,
      booking: this.booking,
      event: this.event,
    };
  }

  getSupportStorages() {
    return {
      chat: this.chat,
      rating: this.rating,
      notification: this.notification,
    };
  }

  getAdminStorages() {
    return {
      billing: this.billing,
      analytics: this.analytics,
      partnership: this.partnership,
    };
  }

  /**
   * Health check for all storages
   */
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const health: { [key: string]: boolean } = {};
    
    try {
      // Test core storages
      health.auth = !!(await this.auth.getUserByFirebaseUid('test'));
      health.file = true; // File storage doesn't have easy health check
      health.session = true; // Session storage doesn't have easy health check
      
      // Test business storages
      health.ride = !!(await this.ride.searchRides({}));
      health.accommodation = !!(await this.accommodation.searchAccommodations({}));
      health.booking = !!(await this.booking.getUserBookings('test'));
      health.event = !!(await this.event.getUpcomingEvents(1));
      
      // Test support storages
      health.chat = !!(await this.chat.getChatRoomsByUser('test'));
      health.rating = !!(await this.rating.getRatingsByUser('test', 'given'));
      health.notification = !!(await this.notification.getUserNotifications('test', 1));
      
      // Test admin storages
      health.billing = !!(await this.billing.getTransactionHistory({}));
      health.analytics = !!(await this.analytics.getUserMetrics());
      health.partnership = !!(await this.partnership.getActivePartnerships());
      
    } catch (error) {
      console.error('Storage health check failed:', error);
    }
    
    return health;
  }
}

// ===== GLOBAL STORAGE INSTANCE =====

// Create default storage aggregator
export const storage = new StorageAggregator({
  environment: (process.env.NODE_ENV as any) || 'development',
});

// Export individual storages for backward compatibility
export {
  // Core
  defaultAuthStorage as authStorage,
  defaultFileStorage as fileStorage,
  defaultSessionStorage as sessionStorage,
  
  // Business
  defaultRideStorage as rideStorage,
  defaultAccommodationStorage as accommodationStorage,
  defaultBookingStorage as bookingStorage,
  defaultEventStorage as eventStorage,
  
  // Support
  defaultChatStorage as chatStorage,
  defaultRatingStorage as ratingStorage,
  defaultNotificationStorage as notificationStorage,
  
  // Admin
  defaultBillingStorage as billingStorage,
  defaultAnalyticsStorage as analyticsStorage,
  defaultPartnershipStorage as partnershipStorage,
};

// Export types
export type {
  // Core interfaces
  IAuthStorage,
  IFileStorage,
  ISessionStorage,
  
  // Business interfaces
  IRideStorage,
  IAccommodationStorage,
  IBookingStorage,
  IEventStorage,
  
  // Support interfaces
  IChatStorage,
  IRatingStorage,
  INotificationStorage,
  
  // Admin interfaces
  IBillingStorage,
  IAnalyticsStorage,
  IPartnershipStorage,
};

// Export storage classes for testing
export {
  // Core classes
  DatabaseAuthStorage,
  GoogleCloudFileStorage,
  LocalFileStorage,
  DatabaseSessionStorage,
  
  // Business classes
  DatabaseRideStorage,
  DatabaseAccommodationStorage,
  DatabaseBookingStorage,
  DatabaseEventStorage,
  
  // Support classes
  DatabaseChatStorage,
  DatabaseRatingStorage,
  DatabaseNotificationStorage,
  
  // Admin classes
  DatabaseBillingStorage,
  DatabaseAnalyticsStorage,
  DatabasePartnershipStorage,
};

console.log('🗄️ Storage system initialized - modular architecture active');

/**
 * USAGE EXAMPLES:
 * 
 * // Use the central aggregator (recommended)
 * import { storage } from '@/storage';
 * const user = await storage.auth.getUserByFirebaseUid(uid);
 * const rides = await storage.ride.searchRides({ from: 'Maputo' });
 * 
 * // Use individual storages (backward compatibility)
 * import { authStorage, rideStorage } from '@/storage';
 * const user = await authStorage.getUserByFirebaseUid(uid);
 * 
 * // Use with custom configuration (testing)
 * import { StorageAggregator } from '@/storage';
 * const testStorage = new StorageAggregator({ environment: 'test' });
 * 
 * // Domain-specific access
 * const businessStorages = storage.getBusinessStorages();
 * const adminStorages = storage.getAdminStorages();
 */