import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { locationsService } from '../../services/locations.service';
import { partnerService } from '../../services/partner.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import {
  LOCKER_SIZES,
  lockerSizeLabels,
  lockerStatusLabels,
  lockerTone,
} from '../../utils/formatters';
import type { LockerSize } from '../../types/api';
import { Badge, ErrorAlert, Loading, PageHeader, Spinner } from '../../components/ui';

export default function ManageLockersPage() {
  const { id = '' } = useParams();
  const { data: location } = useAsync(() => locationsService.getById(id), [id]);
  const { data: lockers, loading, error, reload } = useAsync(
    () => locationsService.listLockers(id),
    [id],
  );
  const action = useAction();

  const [code, setCode] = useState('');
  const [size, setSize] = useState<LockerSize>('MEDIUM');

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const res = await action.run(() =>
      partnerService.addLockers(id, { lockers: [{ code: code.trim(), size }] }),
    );
    if (res) {
      setCode('');
      void reload();
    }
  };

  const handleStatus = async (lockerId: string, status: 'AVAILABLE' | 'MAINTENANCE' | 'BLOCKED') => {
    const res = await action.run(() => partnerService.updateLockerStatus(lockerId, { status }));
    if (res) void reload();
  };

  return (
    <div className="space-y-4">
      <Link to="/partner/dashboard" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </Link>

      <PageHeader
        title="Gerenciar compartimentos"
        subtitle={location?.name ?? 'Controle de disponibilidade e manutenção'}
      />

      <ErrorAlert message={error ?? action.error} onRetry={() => void reload()} />

      <form onSubmit={(e) => void handleAdd(e)} className="card flex flex-wrap items-end gap-2">
        <div className="flex-1">
          <label className="label">Novo compartimento</label>
          <input
            required
            className="input"
            placeholder="Código (ex.: A-07)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Tamanho</label>
          <select className="input" value={size} onChange={(e) => setSize(e.target.value as LockerSize)}>
            {LOCKER_SIZES.map((s) => (
              <option key={s} value={s}>
                {lockerSizeLabels[s]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={action.pending} className="btn-primary text-xs">
          {action.pending && <Spinner />} Adicionar
        </button>
      </form>

      {loading ? (
        <Loading />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Compartimento</th>
                <th>Tamanho</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(lockers ?? []).map((lk) => {
                const lockedByRental = lk.status === 'OCCUPIED';
                return (
                  <tr key={lk.id}>
                    <td className="font-bold">{lk.code}</td>
                    <td>{lockerSizeLabels[lk.size]}</td>
                    <td>
                      <Badge tone={lockerTone(lk.status)}>{lockerStatusLabels[lk.status]}</Badge>
                    </td>
                    <td>
                      {lockedByRental ? (
                        <span className="text-xs text-slate-400">Em uso por reserva ativa</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {lk.status !== 'AVAILABLE' && (
                            <button
                              type="button"
                              disabled={action.pending}
                              onClick={() => void handleStatus(lk.id, 'AVAILABLE')}
                              className="btn-secondary px-2 py-1 text-xs"
                            >
                              Disponibilizar
                            </button>
                          )}
                          {lk.status !== 'MAINTENANCE' && (
                            <button
                              type="button"
                              disabled={action.pending}
                              onClick={() => void handleStatus(lk.id, 'MAINTENANCE')}
                              className="btn-secondary px-2 py-1 text-xs"
                            >
                              Manutenção
                            </button>
                          )}
                          {lk.status !== 'BLOCKED' && (
                            <button
                              type="button"
                              disabled={action.pending}
                              onClick={() => void handleStatus(lk.id, 'BLOCKED')}
                              className="btn-secondary px-2 py-1 text-xs"
                            >
                              Bloquear
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
