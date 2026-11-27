import { useMemo, useState } from 'react';
import { CalendarRange, CheckCircle2, Filter, Search, X, XCircle } from 'lucide-react';
import { partnerService } from '../../services/partner.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import {
  formatCents,
  formatDate,
  formatDateTime,
  periodLabels,
  RENTAL_PERIODS,
  RESERVATION_STATUSES,
  reservationStatusLabels,
  reservationTone,
} from '../../utils/formatters';
import type { RentalPeriod, ReservationDto, ReservationStatus } from '../../types/api';
import { Badge, CopyId, EmptyState, ErrorAlert, Loading, PageHeader, Spinner, SuccessAlert } from '../../components/ui';
import { ConfirmationDialog } from '../../components/domain/ConfirmationDialog';

interface Filters {
  user: string;
  locationId: string;
  lockerCode: string;
  period: RentalPeriod | '';
  status: ReservationStatus | '';
  endFrom: string;
  endTo: string;
  minPrice: string;
  maxPrice: string;
}

const EMPTY: Filters = { user: '', locationId: '', lockerCode: '', period: '', status: '', endFrom: '', endTo: '', minPrice: '', maxPrice: '' };

function toCents(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

function applyFilters(list: ReservationDto[], f: Filters, idQuery: string): ReservationDto[] {
  const q = idQuery.trim().toLowerCase();
  const min = toCents(f.minPrice);
  const max = toCents(f.maxPrice);
  const from = f.endFrom ? new Date(`${f.endFrom}T00:00:00`).getTime() : null;
  const to = f.endTo ? new Date(`${f.endTo}T23:59:59.999`).getTime() : null;
  return list.filter((r) => {
    if (q && !r.id.toLowerCase().includes(q)) return false;
    if (f.user && r.userName !== f.user) return false;
    if (f.locationId && r.locationId !== f.locationId) return false;
    if (f.lockerCode && r.lockerCode !== f.lockerCode) return false;
    if (f.period && r.period !== f.period) return false;
    if (f.status && r.status !== f.status) return false;
    const end = new Date(r.endTime).getTime();
    if (from !== null && end < from) return false;
    if (to !== null && end > to) return false;
    if (min !== null && r.totalPriceCents < min) return false;
    if (max !== null && r.totalPriceCents > max) return false;
    return true;
  });
}

function PendingActions({ r, busy, onActivate, onCancel }: { r: ReservationDto; busy: boolean; onActivate: () => void; onCancel: () => void }) {
  if (r.status !== 'PendingConfirmation') return null;
  return (
    <div className="flex gap-1.5">
      <button type="button" disabled={busy} onClick={onActivate} className="btn btn-primary btn-xs">
        {busy ? <Spinner /> : <CheckCircle2 className="h-3.5 w-3.5" />} Ativar
      </button>
      <button type="button" disabled={busy} onClick={onCancel} className="btn btn-ghost btn-xs text-error">
        <XCircle className="h-3.5 w-3.5" /> Cancelar
      </button>
    </div>
  );
}

export default function PartnerReservationsPage() {
  const { data, loading, error, reload } = useAsync(() => partnerService.listReservations(), []);
  const action = useAction();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [idQuery, setIdQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toCancel, setToCancel] = useState<ReservationDto | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const all = useMemo(() => data ?? [], [data]);
  const options = useMemo(() => {
    const users = [...new Set(all.map((r) => r.userName).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const locations = [...new Map(all.map((r) => [r.locationId, r.locationName])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
    const lockers = [...new Set(all.filter((r) => !filters.locationId || r.locationId === filters.locationId).map((r) => r.lockerCode))].sort();
    return { users, locations, lockers };
  }, [all, filters.locationId]);

  const countsByStatus = useMemo(() => {
    const counts = Object.fromEntries(RESERVATION_STATUSES.map((s) => [s, 0])) as Record<ReservationStatus, number>;
    all.forEach((r) => counts[r.status]++);
    return counts;
  }, [all]);

  const list = useMemo(() => applyFilters(all, filters, idQuery), [all, filters, idQuery]);
  const total = list.reduce((sum, r) => sum + r.totalPriceCents, 0);
  const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== '').length;

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value, ...(key === 'locationId' ? { lockerCode: '' } : {}) }));

  const runOn = async (r: ReservationDto, fn: () => Promise<ReservationDto>, message: string) => {
    setBusyId(r.id);
    const done = await action.run(fn);
    setBusyId(null);
    if (done) {
      setSuccess(message);
      window.setTimeout(() => setSuccess(null), 3500);
      await reload();
    }
  };
  const activate = (r: ReservationDto) =>
    void runOn(r, () => partnerService.activateReservation(r.id), `Locker ${r.lockerCode} ativado.`);

  return (
    <div className="space-y-4">
      <PageHeader title="Aluguéis" subtitle="Todos os aluguéis dos seus pontos, do pedido ao encerramento." />

      {/* Visão geral por status */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => set('status', '')}
          className={`btn btn-sm shrink-0 ${filters.status === '' ? 'btn-neutral' : 'btn-ghost border-base-300 bg-base-100'}`}
        >
          Todos <span className="badge badge-sm">{all.length}</span>
        </button>
        {RESERVATION_STATUSES.filter((s) => countsByStatus[s] > 0).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => set('status', filters.status === s ? '' : s)}
            className={`btn btn-sm shrink-0 ${filters.status === s ? 'btn-neutral' : 'btn-ghost border-base-300 bg-base-100'}`}
          >
            {reservationStatusLabels[s]} <span className="badge badge-sm">{countsByStatus[s]}</span>
          </button>
        ))}
      </div>

      {/* Busca por ID + botão de filtros */}
      <div className="flex gap-2">
        <label className="input w-full min-w-0 flex-1">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <input
            type="search"
            value={idQuery}
            onChange={(e) => setIdQuery(e.target.value)}
            placeholder="Buscar pelo ID da reserva"
            className="min-w-0 grow"
            aria-label="Buscar pelo ID da reserva"
          />
        </label>
        <button type="button" onClick={() => setShowFilters((v) => !v)} className={`btn shrink-0 ${showFilters ? 'btn-primary' : ''}`} aria-expanded={showFilters}>
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && <span className="badge badge-sm">{activeFilterCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="panel grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block min-w-0">
            <span className="field-label">Usuário</span>
            <select className="select w-full" value={filters.user} onChange={(e) => set('user', e.target.value)}>
              <option value="">Todos</option>
              {options.users.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="field-label">Ponto</span>
            <select className="select w-full" value={filters.locationId} onChange={(e) => set('locationId', e.target.value)}>
              <option value="">Todos</option>
              {options.locations.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="field-label">Locker</span>
            <select className="select w-full" value={filters.lockerCode} onChange={(e) => set('lockerCode', e.target.value)}>
              <option value="">Todos</option>
              {options.lockers.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="field-label">Modalidade</span>
            <select className="select w-full" value={filters.period} onChange={(e) => set('period', e.target.value as RentalPeriod | '')}>
              <option value="">Todas</option>
              {RENTAL_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {periodLabels[p]}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="min-w-0 sm:col-span-2">
            <legend className="field-label flex items-center gap-1.5">
              <CalendarRange className="h-4 w-4" /> Data de término
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="input w-full" value={filters.endFrom} max={filters.endTo || undefined} onChange={(e) => set('endFrom', e.target.value)} aria-label="Término a partir de" />
              <input type="date" className="input w-full" value={filters.endTo} min={filters.endFrom || undefined} onChange={(e) => set('endTo', e.target.value)} aria-label="Término até" />
            </div>
          </fieldset>
          <fieldset className="min-w-0">
            <legend className="field-label">Faixa de valor (R$)</legend>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} step="0.01" inputMode="decimal" placeholder="Mín." className="input w-full" value={filters.minPrice} onChange={(e) => set('minPrice', e.target.value)} aria-label="Valor mínimo" />
              <input type="number" min={0} step="0.01" inputMode="decimal" placeholder="Máx." className="input w-full" value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} aria-label="Valor máximo" />
            </div>
          </fieldset>
          <label className="block min-w-0">
            <span className="field-label">Status</span>
            <select className="select w-full" value={filters.status} onChange={(e) => set('status', e.target.value as ReservationStatus | '')}>
              <option value="">Todos</option>
              {RESERVATION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {reservationStatusLabels[s]}
                </option>
              ))}
            </select>
          </label>
          {activeFilterCount > 0 && (
            <div className="flex items-end sm:col-span-2 lg:col-span-4">
              <button type="button" onClick={() => setFilters(EMPTY)} className="btn btn-ghost btn-sm">
                <X className="h-4 w-4" /> Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      <SuccessAlert message={success} />
      <ErrorAlert message={action.error ?? error} onRetry={error ? () => void reload() : undefined} />
      {loading && !data && <Loading />}

      {data && (
        <p className="text-sm text-base-content/60">
          {list.length} {list.length === 1 ? 'aluguel' : 'aluguéis'} · {formatCents(total)}
        </p>
      )}

      {data && !list.length && <EmptyState title="Nenhum aluguel encontrado" description="Ajuste a busca ou os filtros." />}

      {!!list.length && (
        <>
          {/* Celular: cartões */}
          <div className="space-y-2 md:hidden">
            {list.map((r) => (
              <div key={r.id} className="space-y-2 rounded-box border border-base-300 bg-base-100 p-3 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {r.lockerCode} · {r.locationName}
                    </p>
                    <p className="truncate text-sm text-base-content/60">{r.userName ?? r.userId}</p>
                  </div>
                  <Badge tone={reservationTone(r.status)}>{reservationStatusLabels[r.status]}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/60">
                  <span>{periodLabels[r.period]}</span>
                  <span>{r.status === 'PendingConfirmation' ? 'Começa ao ativar' : `Término ${formatDate(r.endTime)}`}</span>
                  <span className="font-semibold text-base-content tabular-nums">{formatCents(r.totalPriceCents)}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CopyId id={r.id} />
                  <PendingActions r={r} busy={busyId === r.id} onActivate={() => activate(r)} onCancel={() => setToCancel(r)} />
                </div>
              </div>
            ))}
          </div>

          {/* Web: tabela */}
          <div className="hidden overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow-xs md:block">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ponto / locker</th>
                  <th>Usuário</th>
                  <th>Modalidade</th>
                  <th>Término</th>
                  <th className="text-right">Valor</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="hover:bg-base-200/50">
                    <td>
                      <CopyId id={r.id} />
                    </td>
                    <td className="max-w-56">
                      <span className="block truncate font-medium">{r.locationName}</span>
                      <span className="text-xs text-base-content/60">Locker {r.lockerCode}</span>
                    </td>
                    <td className="max-w-40 truncate">{r.userName ?? r.userId}</td>
                    <td className="whitespace-nowrap">{periodLabels[r.period]}</td>
                    <td className="whitespace-nowrap">{r.status === 'PendingConfirmation' ? '—' : formatDateTime(r.endTime)}</td>
                    <td className="text-right font-medium whitespace-nowrap tabular-nums">{formatCents(r.totalPriceCents)}</td>
                    <td>
                      <Badge tone={reservationTone(r.status)}>{reservationStatusLabels[r.status]}</Badge>
                    </td>
                    <td>
                      <PendingActions r={r} busy={busyId === r.id} onActivate={() => activate(r)} onCancel={() => setToCancel(r)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ConfirmationDialog
        isOpen={!!toCancel}
        onClose={() => setToCancel(null)}
        onConfirm={async () => {
          if (toCancel) await runOn(toCancel, () => partnerService.cancelReservation(toCancel.id), `Pré-reserva do locker ${toCancel.lockerCode} cancelada.`);
        }}
        title="Cancelar pré-reserva?"
        description="O compartimento volta a ficar disponível para outras pessoas."
        confirmLabel="Cancelar pré-reserva"
        cancelLabel="Voltar"
        variant="danger"
      />
    </div>
  );
}
