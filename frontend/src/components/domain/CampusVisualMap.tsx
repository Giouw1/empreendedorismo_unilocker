import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L, { type LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight, Building2, Clock, X } from 'lucide-react';
import type { LocationSummaryDto } from '../../types/api';
import { formatCents } from '../../utils/formatters';
import { AvailabilityBadge } from './AvailabilityBadge';

/** Atalhos por campus; o enquadramento é calculado a partir dos pontos de cada um. */
const CAMPUS_AREAS: { label: string; match: string }[] = [
  { label: 'Fundão', match: 'Fundão' },
  { label: 'Praia Vermelha', match: 'Praia Vermelha' },
  { label: 'Centro', match: 'Centro' },
];

/** Enquadra os pontos com folga mínima (~130 m), para um ponto isolado não virar zoom máximo. */
function boundsOf(points: LocationSummaryDto[]): LatLngBoundsExpression | null {
  if (!points.length) return null;
  const b = L.latLngBounds(points.map((l) => [l.latitude, l.longitude] as [number, number]));
  const pad = 0.0012;
  return [
    [b.getSouth() - pad, b.getWest() - pad],
    [b.getNorth() + pad, b.getEast() + pad],
  ];
}

/** Marcador em formato de "pílula" com o preço diário, verde quando há vagas. */
function priceIcon(location: LocationSummaryDto, selected: boolean) {
  const available = location.availableCount > 0;
  const price = formatCents(location.startingDailyPriceCents).replace(/,00$/, '');
  return L.divIcon({
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `<span class="ul-pin ${available ? 'ul-pin--on' : 'ul-pin--off'} ${selected ? 'ul-pin--selected' : ''}">${price}</span>`,
  });
}

function FitTo({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.flyToBounds(bounds, { padding: [24, 48], maxZoom: 17, duration: 0.6 });
  }, [map, bounds]);
  return null;
}

/** Mapa real (OpenStreetMap) dos pontos de locker, com cartão do ponto selecionado. */
export function CampusVisualMap({ locations, className = '' }: { locations: LocationSummaryDto[]; className?: string }) {
  const [selected, setSelected] = useState<LocationSummaryDto | null>(null);
  // Abre no campus com mais pontos: em "Todos", campi a quilômetros de distância amontoam os marcadores.
  const [area, setArea] = useState<string>(() => {
    const counts = CAMPUS_AREAS.map((a) => ({ label: a.label, n: locations.filter((l) => l.campus.includes(a.match)).length }));
    const best = counts.sort((a, b) => b.n - a.n)[0];
    return best && best.n > 0 ? best.label : 'all';
  });
  const [imgError, setImgError] = useState(false);

  const allBounds = useMemo(() => boundsOf(locations), [locations]);
  const areas = CAMPUS_AREAS.filter((a) => locations.some((l) => l.campus.includes(a.match)));
  const target = useMemo(() => {
    const match = CAMPUS_AREAS.find((a) => a.label === area)?.match;
    return (match && boundsOf(locations.filter((l) => l.campus.includes(match)))) || allBounds;
  }, [area, locations, allBounds]);

  useEffect(() => setImgError(false), [selected]);

  if (!locations.length) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Atalhos por campus */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ label: 'all', text: 'Todos' }, ...areas.map((a) => ({ label: a.label, text: a.label }))].map(({ label, text }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setArea(label);
              setSelected(null);
            }}
            className={`btn btn-sm shrink-0 ${area === label ? 'btn-neutral' : 'btn-ghost border-base-300 bg-base-100'}`}
          >
            {text}
          </button>
        ))}
      </div>

      <div className="relative isolate overflow-hidden rounded-box border border-base-300 shadow-xs">
        <MapContainer
          bounds={target ?? undefined}
          className="h-[60vh] min-h-80 w-full md:h-[560px]"
          scrollWheelZoom
          zoomControl={false}
          attributionControl
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />
          <FitTo bounds={target} />
          {locations.map((l) => (
            <Marker
              key={l.id}
              position={[l.latitude, l.longitude]}
              icon={priceIcon(l, selected?.id === l.id)}
              zIndexOffset={selected?.id === l.id ? 1000 : 0}
              eventHandlers={{ click: () => setSelected(l) }}
              title={l.name}
            />
          ))}
        </MapContainer>

        {/* Cartão do ponto selecionado */}
        {selected ? (
          <div className="absolute inset-x-3 top-3 z-[500] md:top-auto md:right-auto md:bottom-3 md:w-96">
            <div className="flex gap-3 rounded-box border border-base-300 bg-base-100 p-3 shadow-lg">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-field bg-base-200">
                {selected.photoUrls[0] && !imgError ? (
                  <img src={selected.photoUrls[0]} alt="" onError={() => setImgError(true)} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-6 w-6 text-base-content/40" />
                )}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm leading-snug font-semibold">{selected.name}</p>
                  <button type="button" onClick={() => setSelected(null)} className="btn btn-ghost btn-xs btn-square -mt-1 -mr-1 shrink-0" aria-label="Fechar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {selected.openingHours && (
                  <p className="flex items-center gap-1 text-xs text-base-content/60">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{selected.openingHours}</span>
                  </p>
                )}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <AvailabilityBadge availableCount={selected.availableCount} />
                    <span className="truncate text-xs text-base-content/60">
                      {formatCents(selected.startingDailyPriceCents)}/dia
                    </span>
                  </span>
                  <Link to={`/app/locations/${selected.id}`} className="btn btn-primary btn-xs shrink-0">
                    Ver <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="pointer-events-none absolute inset-x-0 top-3 z-[500] md:top-auto md:bottom-3 mx-auto w-fit rounded-full bg-base-100/90 px-3 py-1 text-xs text-base-content/70 shadow">
            Toque num preço para ver o ponto
          </p>
        )}
      </div>
    </div>
  );
}
