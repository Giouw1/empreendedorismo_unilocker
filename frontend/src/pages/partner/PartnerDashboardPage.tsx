import { Link } from 'react-router-dom';
import { Plus, Settings } from 'lucide-react';
import { partnerService } from '../../services/partner.service';
import { useAsync } from '../../hooks/useAsync';
import { formatCents, locationStatusLabels, locationTone } from '../../utils/formatters';
import { Badge, EmptyState, ErrorAlert, Loading, PageHeader, StatCard } from '../../components/ui';

export default function PartnerDashboardPage() {
  const { data, loading, error, reload } = useAsync(() => partnerService.getDashboard(), []);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorAlert message={error ?? 'Falha ao carregar painel'} onRetry={() => void reload()} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={data.partner.organizationName}
        subtitle={`Responsável: ${data.partner.responsibleName}`}
        actions={
          <Link to="/partner/locations/new" className="btn-primary text-xs">
            <Plus className="h-4 w-4" /> Criar novo ponto
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total de lockers" value={data.totalLockers} />
        <StatCard label="Ocupados agora" value={data.occupiedLockers} />
        <StatCard label="Disponíveis" value={data.availableLockers} />
        <StatCard label="Aluguéis ativos" value={data.activeRentals} />
        <StatCard
          label="Receita líquida (90%)"
          value={formatCents(data.periodRevenueCents)}
          hint="Acumulado dos aluguéis"
        />
        <StatCard label="Ocorrências abertas" value={data.pendingIncidents} />
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Meus pontos cadastrados</h2>
        {!data.locations.length ? (
          <EmptyState title="Nenhum ponto cadastrado ainda" />
        ) : (
          data.locations.map((loc) => (
            <div key={loc.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">{loc.name}</h3>
                  <Badge tone={locationTone(loc.status)}>{locationStatusLabels[loc.status]}</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {loc.building} • {loc.block} • {loc.availableCount} compartimentos livres
                </p>
              </div>
              <Link to={`/partner/locations/${loc.id}/lockers`} className="btn-secondary text-xs">
                <Settings className="h-4 w-4" /> Gerenciar lockers
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
