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
          <div className="join">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`btn join-item btn-sm ${viewMode === 'list' ? 'btn-primary' : ''}`}
            >
              <List className="h-3.5 w-3.5" /> Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`btn join-item btn-sm ${viewMode === 'map' ? 'btn-primary' : ''}`}
            >
              <Map className="h-3.5 w-3.5" /> Mapa
            </button>
          </div>
        }
      />

      {/* Barra de Filtros */}
      <div className="panel grid gap-2.5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
        <label className="input w-full">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <input
            className="min-w-0 grow"
            placeholder="Buscar prédio, bloco ou laboratório..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2 md:contents">
          <select className="select w-full" value={campus} onChange={(e) => setCampus(e.target.value)}>
            <option value="">Todos os campi</option>
            {CAMPUS_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="select w-full" value={size} onChange={(e) => setSize(e.target.value as LockerSize | '')}>
            <option value="">Qualquer tamanho</option>
            {LOCKER_SIZES.map((s) => (
              <option key={s} value={s}>
                {lockerSizeLabels[s]}
              </option>
            ))}
          </select>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-base-content/70 md:text-sm">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="checkbox checkbox-sm checkbox-primary"
          />
          Só com vagas
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
        <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
          {!locations?.length ? (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState title="Nenhum ponto encontrado" description="Tente ajustar os filtros de busca ou escolher outro campus." />
            </div>
          ) : (
            locations.map((loc) => <LocationCard key={loc.id} location={loc} />)
          )}
        </div>
      )}
    </div>
  );
}
