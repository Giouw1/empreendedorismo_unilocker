import { partnerService } from '../../services/partner.service';
import { useAsync } from '../../hooks/useAsync';
import { formatCents, formatDateTime, periodLabels, RENTAL_PERIODS } from '../../utils/formatters';
import { EmptyState, ErrorAlert, Loading, PageHeader, StatCard } from '../../components/ui';

export default function PartnerFinancialPage() {
  const { data, loading, error, reload } = useAsync(() => partnerService.getFinancial(), []);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorAlert message={error ?? 'Falha ao carregar demonstrativo'} onRetry={() => void reload()} />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Demonstrativo de receitas"
        subtitle="Modelo de parceria: 90% repassado ao ofertador • 10% taxa da plataforma UniLocker"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Arrecadação bruta" value={formatCents(data.grossTotalCents)} />
        <StatCard label="Taxa UniLocker (10%)" value={formatCents(data.platformCommissionCents)} />
        <StatCard label="Líquido Parceiro (90%)" value={formatCents(data.partnerNetTotalCents)} />
        <StatCard label="Total de aluguéis" value={data.totalRentalsCount} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card space-y-2">
          <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">Receita líquida por ponto</h2>
          {data.revenueByLocation.map((loc) => (
            <div key={loc.locationId} className="flex justify-between text-xs">
              <span>{loc.locationName}</span>
              <strong>{formatCents(loc.revenueCents)}</strong>
            </div>
          ))}
        </div>

        <div className="card space-y-2">
          <h2 className="text-xs font-bold tracking-wide text-slate-600 uppercase">Receita líquida por modalidade</h2>
          {RENTAL_PERIODS.map((p) => (
            <div key={p} className="flex justify-between text-xs">
              <span>{periodLabels[p]}</span>
              <strong>{formatCents(data.revenueByPeriod[p])}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-900">Extrato por aluguel</h2>
        {!data.entries.length ? (
          <EmptyState title="Nenhuma receita registrada ainda" />
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="table">
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
                    <td>{formatDateTime(entry.createdAt)}</td>
                    <td>
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
