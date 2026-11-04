import { useState } from 'react';
import { Link } from 'react-router-dom';
import { List, Map, MapPin, Search } from 'lucide-react';
import { locationsService } from '../../services/locations.service';
import { useAsync } from '../../hooks/useAsync';
import { CAMPUS_OPTIONS, formatCents, LOCKER_SIZES, lockerSizeLabels } from '../../utils/formatters';
import type { LockerSize } from '../../types/api';
import { Badge, EmptyState, ErrorAlert, Loading, PageHeader } from '../../components/ui';

export default function ExplorePage() {
  const [campus, setCampus] = useState('');
  const [search, setSearch] = useState('');
  const [size, setSize] = useState<LockerSize | ''>('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const { data: locations, loading, error, reload } = useAsync(
    () =>
      locationsService.list({
        campus: campus || undefined,
        search: search || undefined,
        size: size || undefined,
        onlyAvailable: onlyAvailable || undefined,
      }),
    [campus, search, size, onlyAvailable],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Explorar lockers"
        subtitle="Encontre guarda-volumes disponíveis no campus"
        actions={
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 ${
                viewMode === 'list' ? 'bg-brand-600 text-white' : 'text-slate-600'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 ${
                viewMode === 'map' ? 'bg-brand-600 text-white' : 'text-slate-600'
              }`}
            >
              <Map className="h-3.5 w-3.5" /> Mapa
            </button>
          </div>
        }
      />

      {/* Filtros da casca */}
      <div className="card space-y-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar prédio, bloco ou laboratório..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select className="input" value={campus} onChange={(e) => setCampus(e.target.value)}>
            <option value="">Todos os campi</option>
            {CAMPUS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="input" value={size} onChange={(e) => setSize(e.target.value as LockerSize | '')}>
            <option value="">Qualquer tamanho</option>
            {LOCKER_SIZES.map((s) => (
              <option key={s} value={s}>
                {lockerSizeLabels[s]}
              </option>
            ))}
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Mostrar apenas pontos com vagas disponíveis
        </label>
      </div>

      <ErrorAlert message={error} onRetry={() => void reload()} />
      {loading && <Loading />}

      {!loading && viewMode === 'map' && (
        /* TODO [PLANO-FRONTEND]: substituir pelo componente interativo CampusVisualMap em SVG. */
        <div className="card space-y-3 border-brand-200 bg-brand-50/40">
          <p className="text-xs font-bold tracking-wider text-brand-700 uppercase">
            Visualização de Mapa do Campus (Casca MVP)
          </p>
          {(locations ?? []).map((loc) => (
            <div key={loc.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-xs">
              <div>
                <p className="text-sm font-semibold">{loc.name}</p>
                <p className="text-xs text-slate-500">
                  {loc.building} • {loc.availableCount} livres
                </p>
              </div>
              <Link to={`/app/locations/${loc.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                Ver ponto
              </Link>
            </div>
          ))}
        </div>
      )}

      {!loading && viewMode === 'list' && (
        <div className="space-y-3">
          {!locations?.length ? (
            <EmptyState title="Nenhum ponto encontrado" description="Tente ajustar os filtros de busca." />
          ) : (
            locations.map((loc) => (
              <div key={loc.id} className="card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-slate-900">{loc.name}</h2>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {loc.building} — {loc.block} ({loc.floor})
                    </p>
                  </div>
                  <Badge tone={loc.availableCount > 0 ? 'green' : 'gray'}>
                    {loc.availableCount > 0 ? `${loc.availableCount} disponíveis` : 'Lotado'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <span className="text-slate-600">
                    A partir de <strong className="text-slate-900">{formatCents(loc.startingDailyPriceCents)}</strong>/dia
                  </span>
                  <Link to={`/app/locations/${loc.id}`} className="btn-primary px-3 py-1.5 text-xs">
                    Ver detalhes
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
