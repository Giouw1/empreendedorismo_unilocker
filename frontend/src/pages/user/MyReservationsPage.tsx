import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reservationsService } from '../../services/reservations.service';
import { useAsync } from '../../hooks/useAsync';
import {
  formatCents,
  formatDateTime,
  formatRemaining,
  periodLabels,
  reservationStatusLabels,
  reservationTone,
} from '../../utils/formatters';
import { Badge, EmptyState, ErrorAlert, Loading, PageHeader } from '../../components/ui';

export default function MyReservationsPage() {
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const { data, loading, error, reload } = useAsync(() => reservationsService.listMine(), []);

  const list = tab === 'active' ? (data?.active ?? []) : (data?.history ?? []);

  return (
    <div className="space-y-4">
      <PageHeader title="Minhas reservas" subtitle="Acompanhe seus lockers ativos e histórico" />

      <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`rounded-lg py-2 ${tab === 'active' ? 'bg-brand-600 text-white' : 'text-slate-600'}`}
        >
          Em andamento ({data?.active.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`rounded-lg py-2 ${tab === 'history' ? 'bg-brand-600 text-white' : 'text-slate-600'}`}
        >
          Histórico ({data?.history.length ?? 0})
        </button>
      </div>

      <ErrorAlert message={error} onRetry={() => void reload()} />
      {loading && <Loading />}

      {!loading && !list.length && (
        <EmptyState
          title={tab === 'active' ? 'Nenhum locker ativo' : 'Histórico vazio'}
          description="Encontre um ponto próximo na aba Explorar."
          action={
            <Link to="/app/explore" className="btn-primary mt-2 text-xs">
              Explorar lockers
            </Link>
          }
        />
      )}

      {!loading &&
        list.map((res) => (
          <div key={res.id} className="card space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold tracking-wider text-brand-700 uppercase">
                  Locker {res.lockerCode}
                </p>
                <h2 className="font-bold text-slate-900">{res.locationName}</h2>
              </div>
              <Badge tone={reservationTone(res.status)}>{reservationStatusLabels[res.status]}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
              <span>Plano: {periodLabels[res.period]}</span>
              <span className="text-right font-semibold">{formatCents(res.totalPriceCents)}</span>
              <span>Início: {formatDateTime(res.startTime)}</span>
              <span className="text-right">
                {res.status === 'Active' ? `Restam ${formatRemaining(res.endTime)}` : `Fim: ${formatDateTime(res.endTime)}`}
              </span>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-2">
              <Link to={`/app/reservations/${res.id}`} className="btn-primary px-3 py-1.5 text-xs">
                {res.status === 'Active' ? 'Controlar locker' : 'Ver detalhes'}
              </Link>
            </div>
          </div>
        ))}
    </div>
  );
}
