import React from 'react';
import type { ReservationDto } from '../../types/api';
import { formatCents, periodLabels, formatDate } from '../../utils/formatters';
import { MapPin, Calendar, ArrowRight, KeyRound, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReservationCardProps {
  reservation: ReservationDto;
  className?: string;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({ reservation, className = '' }) => {
  const isActive = reservation.status === 'Active';
  const isCompleted = reservation.status === 'Completed';
  const isExpired = reservation.status === 'Expired';
  const isCancelled = reservation.status === 'Cancelled';

  const getStatusBadge = () => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ativo
        </span>
      );
    }
    if (isCompleted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          Finalizado
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          Vencido
        </span>
      );
    }
    if (isCancelled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
          Cancelado
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
        isActive
          ? 'border-emerald-300 ring-2 ring-emerald-500/10'
          : 'border-slate-200/90'
      } ${className}`}
    >
      <div className="p-4 space-y-3">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-100 text-brand-700 font-extrabold text-sm">
              {reservation.lockerCode || 'L'}
            </span>
            <div>
              <span className="text-xs font-semibold text-slate-900 block leading-tight">
                Locker {reservation.lockerCode}
              </span>
              <span className="text-[11px] text-slate-500">
                {periodLabels[reservation.period]} • {formatCents(reservation.totalPriceCents)}
              </span>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Localização */}
        <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 border border-slate-100">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate">{reservation.locationName}</span>
          </div>
          <div className="text-slate-500 pl-5">
            {reservation.buildingSummary}
          </div>
        </div>

        {/* Vigência */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Válido até:
          </span>
          <span className="font-medium text-slate-800">
            {formatDate(reservation.endTime)}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
        <Link
          to={`/app/reservations/${reservation.id}/locate`}
          className="text-xs font-medium text-slate-600 hover:text-brand-600 flex items-center gap-1 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Como chegar</span>
        </Link>

        {isActive ? (
          <Link
            to={`/app/reservations/${reservation.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Acessar Locker</span>
          </Link>
        ) : (
          <Link
            to={`/app/reservations/${reservation.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            <span>Ver detalhes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
