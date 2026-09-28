import React, { useState, useEffect } from 'react';
import adminService from '@/services/adminService';
import './ComplaintsList.css';

interface Complaint {
  id: string;
  from_user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  resolution_notes?: string;
  related_entity_type?: 'ride' | 'hotel' | 'event';
  related_entity_id?: string;
}

interface ComplaintsListProps {
  statusFilter?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'all';
  priorityFilter?: 'low' | 'medium' | 'high' | 'critical' | 'all';
  maxResults?: number;
  onComplaintSelect?: (complaint: Complaint) => void;
  onStatusChange?: (complaintId: string, newStatus: string) => void;
}

export const ComplaintsList: React.FC<ComplaintsListProps> = ({
  statusFilter = 'all',
  priorityFilter = 'all',
  maxResults = 20,
  onComplaintSelect,
  onStatusChange
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('priority');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, priorityFilter]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call admin service to get complaints - extract data from AxiosResponse
      const response = await adminService.listComplaints();
      const allComplaints: Complaint[] = Array.isArray(response.data) ? response.data : response.data?.complaints || [];

      // Filter by status
      let filtered = allComplaints.filter((c: Complaint) => statusFilter === 'all' || c.status === statusFilter);

      // Filter by priority
      filtered = filtered.filter((c: Complaint) => priorityFilter === 'all' || c.priority === priorityFilter);

      // Sort
      if (sortBy === 'newest') {
        filtered.sort((a: Complaint, b: Complaint) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortBy === 'oldest') {
        filtered.sort((a: Complaint, b: Complaint) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      } else if (sortBy === 'priority') {
        const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        filtered.sort((a: Complaint, b: Complaint) => {
          const orderA = priorityOrder[a.priority as keyof typeof priorityOrder] || 99;
          const orderB = priorityOrder[b.priority as keyof typeof priorityOrder] || 99;
          return orderA - orderB;
        });
      }

      setComplaints(filtered.slice(0, maxResults));
    } catch (err) {
      console.error('Error loading complaints:', err);
      setError('Erro ao carregar reclamações');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      setUpdatingId(complaintId);
      await adminService.updateComplaintStatus(complaintId, newStatus as any);
      
      // Update local state
      setComplaints(complaints.map(c => 
        c.id === complaintId ? { ...c, status: newStatus as any } : c
      ));
      
      onStatusChange?.(complaintId, newStatus);
    } catch (err) {
      console.error('Error updating complaint:', err);
      setError('Erro ao atualizar reclamação');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolve = async (complaintId: string, notes: string) => {
    try {
      setUpdatingId(complaintId);
      await adminService.updateComplaintStatus(complaintId, 'resolved');
      
      // Update with resolution notes
      setComplaints(complaints.map(c => 
        c.id === complaintId 
          ? { ...c, status: 'resolved', resolution_notes: notes }
          : c
      ));
      
      setSelectedComplaint(null);
      setResolutionNotes('');
    } catch (err) {
      console.error('Error resolving complaint:', err);
      setError('Erro ao resolver reclamação');
    } finally {
      setUpdatingId(null);
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return '#F44336';
      case 'high':
        return '#FF9800';
      case 'medium':
        return '#FFC107';
      case 'low':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return '🔴 Crítica';
      case 'high':
        return '🟠 Alta';
      case 'medium':
        return '🟡 Média';
      case 'low':
        return '🟢 Baixa';
      default:
        return 'Desconhecida';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'in_progress':
        return 'Em Progresso';
      case 'resolved':
        return 'Resolvida';
      case 'closed':
        return 'Fechada';
      default:
        return 'Desconhecida';
    }
  };

    const formatDate = (dateString: string) => formatDateTimeFriendly(dateString);

  if (loading) {
    return <div className="complaints-list loading">Carregando reclamações...</div>;
  }

  if (error) {
    return <div className="complaints-list error">{error}</div>;
  }

  if (complaints.length === 0) {
    return <div className="complaints-list empty">Nenhuma reclamação encontrada</div>;
  }

  return (
    <div className="complaints-list">
      <div className="complaints-controls">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'priority')}
          className="sort-select"
        >
          <option value="priority">Por Prioridade</option>
          <option value="newest">Mais Recentes</option>
          <option value="oldest">Mais Antigas</option>
        </select>

        <div className="filter-info">
          {complaints.length} reclamação(ões)
        </div>
      </div>

      <div className="complaints-grid">
        {complaints.map((complaint) => (
          <div
            key={complaint.id}
            className={`complaint-card status-${complaint.status}`}
            onClick={() => setSelectedComplaint(complaint.id)}
          >
            <div className="complaint-header">
              <div className="priority-badge" style={{ backgroundColor: getPriorityColor(complaint.priority) }}>
                {getPriorityLabel(complaint.priority)}
              </div>
              <div className="status-badge" data-status={complaint.status}>
                {getStatusLabel(complaint.status)}
              </div>
            </div>

            <h4 className="complaint-title">{complaint.subject}</h4>

            <p className="complaint-description">
              {complaint.description.substring(0, 200)}
              {complaint.description.length > 200 ? '...' : ''}
            </p>

            <div className="complaint-meta">
              <span className="complaint-entity">
                {complaint.related_entity_type ? `📍 ${complaint.related_entity_type.toUpperCase()}` : ''}
              </span>
              <span className="complaint-date">{formatDate(complaint.created_at)}</span>
            </div>

            {selectedComplaint === complaint.id && (
              <div className="complaint-detail">
                <div className="detail-section">
                  <h5>Descrição Completa</h5>
                  <p>{complaint.description}</p>
                </div>

                {complaint.resolution_notes && (
                  <div className="detail-section resolution">
                    <h5>Notas de Resolução</h5>
                    <p>{complaint.resolution_notes}</p>
                  </div>
                )}

                <div className="detail-actions">
                  {complaint.status === 'open' && (
                    <>
                      <button
                        className="action-btn action-progress"
                        onClick={() => handleStatusChange(complaint.id, 'in_progress')}
                        disabled={updatingId === complaint.id}
                      >
                        Iniciar Investigação
                      </button>
                    </>
                  )}

                  {(complaint.status === 'open' || complaint.status === 'in_progress') && (
                    <button
                      className="action-btn action-resolve"
                      onClick={() => handleStatusChange(complaint.id, 'resolved')}
                      disabled={updatingId === complaint.id}
                    >
                      Marcar Resolvida
                    </button>
                  )}

                  {complaint.status === 'resolved' && (
                    <button
                      className="action-btn action-close"
                      onClick={() => handleStatusChange(complaint.id, 'closed')}
                      disabled={updatingId === complaint.id}
                    >
                      Fechar Caso
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplaintsList;
