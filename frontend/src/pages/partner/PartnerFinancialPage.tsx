import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Building2, PieChart as PieIcon, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { partnerService } from '../../services/partner.service';
import { useAsync } from '../../hooks/useAsync';
import { formatCents, RENTAL_PERIODS } from '../../utils/formatters';
import type { PartnerRevenueEntryDto, RentalPeriod } from '../../types/api';
import { EmptyState, ErrorAlert, Loading, PageHeader, StatCard } from '../../components/ui';

const periodChartLabels: Record<RentalPeriod, string> = { DAILY: 'Diário', WEEKLY: 'Semanal', MONTHLY: 'Mensal' };

/** Lê as cores do tema daisyUI para usar nos gráficos SVG. */
function useThemeColors() {
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const get = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    return {
      primary: get('--color-primary', '#4b6bfb'),
      secondary: get('--color-secondary', '#7b92b2'),
      accent: get('--color-accent', '#67cba0'),
      grid: get('--color-base-300', '#e5e7eb'),
      text: get('--color-base-content', '#1f2937'),
    };
  }, []);
}

const brlShort = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: cents >= 100_000 ? 'compact' : 'standard', maximumFractionDigits: 0 }).format(cents / 100);

/** Receita líquida das últimas 8 semanas, agrupada pela semana (segunda-feira) do pedido. */
function weeklySeries(entries: PartnerRevenueEntryDto[]) {
  const startOfWeek = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  };
  const current = startOfWeek(new Date());
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(current);
    start.setDate(start.getDate() - (7 - i) * 7);
    return { start, label: start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), cents: 0 };
  });
  for (const e of entries) {
    const w = startOfWeek(new Date(e.createdAt)).getTime();
    const bucket = weeks.find((b) => b.start.getTime() === w);
    if (bucket) bucket.cents += e.partnerNetCents;
  }
  return weeks;
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel min-w-0 space-y-3">
      <h2 className="section-title">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

export default function PartnerFinancialPage() {
  const { data, loading, error, reload } = useAsync(() => partnerService.getFinancial(), []);
  const colors = useThemeColors();

  if (loading) return <Loading />;
  if (error || !data) return <ErrorAlert message={error ?? 'Falha ao carregar o financeiro'} onRetry={() => void reload()} />;

  const weekly = weeklySeries(data.entries);
  const byLocation = data.revenueByLocation.filter((l) => l.revenueCents > 0).sort((a, b) => b.revenueCents - a.revenueCents);
  const byPeriod = RENTAL_PERIODS.map((p) => ({ name: periodChartLabels[p], cents: data.revenueByPeriod[p] ?? 0 })).filter((p) => p.cents > 0);
  const pieColors = [colors.primary, colors.accent, colors.secondary];
  const ticket = data.totalRentalsCount ? Math.round(data.grossTotalCents / data.totalRentalsCount) : 0;

  const tooltip = {
    formatter: (value: number) => [formatCents(value), 'Receita líquida'] as [string, string],
    contentStyle: { borderRadius: 8, fontSize: 12 },
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Financeiro" subtitle="Quanto seus pontos renderam até agora." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="col-span-2 flex min-w-0 items-start gap-3 rounded-box border border-primary/30 bg-primary/5 p-4 lg:col-span-1">
          <span className="icon-chip bg-primary text-primary-content">
            <Wallet className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-medium text-base-content/60">Seu ganho líquido</div>
            <div className="truncate text-2xl font-semibold text-primary tabular-nums">{formatCents(data.partnerNetTotalCents)}</div>
            <div className="text-xs text-base-content/50">90% de cada aluguel</div>
          </div>
        </div>
        <StatCard label="Arrecadação bruta" value={formatCents(data.grossTotalCents)} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label="Aluguéis pagos" value={data.totalRentalsCount} icon={<Receipt className="h-5 w-5" />} />
        <StatCard label="Ticket médio" value={formatCents(ticket)} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      {!data.entries.length ? (
        <EmptyState title="Ainda sem receitas" description="Os valores aparecem aqui depois que você ativar os primeiros aluguéis." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <ChartCard title="Receita líquida por semana" icon={<TrendingUp className="h-4 w-4 text-primary" />}>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                    <CartesianGrid vertical={false} stroke={colors.grid} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: colors.text, opacity: 0.6 }} />
                    <YAxis tickFormatter={brlShort} tickLine={false} axisLine={false} fontSize={11} width={64} tick={{ fill: colors.text, opacity: 0.6 }} />
                    <Tooltip {...tooltip} labelFormatter={(l) => `Semana de ${l}`} cursor={{ fill: colors.grid, opacity: 0.4 }} />
                    <Bar dataKey="cents" fill={colors.primary} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <ChartCard title="Por ponto" icon={<Building2 className="h-4 w-4 text-primary" />}>
            {!byLocation.length ? (
              <p className="text-sm text-base-content/60">Sem receita por ponto ainda.</p>
            ) : (
              <div className="w-full" style={{ height: Math.max(120, byLocation.length * 44) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byLocation} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="locationName"
                      width={120}
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tick={{ fill: colors.text }}
                      tickFormatter={(v: string) => (v.length > 18 ? `${v.slice(0, 17)}…` : v)}
                    />
                    <Tooltip {...tooltip} cursor={{ fill: colors.grid, opacity: 0.4 }} />
                    <Bar dataKey="revenueCents" fill={colors.primary} radius={[0, 4, 4, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Por modalidade" icon={<PieIcon className="h-4 w-4 text-primary" />}>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byPeriod} dataKey="cents" nameKey="name" innerRadius={44} outerRadius={70} paddingAngle={2} stroke="none">
                      {byPeriod.map((p, i) => (
                        <Cell key={p.name} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCents(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full min-w-0 space-y-2 text-sm">
                {byPeriod.map((p, i) => (
                  <li key={p.name} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="font-medium tabular-nums">{formatCents(p.cents)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ChartCard>
        </div>
      )}

      <p className="text-xs text-base-content/50">
        Taxa de tecnologia UniLocker (10%) já descontada: {formatCents(data.platformCommissionCents)}. Pré-reservas só entram nos valores
        depois de ativadas. O histórico detalhado fica na aba Aluguéis.
      </p>
    </div>
  );
}
