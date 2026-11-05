import { partnerService } from '../../services/partner.service';
import { useAsync } from '../../hooks/useAsync';
import { formatCents, formatDateTime, periodLabels, RENTAL_PERIODS } from '../../utils/formatters';
import { EmptyState, ErrorAlert, Loading, PageHeader, StatCard } from '../../components/ui';
import { TrendingUp, PieChart, Coins } from 'lucide-react';

export default function PartnerFinancialPage() {
  const { data, loading, error, reload } = useAsync(() => partnerService.getFinancial(), []);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorAlert message={error ?? 'Falha ao carregar demonstrativo'} onRetry={() => void reload()} />;

  const maxLocationRevenue = Math.max(...data.revenueByLocation.map((l) => l.revenueCents), 1);
  const maxPeriodRevenue = Math.max(...Object.values(data.revenueByPeriod), 1);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Demonstrativo de receitas"
        subtitle="Divisão contratual: 90% repassado ao ofertador • 10% taxa de tecnologia da UniLocker"
      />

      {/* Destaque do Modelo de Parceria para o Pitch */}
      <div className="card bg-gradient-to-r from-brand-900 to-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-xs uppercase tracking-widest font-black text-amber-300">
              Modelo Marketplace de Espaços
            </span>
          </div>
          <span className="text-xs bg-white/20 text-white font-mono px-2.5 py-0.5 rounded-full">
            Divisão 90 / 10
          </span>
        </div>

        {/* Barra Gráfica de Repasse */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-400">90% Ganho Líquido do Parceiro</span>
            <span className="text-brand-300">10% Plataforma UniLocker</span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/20 overflow-hidden flex">
            <div className="h-full bg-emerald-500 w-[90%]" />
            <div className="h-full bg-brand-400 w-[10%]" />
          </div>
        </div>
      </div>

      {/* KPIs do Parceiro */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Arrecadação Bruta (GMV)" value={formatCents(data.grossTotalCents)} />
        <StatCard label="Taxa UniLocker (10%)" value={formatCents(data.platformCommissionCents)} />
        <StatCard
          label="Líquido Parceiro (90%)"
          value={formatCents(data.partnerNetTotalCents)}
          hint="Disponível para repasse"
        />
        <StatCard label="Total de Aluguéis" value={data.totalRentalsCount} />
      </div>

      {/* Gráficos em Barras Comparativas */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Por Ponto */}
        <div className="card space-y-3">
          <h2 className="text-xs font-black tracking-wide text-slate-700 uppercase flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-brand-600" /> Receita Líquida por Ponto
          </h2>
          <div className="space-y-2.5 pt-1">
            {data.revenueByLocation.map((loc) => {
              const pct = Math.round((loc.revenueCents / maxLocationRevenue) * 100);
              return (
                <div key={loc.locationId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{loc.locationName}</span>
                    <strong className="text-emerald-700">{formatCents(loc.revenueCents)}</strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Por Modalidade */}
        <div className="card space-y-3">
          <h2 className="text-xs font-black tracking-wide text-slate-700 uppercase flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-brand-600" /> Receita por Modalidade
          </h2>
          <div className="space-y-2.5 pt-1">
            {RENTAL_PERIODS.map((p) => {
              const rev = data.revenueByPeriod[p] || 0;
              const pct = Math.round((rev / maxPeriodRevenue) * 100);
              return (
                <div key={p} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{periodLabels[p]}</span>
                    <strong className="text-brand-700">{formatCents(rev)}</strong>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-brand-600 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Extrato Detalhado */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-900">Histórico de Aluguéis e Comissões</h2>
        {!data.entries.length ? (
          <EmptyState title="Nenhuma receita registrada ainda" />
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="table text-xs">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Ponto / Locker</th>
                  <th>Modalidade</th>
                  <th>Bruto</th>
                  <th>Taxa (10%)</th>
                  <th>Líquido (90%)</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry) => (
                  <tr key={entry.reservationId}>
                    <td className="text-slate-500 font-mono">{formatDateTime(entry.createdAt)}</td>
                    <td className="font-semibold text-slate-800">
                      {entry.locationName} ({entry.lockerCode})
                    </td>
                    <td>{periodLabels[entry.period]}</td>
                    <td>{formatCents(entry.grossAmountCents)}</td>
                    <td className="text-slate-500">{formatCents(entry.platformFeeCents)}</td>
                    <td className="font-bold text-emerald-700">{formatCents(entry.partnerNetCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
