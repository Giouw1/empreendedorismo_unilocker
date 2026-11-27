import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Clock, Handshake, MapPin } from 'lucide-react';
import type { LocationSummaryDto } from '../../types/api';
import { formatCents } from '../../utils/formatters';
import { AvailabilityBadge } from './AvailabilityBadge';

export function LocationCard({ location, className = '' }: { location: LocationSummaryDto; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const coverUrl = location.photoUrls?.[0];

  return (
    <article className={`group flex flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-xs transition hover:shadow-md ${className}`}>
      <Link to={`/app/locations/${location.id}`} className="relative block aspect-[16/9] overflow-hidden bg-base-200" tabIndex={-1}>
        {coverUrl && !imgError ? (
          <img
            src={coverUrl}
            alt={location.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-base-content/40">
            <Building2 className="mb-1 h-12 w-12" strokeWidth={1.5} />
            <span className="text-xs font-medium">{location.campus}</span>
          </div>
        )}
        <span className="absolute top-3 right-3">
          <AvailabilityBadge availableCount={location.availableCount} />
        </span>
        <span className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-field bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{location.campus}</span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-base leading-snug font-semibold group-hover:text-primary">
            <Link to={`/app/locations/${location.id}`}>{location.name}</Link>
          </h3>
          <p className="line-clamp-1 text-xs text-base-content/60">
            {[location.building, location.block, location.floor].filter(Boolean).join(' · ')}
          </p>
          {location.openingHours && (
            <p className="flex items-center gap-1 text-xs text-base-content/60">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{location.openingHours}</span>
            </p>
          )}
          <p className="flex items-center gap-1 text-xs text-base-content/60">
            <Handshake className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{location.partnerName}</span>
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-base-300 pt-3">
          <div className="min-w-0">
            <span className="block text-[11px] font-medium text-base-content/50">A partir de</span>
            <span className="text-sm font-semibold tabular-nums">
              {formatCents(location.startingDailyPriceCents)}
              <span className="text-xs font-normal text-base-content/60">/dia</span>
            </span>
          </div>
          <Link to={`/app/locations/${location.id}`} className="btn btn-primary btn-sm shrink-0">
            Ver lockers <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
