import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, LayoutGrid, List } from 'lucide-react';
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
import { LockerCard } from '../../components/domain/LockerCard';

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const res = await action.run(() =>
      partnerService.addLockers(id, { lockers: [{ code: code.trim().toUpperCase(), size }] }),
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
      <Link
        to="/partner/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </Link>

      <PageHeader
        title="Gerenciar compartimentos"
        subtitle={location?.name ?? 'Controle de disponibilidade, bloqueios e manutenção'}
        actions={
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grade Visual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-all ${
                viewMode === 'table' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Tabela
            </button>
          </div>
        }
      />

      <ErrorAlert message={error ?? action.error} onRetry={() => void reload()} />

      {/* Formulário de Adição Rápida */}
      <form onSubmit={(e) => void handleAdd(e)} className="card flex flex-wrap items-end gap-2 bg-slate-50 border-slate-200">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs font-bold text-slate-700 block mb-1">Novo compartimento</label>
          <input
            required
            className="input text-xs uppercase"
            placeholder="Código (ex.: A-07)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="w-32">
          <label className="text-xs font-bold text-slate-700 block mb-1">Tamanho</label>
          <select className="input text-xs" value={size} onChange={(e) => setSize(e.target.value as LockerSize)}>
            {LOCKER_SIZES.map((s) => (
              <option key={s} value={s}>
                {lockerSizeLabels[s]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={action.pending || !code.trim()}
          className="btn-primary text-xs font-bold py-2.5 px-4 flex items-center gap-1"
        >
          {action.pending ? <Spinner /> : <Plus className="w-4 h-4" />} Adicionar Armário
        </button>
      </form>

      {loading ? (
        <Loading />
      ) : viewMode === 'grid' ? (
        /* Visualização em Grade Física-Símile */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total: <strong>{lockers?.length ?? 0}</strong> compartimentos</span>
            <div className="flex gap-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Livre</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Em uso</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Manutenção</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(lockers ?? []).map((lk) => {
              const lockedByRental = lk.status === 'OCCUPIED';
              return (
                <LockerCard
                  key={lk.id}
                  locker={lk}
                  actionButton={
                    lockedByRental ? (
                      <span className="text-[10px] text-blue-600 font-bold">Reserva Ativa</span>
                    ) : (
                      <div className="flex gap-1">
                        {lk.status !== 'AVAILABLE' && (
                          <button
                            type="button"
                            disabled={action.pending}
                            onClick={() => void handleStatus(lk.id, 'AVAILABLE')}
                            className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold hover:bg-emerald-200"
                            title="Liberar armário"
                          >
                            Liberar
                          </button>
                        )}
                        {lk.status !== 'MAINTENANCE' && (
                          <button
                            type="button"
                            disabled={action.pending}
                            onClick={() => void handleStatus(lk.id, 'MAINTENANCE')}
                            className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold hover:bg-amber-200"
                            title="Colocar em manutenção"
                          >
                            Reparo
                          </button>
                        )}
                      </div>
                    )
                  }
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* Visualização em Tabela */
        <div className="card overflow-x-auto p-0">
          <table className="table text-xs">
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
                        <span className="text-xs text-blue-600 font-medium">Em uso por reserva ativa</span>
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
