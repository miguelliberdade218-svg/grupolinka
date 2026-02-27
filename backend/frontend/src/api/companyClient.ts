/**
 * Client Company API Service
 * Handles all API calls for company client operations
 */

import { makeApiCall } from "@/shared/lib/apiHandler";

interface CompanyProfileResponse {
  profile: {
    id: string;
    email: string;
    contactName: string;
    phone?: string;
    companyName: string;
    companyVatNumber: string;
    companyAddress: string;
    companyPhone: string;
    verificationStatus: 'verified' | 'pending' | 'rejected' | 'suspended';
    verificationNotes?: string;
    verifiedAt?: string;
    isSuspended: boolean;
    suspensionReason?: string;
    suspensionEndDate?: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface CompanyProfileUpdatePayload {
  companyName?: string;
  companyPhone?: string;
  companyAddress?: string;
}

interface BookingsResponse {
  bookings: Array<{
    id: string;
    referenceNumber: string;
    serviceDate: string;
    totalAmount: number;
    paymentStatus: string;
    providerName: string;
  }>;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

interface PaymentMethodsResponse {
  paymentMethods: Array<{
    id: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
    isDefault: boolean;
  }>;
}

interface AddPaymentMethodPayload {
  accountType: 'bank' | 'mpesa' | 'emola';
  accountNumber: string;
  bankName?: string;
  accountHolder: string;
}

export const companyClientApi = {
  /**
   * Get company profile
   */
  async getCompanyProfile() {
    return makeApiCall<CompanyProfileResponse>(
      '/api/auth/company-profile',
      {
        method: 'GET',
      }
    );
  },

  /**
   * Update company profile
   */
  async updateCompanyProfile(data: CompanyProfileUpdatePayload) {
    return makeApiCall(
      '/api/auth/company-profile',
      {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  /**
   * Get company bookings
   */
  async getCompanyBookings(limit = 20, offset = 0, status?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (status) params.append('status', status);

    return makeApiCall<BookingsResponse>(
      `/api/auth/company-bookings?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Get payment methods
   */
  async getPaymentMethods() {
    return makeApiCall<PaymentMethodsResponse>(
      '/api/auth/company-payment-methods',
      {
        method: 'GET',
      }
    );
  },

  /**
   * Add payment method
   */
  async addPaymentMethod(data: AddPaymentMethodPayload) {
    return makeApiCall(
      '/api/auth/add-payment-method',
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  /**
   * Request suspension lifting
   */
  async requestSuspensionLifting(reason: string) {
    return makeApiCall(
      '/api/auth/request-suspension-lifting',
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  /**
   * Get invoices
   */
  async getInvoices(limit = 20, offset = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return makeApiCall(
      `/api/auth/company-invoices?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  },
};

export default companyClientApi;
