import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/authContext';
import { useApiClient } from '@/hooks/useApiClient';
import { useNotification } from '@/hooks/useNotification';

// Interfaces
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: 'driver' | 'passenger' | 'hotel' | 'organizer' | 'admin';
  verified: boolean;
  status: 'active' | 'suspended' | 'banned' | 'pending_verification';
  documents?: string[];
  createdAt: string;
  updatedAt: string;
  totalReviews?: number;
  rating?: number;
}

export interface Dispute {
  id: string;
  claimantId: string;
  claimantName: string;
  defendantId: string;
  defendantName: string;
  type: 'payment' | 'behavior' | 'damage' | 'other';
  description: string;
  amount?: number;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  type: 'withdrawal' | 'refund' | 'commission' | 'bonus';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankDetails?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  email: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'waiting_user' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  responses: Array<{
    id: string;
    from: string;
    message: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  bannedUsers: number;
  totalDisputes: number;
  openDisputes: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingWithdrawals: number;
  openTickets: number;
}

// Custom Hook
export function useAdminData() {
  const { user } = useAuth();
  const apiClient = useApiClient();
  const { notify } = useNotification();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      const data = await apiClient.get<AdminDashboardStats>('/api/admin/stats');
      setStats(data);
    } catch (error) {
      notify(`Erro ao carregar estatísticas`, 'error');
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch users
  const fetchUsers = async (filters?: { status?: string; userType?: string; limit?: number; offset?: number }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.userType) params.append('userType', filters.userType);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiClient.get<AdminUser[]>(`/api/admin/users${query}`);
      setUsers(data);
    } catch (error) {
      notify(`Erro ao carregar usuários`, 'error');
      console.error('Error fetching users:', error);
    }
  };

  // Fetch disputes
  const fetchDisputes = async (filters?: { status?: string; priority?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiClient.get<Dispute[]>(`/api/admin/disputes${query}`);
      setDisputes(data);
    } catch (error) {
      notify(`Erro ao carregar disputas`, 'error');
      console.error('Error fetching disputes:', error);
    }
  };

  // Fetch payments
  const fetchPayments = async (filters?: { status?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiClient.get<PaymentTransaction[]>(`/api/admin/payments${query}`);
      setPayments(data);
    } catch (error) {
      notify(`Erro ao carregar pagamentos`, 'error');
      console.error('Error fetching payments:', error);
    }
  };

  // Fetch support tickets
  const fetchTickets = async (filters?: { status?: string; priority?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await apiClient.get<SupportTicket[]>(`/api/admin/tickets${query}`);
      setTickets(data);
    } catch (error) {
      notify(`Erro ao carregar tickets de suporte`, 'error');
      console.error('Error fetching tickets:', error);
    }
  };

  // User management
  const suspendUser = async (userId: string, reason: string) => {
    try {
      await apiClient.patch(`/api/admin/users/${userId}/suspend`, { reason });
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, status: 'suspended' } : u
        )
      );
      notify(`Usuário suspenso com sucesso`, 'success');
    } catch (error) {
      notify(`Erro ao suspender usuário`, 'error');
      console.error('Error suspending user:', error);
    }
  };

  const banUser = async (userId: string, reason: string) => {
    try {
      await apiClient.patch(`/api/admin/users/${userId}/ban`, { reason });
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, status: 'banned' } : u
        )
      );
      notify(`Usuário banido com sucesso`, 'success');
    } catch (error) {
      notify(`Erro ao banir usuário`, 'error');
      console.error('Error banning user:', error);
    }
  };

  const reactivateUser = async (userId: string) => {
    try {
      await apiClient.patch(`/api/admin/users/${userId}/reactivate`);
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, status: 'active' } : u
        )
      );
      notify(`Usuário reativado com sucesso`, 'success');
    } catch (error) {
      notify(`Erro ao reativar usuário`, 'error');
      console.error('Error reactivating user:', error);
    }
  };

  // Dispute management
  const resolveDispute = async (disputeId: string, resolution: string, decision: 'claimant_wins' | 'defendant_wins' | 'dismissed') => {
    try {
      const data = await apiClient.patch<Dispute>(
        `/api/admin/disputes/${disputeId}/resolve`,
        { resolution, decision }
      );
      setDisputes(disputes.map((d) => (d.id === disputeId ? data : d)));
      notify(`Disputa resolvida com sucesso`, 'success');
    } catch (error) {
      notify(`Erro ao resolver disputa`, 'error');
      console.error('Error resolving dispute:', error);
    }
  };

  // Payment processing
  const approvePayment = async (paymentId: string) => {
    try {
      const data = await apiClient.patch<PaymentTransaction>(
        `/api/admin/payments/${paymentId}/approve`
      );
      setPayments(payments.map((p) => (p.id === paymentId ? data : p)));
      notify(`Pagamento aprovado com sucesso`, 'success');
    } catch (error) {
      notify(`Erro ao aprovar pagamento`, 'error');
      console.error('Error approving payment:', error);
    }
  };

  const rejectPayment = async (paymentId: string, reason: string) => {
    try {
      const data = await apiClient.patch<PaymentTransaction>(
        `/api/admin/payments/${paymentId}/reject`,
        { reason }
      );
      setPayments(payments.map((p) => (p.id === paymentId ? data : p)));
      notify(`Pagamento rejeitado com sucesso`, 'success');
    } catch (error) {
      notify(`Erro ao rejeitar pagamento`, 'error');
      console.error('Error rejecting payment:', error);
    }
  };

  // Support ticket management
  const respondToTicket = async (ticketId: string, response: string) => {
    try {
      const data = await apiClient.patch<SupportTicket>(
        `/api/admin/tickets/${ticketId}/respond`,
        { response }
      );
      setTickets(tickets.map((t) => (t.id === ticketId ? data : t)));
      notify(`Resposta enviada com sucesso`, 'success');
    } catch (error) {
      notify(`Erro ao enviar resposta`, 'error');
      console.error('Error responding to ticket:', error);
    }
  };

  const closeTicket = async (ticketId: string) => {
    try {
      const data = await apiClient.patch<SupportTicket>(
        `/api/admin/tickets/${ticketId}/close`
      );
      setTickets(tickets.map((t) => (t.id === ticketId ? data : t)));
      notify(`Ticket fechado com sucesso`, 'success');
    } catch (error) {
      notify(`Erro ao fechar ticket`, 'error');
      console.error('Error closing ticket:', error);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (user?.userType === 'admin') {
      setLoading(true);
      Promise.all([
        fetchStats(),
        fetchUsers({ limit: 20 }),
        fetchDisputes({ status: 'open' }),
        fetchPayments({ status: 'pending' }),
        fetchTickets({ status: 'open' }),
      ]).then(() => setLoading(false));
    }
  }, [user?.id]);

  return {
    stats,
    users,
    disputes,
    payments,
    tickets,
    loading,
    // Fetch methods
    fetchStats,
    fetchUsers,
    fetchDisputes,
    fetchPayments,
    fetchTickets,
    // User management
    suspendUser,
    banUser,
    reactivateUser,
    // Dispute management
    resolveDispute,
    // Payment management
    approvePayment,
    rejectPayment,
    // Ticket management
    respondToTicket,
    closeTicket,
  };
}
