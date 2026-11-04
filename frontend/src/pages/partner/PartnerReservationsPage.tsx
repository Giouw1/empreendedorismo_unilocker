import { useState } from 'react';
import { partnerService } from '../../services/partner.service';
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

export default function PartnerReservationsPage() {
  const [status, setStatus] = useState<ReservationStatus | ''>('');
  const { data: reservations, loading, error, reload } = useAsync(
    () => partnerService.listReservations({ status: status || undefined }),
    [status],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Aluguéis nos meus pontos"
        subtitle="Acompanhamento operacional dos compartimentos alugados"
        actions={
          <select
            className="input w-44"
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
      {!loading && !reservations?.length && <EmptyState title="Nenhum aluguel encontrado" />}

      {!!reservations?.length && (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Locker</th>
                <th>Ponto</th>
                <th>Usuário</th>
                <th>Modalidade</th>
                <th>Término</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td className="font-bold">{r.lockerCode}</td>
                  <td>{r.locationName}</td>
                  <td>{r.userName ?? r.userId}</td>
                  <td>{periodLabels[r.period]}</td>
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
