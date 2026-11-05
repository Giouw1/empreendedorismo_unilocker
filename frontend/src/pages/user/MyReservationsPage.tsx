import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reservationsService } from '../../services/reservations.service';
import { useAsync } from '../../hooks/useAsync';
import { EmptyState, ErrorAlert, Loading, PageHeader } from '../../components/ui';
import { ReservationCard } from '../../components/domain/ReservationCard';

export default function MyReservationsPage() {
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const { data, loading, error, reload } = useAsync(() => reservationsService.listMine(), []);

  const list = tab === 'active' ? (data?.active ?? []) : (data?.history ?? []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Minhas reservas"
        subtitle="Acompanhe seus lockers ativos e histórico de aluguéis"
      />

      <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 text-xs font-bold shadow-xs">
        <button
          type="button"
          onClick={() => setTab('active')}
          className={`rounded-xl py-2.5 transition-all ${
            tab === 'active'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Em andamento ({data?.active.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`rounded-xl py-2.5 transition-all ${
            tab === 'history'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Histórico ({data?.history.length ?? 0})
        </button>
      </div>

      <ErrorAlert message={error} onRetry={() => void reload()} />
      {loading && <Loading />}

      {!loading && !list.length && (
        <EmptyState
          title={tab === 'active' ? 'Nenhum locker ativo no momento' : 'Histórico de aluguéis vazio'}
          description="Encontre pontos com vagas disponíveis pela UFRJ na aba Explorar."
          action={
            <Link to="/app/explore" className="btn-primary mt-3 text-xs font-bold px-4 py-2">
              Explorar lockers
            </Link>
          }
        />
      )}

      {!loading && (
        <div className="space-y-3">
          {list.map((res) => (
            <ReservationCard key={res.id} reservation={res} />
          ))}
        </div>
      )}
    </div>
  );
}
