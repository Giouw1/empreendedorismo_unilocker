import { useState } from 'react';
import { List, Map, Search } from 'lucide-react';
import { locationsService } from '../../services/locations.service';
import { useAsync } from '../../hooks/useAsync';
import { CAMPUS_OPTIONS, LOCKER_SIZES, lockerSizeLabels } from '../../utils/formatters';
import type { LockerSize } from '../../types/api';
import { EmptyState, ErrorAlert, Loading, PageHeader } from '../../components/ui';
import { LocationCard } from '../../components/domain/LocationCard';
import { CampusVisualMap } from '../../components/domain/CampusVisualMap';

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
        subtitle="Encontre guarda-volumes disponíveis no campus da UFRJ"
        actions={
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-semibold shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-all ${
                viewMode === 'list' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-all ${
                viewMode === 'map' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="h-3.5 w-3.5" /> Mapa
            </button>
          </div>
        }
      />

      {/* Barra de Filtros */}
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
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Mostrar apenas pontos com vagas disponíveis
        </label>
      </div>

      <ErrorAlert message={error} onRetry={() => void reload()} />
      {loading && <Loading />}

      {!loading && viewMode === 'map' && (
        <div className="space-y-3">
          <CampusVisualMap locations={locations || []} />
        </div>
      )}

      {!loading && viewMode === 'list' && (
        <div className="space-y-3">
          {!locations?.length ? (
            <EmptyState
              title="Nenhum ponto encontrado"
              description="Tente ajustar os filtros de busca ou escolher outro campus."
            />
          ) : (
            locations.map((loc) => <LocationCard key={loc.id} location={loc} />)
          )}
        </div>
      )}
    </div>
  );
}
