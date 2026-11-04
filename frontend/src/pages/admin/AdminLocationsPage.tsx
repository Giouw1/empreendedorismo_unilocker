import { useState } from 'react';
import { adminService } from '../../services/admin.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import {
  formatCents,
  LOCATION_STATUSES,
  locationStatusLabels,
  locationTone,
} from '../../utils/formatters';
import type { LocationStatus } from '../../types/api';
import { Badge, EmptyState, ErrorAlert, Loading, PageHeader, Spinner } from '../../components/ui';

export default function AdminLocationsPage() {
  const [status, setStatus] = useState<LocationStatus | ''>('');
  const { data: locations, loading, error, reload } = useAsync(
    () => adminService.listLocations(status || undefined),
    [status],
  );
  const action = useAction();

  const handleReview = async (id: string, approved: boolean) => {
    const res = await action.run(() => adminService.reviewLocation(id, { approved }));
    if (res) void reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pontos e compartimentos"
        subtitle="Autorização de publicação e supervisão de capacidade"
        actions={
          <select
            className="input w-52"
            value={status}
            onChange={(e) => setStatus(e.target.value as LocationStatus | '')}
          >
            <option value="">Todos os status</option>
            {LOCATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {locationStatusLabels[s]}
              </option>
            ))}
          </select>
        }
      />

      <ErrorAlert message={error ?? action.error} onRetry={() => void reload()} />
      {loading && <Loading />}
      {!loading && !locations?.length && <EmptyState title="Nenhum ponto encontrado" />}

      {!!locations?.length && (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Ponto</th>
                <th>Parceiro</th>
                <th>Localização</th>
                <th>Lockers</th>
                <th>Diária inicial</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.id}>
                  <td className="font-bold">{loc.name}</td>
                  <td>{loc.partnerName}</td>
                  <td>
                    {loc.campus} • {loc.building} ({loc.floor})
                  </td>
                  <td>
                    {loc.availableCount} livres / {loc.lockers?.length ?? 0} total
                  </td>
                  <td>{formatCents(loc.startingDailyPriceCents)}</td>
                  <td>
                    <Badge tone={locationTone(loc.status)}>{locationStatusLabels[loc.status]}</Badge>
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      {loc.status !== 'ACTIVE' && (
                        <button
                          type="button"
                          disabled={action.pending}
                          onClick={() => void handleReview(loc.id, true)}
                          className="btn-success px-2.5 py-1 text-xs"
                        >
                          {action.pending && <Spinner />} Publicar
                        </button>
                      )}
                      {loc.status !== 'REJECTED' && (
                        <button
                          type="button"
                          disabled={action.pending}
                          onClick={() => void handleReview(loc.id, false)}
                          className="btn-danger px-2.5 py-1 text-xs"
                        >
                          Suspender/Recusar
                        </button>
                      )}
                    </div>
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
