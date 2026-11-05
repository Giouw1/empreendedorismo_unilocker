import React from 'react';
import type { RentalPeriod, LockerSize } from '../../types/api';
import { formatCents, periodLabels, lockerSizeLabels, formatDate } from '../../utils/formatters';
import { Calendar, Tag } from 'lucide-react';

interface PriceSummaryProps {
  period: RentalPeriod;
  size: LockerSize;
  amountCents: number;
  startDate?: string | Date;
  endDate?: string | Date;
  locationName?: string;
  lockerCode?: string;
  className?: string;
}

export const PriceSummary: React.FC<PriceSummaryProps> = ({
  period,
  size,
  amountCents,
  startDate,
  endDate,
  locationName,
  lockerCode,
  className = '',
}) => {
  const getDurationLabel = (p: RentalPeriod) => {
    switch (p) {
      case 'DAILY':
        return '24 horas de acesso irrestrito';
      case 'WEEKLY':
        return '7 dias corridos de acesso';
      case 'MONTHLY':
        return '30 dias corridos de acesso';
    }
  };

  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <Tag className="w-4 h-4 text-brand-600" /> Resumo da Contratação
        </h4>
      </div>

      <div className="space-y-2 text-sm">
        {locationName && (
          <div className="flex justify-between text-slate-600">
            <span>Ponto:</span>
            <span className="font-medium text-slate-800 text-right">{locationName}</span>
          </div>
        )}
        {lockerCode && (
          <div className="flex justify-between text-slate-600">
            <span>Compartimento:</span>
            <span className="font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded text-xs">
              {lockerCode}
            </span>
          </div>
        )}
        <div className="flex justify-between text-slate-600">
          <span>Tamanho:</span>
          <span className="font-medium text-slate-800">{lockerSizeLabels[size]}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Período:</span>
          <span className="font-medium text-slate-800">{periodLabels[period]}</span>
        </div>
        <div className="flex justify-between text-slate-500 text-xs">
          <span>Validade:</span>
          <span>{getDurationLabel(period)}</span>
        </div>
        {startDate && endDate && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Vigência:
            </span>
            <span>
              {formatDate(typeof startDate === 'string' ? startDate : startDate.toISOString())} até{' '}
              {formatDate(typeof endDate === 'string' ? endDate : endDate.toISOString())}
            </span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
        <div>
          <span className="text-xs text-slate-500 block">Total da contratação</span>
          <span className="text-2xl font-extrabold text-slate-900">
            {formatCents(amountCents)}
          </span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Acerto direto no espaço
        </span>
      </div>
    </div>
  );
};
