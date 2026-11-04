import { useState } from 'react';
import { adminService } from '../../services/admin.service';
import { useAsync } from '../../hooks/useAsync';
import {
  formatCents,
  formatDateTime,
  periodLabels,
  RESERVATION_STATUSES,
  reservationStatusLabels,
  reservationTone,
} from '../../utils/formatters';
import type { ReservationStatus } from '../../types/api';
import { Badge, EmptyState, ErrorAlert, Loading, PageHeader } from '../../components/ui';

export default function AdminReservationsPage() {
  const [status, setStatus] = useState<ReservationStatus | ''>('');
  const { data: reservations, loading, error, reload } = useAsync(
    () => adminService.listReservations({ status: status || undefined }),
    [status],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Auditoria global de reservas"
        subtitle="Histórico e aluguéis ativos em toda a rede UFRJ"
        actions={
          <select
            className="input w-48"
            value={status}
            onChange={(e) => setStatus(e.target.value as ReservationStatus | '')}
          >
            <option value="">Todos os status</option>
            {RESERVATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {reservationStatusLabels[s]}
              </option>
            ))}
          </select>
        }
      />

      <ErrorAlert message={error} onRetry={() => void reload()} />
      {loading && <Loading />}
      {!loading && !reservations?.length && <EmptyState title="Nenhuma reserva encontrada" />}

      {!!reservations?.length && (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuário</th>
                <th>Ponto / Locker</th>
                <th>Modalidade</th>
                <th>Início</th>
                <th>Término</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.id}</td>
                  <td>{r.userName ?? r.userId}</td>
                  <td>
                    {r.locationName} (<strong>{r.lockerCode}</strong>)
                  </td>
                  <td>{periodLabels[r.period]}</td>
                  <td>{formatDateTime(r.startTime)}</td>
                  <td>{formatDateTime(r.endTime)}</td>
                  <td className="font-semibold">{formatCents(r.totalPriceCents)}</td>
                  <td>
                    <Badge tone={reservationTone(r.status)}>{reservationStatusLabels[r.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
