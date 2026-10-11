import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from 'react-toastify';
import { Loader, Search } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { formatDateOnly } from '@/utils/dateFormatter';

type StatusFilter = 'all' | 'active' | 'cancelled' | 'completed';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'active', label: 'Ativas' },
  { key: 'cancelled', label: 'Canceladas' },
  { key: 'completed', label: 'Completas' },
];

function StatusBadge({ status }: { status?: string }) {
  const norm = (status || '').toLowerCase();
  switch (norm) {
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
    case 'completed':
      return <Badge className="bg-blue-100 text-blue-800">Completa</Badge>;
    case 'expired':
      return <Badge className="bg-gray-100 text-gray-700">Expirada</Badge>;
    case 'in_progress':
      return <Badge className="bg-green-100 text-green-800">Em curso</Badge>;
    case 'pending':
    case 'active':
    case 'available':
    case 'confirmed':
      return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-700">{status || '—'}</Badge>;
  }
}

export default function AdminRides() {
  const { rides, ridesPagination, loading, fetchRides, error, clearError } = useAdminStore();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [driverId, setDriverId] = useState('');

  const loadRides = async () => {
    try {
      await fetchRides(page, 20, { status, driverId: driverId || undefined });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao carregar rides');
    }
  };

  useEffect(() => {
    loadRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadRides();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Rides</h2>
        <p className="text-gray-600 mt-2">
          Todas as viagens — incluindo canceladas e o respetivo motivo.
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6 space-y-4">
          {/* Botões de status */}
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setStatus(f.key);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                  status === f.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Busca por driverId */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Filtrar por ID do motorista..."
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Tabela */}
      {loading && rides.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Carregando rides...</p>
          </div>
        </div>
      ) : rides.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Rota</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Motorista</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Matrícula</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Data</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Preço</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase text-xs">Motivo do cancelamento</th>
                </tr>
              </thead>
              <tbody>
                {rides.map((ride: any) => {
                  const isCancelled = (ride.status || '').toLowerCase() === 'cancelled';
                  const route =
                    [ride.from_city || ride.from_province, ride.to_city || ride.to_province]
                      .filter(Boolean)
                      .join(' → ') || '—';

                  return (
                    <tr key={ride.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-900">{route}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{ride.driver_name || '—'}</div>
                        {ride.driver_email && (
                          <div className="text-xs text-gray-500">{ride.driver_email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {ride.plate_number || '—'}
                        {(ride.vehicle_make || ride.vehicle_model) && (
                          <div className="text-xs text-gray-500">
                            {[ride.vehicle_make, ride.vehicle_model].filter(Boolean).join(' ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatDateOnly(ride.departure_date)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {ride.price_per_seat != null ? `${ride.price_per_seat} MT` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ride.status} />
                      </td>
                      <td className="px-6 py-4">
                        {isCancelled ? (
                          <span className="text-red-700">
                            {ride.cancellation_reason || 'Sem motivo indicado'}
                            {ride.cancelled_at && (
                              <div className="text-xs text-gray-500">
                                {formatDateOnly(ride.cancelled_at)}
                              </div>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 text-lg">Nenhuma ride encontrada</p>
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      {ridesPagination && ridesPagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            variant="outline"
          >
            Anterior
          </Button>
          <span className="text-gray-600 text-sm flex items-center">
            Página {page} de {ridesPagination.totalPages} ({ridesPagination.total} rides)
          </span>
          <Button
            onClick={() => setPage(Math.min(ridesPagination.totalPages, page + 1))}
            disabled={page === ridesPagination.totalPages}
            variant="outline"
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}