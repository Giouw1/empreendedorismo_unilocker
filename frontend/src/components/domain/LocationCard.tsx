import React, { useState } from 'react';
import type { LocationSummaryDto } from '../../types/api';
import { AvailabilityBadge } from './AvailabilityBadge';
import { formatCents } from '../../utils/formatters';
import { MapPin, Clock, ArrowRight, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LocationCardProps {
  location: LocationSummaryDto;
  className?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location, className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const coverUrl = location.photoUrls?.[0];

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group ${className}`}
    >
      {/* Imagem do Ponto ou Placeholder Cinza Neutro */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {coverUrl && !imgError ? (
          <img
            src={coverUrl}
            alt={location.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 text-slate-400">
            <Building2 className="w-12 h-12 stroke-[1.5] mb-1" />
            <span className="text-xs font-medium text-slate-500">{location.campus}</span>
          </div>
        )}

        <div className="absolute top-3 right-3">
          <AvailabilityBadge availableCount={location.availableCount} />
        </div>

        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-400" />
          <span>{location.campus}</span>
        </div>
      </div>

      {/* Conteúdo Informativo */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-brand-600 transition-colors">
            {location.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{location.building}</span>
            <span>•</span>
            <span>{location.block}</span>
            <span>•</span>
            <span>{location.floor}</span>
          </p>
          {location.openingHours && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{location.openingHours}</span>
            </p>
          )}
        </div>

        {/* Rodapé com Preço e Ação */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">A partir de</span>
            <div className="text-sm font-bold text-slate-900">
              {formatCents(location.startingDailyPriceCents)}
              <span className="text-xs font-normal text-slate-500">/dia</span>
            </div>
          </div>

          <Link
            to={`/app/locations/${location.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 active:scale-95 transition-all shadow-sm"
          >
            <span>Ver lockers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
