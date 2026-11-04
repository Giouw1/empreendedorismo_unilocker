import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { useAsync } from '../../hooks/useAsync';
import { formatCents } from '../../utils/formatters';
import { ErrorAlert, Loading, PageHeader, StatCard } from '../../components/ui';

export default function AdminDashboardPage() {
  const { data, loading, error, reload } = useAsync(() => adminService.getDashboard(), []);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorAlert message={error ?? 'Falha ao carregar indicadores'} onRetry={() => void reload()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel Administrativo — Operação UFRJ"
        subtitle="Supervisão executiva de usuários, parceiros, ocupação e receita da plataforma"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuários cadastrados" value={data.totalUsers} />
        <StatCard
          label="Parceiros ativos"
          value={data.activePartners}
          hint={`${data.pendingPartners} aguardando aprovação`}
        />
        <StatCard
          label="Pontos na rede"
          value={data.totalLocations}
          hint={`${data.pendingLocations} aguardando revisão`}
        />
        <StatCard label="Lockers operacionais" value={data.operationalLockers} />
        <StatCard label="Aluguéis ativos" value={data.activeRentals} />
        <StatCard label="GMV (Volume bruto)" value={formatCents(data.grossRevenueCents)} />
        <StatCard
          label="Receita UniLocker (10%)"
          value={formatCents(data.platformRevenueCents)}
          hint="Comissão acumulada"
        />
        <StatCard label="Chamados em aberto" value={data.openIncidents} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/admin/partners" className="card hover:border-brand-500">
          <p className="text-xs font-bold text-amber-700 uppercase">Curadoria de parceiros</p>
          <p className="mt-1 text-lg font-bold">{data.pendingPartners} solicitações pendentes</p>
          <p className="mt-1 text-xs text-slate-500">Revisar laboratórios, CAs e cantinas →</p>
        </Link>
        <Link to="/admin/locations" className="card hover:border-brand-500">
          <p className="text-xs font-bold text-brand-700 uppercase">Publicação de pontos</p>
          <p className="mt-1 text-lg font-bold">{data.pendingLocations} pontos aguardando aprovação</p>
          <p className="mt-1 text-xs text-slate-500">Conferir lockers e tabela de preços →</p>
        </Link>
        <Link to="/admin/incidents" className="card hover:border-brand-500">
          <p className="text-xs font-bold text-red-700 uppercase">Suporte operacional</p>
          <p className="mt-1 text-lg font-bold">{data.openIncidents} ocorrências ativas</p>
          <p className="mt-1 text-xs text-slate-500">Atender chamados e liberar compartimentos →</p>
        </Link>
      </div>
    </div>
  );
}
