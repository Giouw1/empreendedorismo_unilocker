import React from 'react';
import type { LockerDto, LockerSize } from '../../types/api';
import { LockerStatusBadge } from './LockerStatusBadge';
import { lockerSizeLabels } from '../../utils/formatters';
import { Lock, Unlock, Wrench, ShieldAlert } from 'lucide-react';

interface LockerCardProps {
  locker: LockerDto;
  selected?: boolean;
  onSelect?: (locker: LockerDto) => void;
  actionButton?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const LockerCard: React.FC<LockerCardProps> = ({
  locker,
  selected = false,
  onSelect,
  actionButton,
  disabled = false,
  className = '',
}) => {
  const isAvailable = locker.status === 'AVAILABLE';
  const isOccupied = locker.status === 'OCCUPIED';
  const isMaintenance = locker.status === 'MAINTENANCE';
  const isBlocked = locker.status === 'BLOCKED';

  const getSizeIcon = (size: LockerSize) => {
    switch (size) {
      case 'SMALL':
        return 'P';
      case 'MEDIUM':
        return 'M';
      case 'LARGE':
        return 'G';
    }
  };

  return (
    <div
      onClick={() => {
        if (!disabled && isAvailable && onSelect) {
          onSelect(locker);
        }
      }}
      className={`relative rounded-box border transition-all duration-200 p-4 flex flex-col justify-between ${
        selected
          ? 'border-brand-600 bg-brand-50/40 shadow-md ring-2 ring-brand-500/20'
          : isAvailable
          ? 'border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm cursor-pointer'
          : isOccupied
          ? 'border-slate-200 bg-slate-50/70 text-slate-500 cursor-not-allowed'
          : 'border-amber-200 bg-amber-50/40 text-amber-900 cursor-not-allowed'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="flex justify-end mb-3">
        <LockerStatusBadge status={locker.status} />
      </div>

      {/* Identificação Central */}
      <div className="py-2 text-center">
        <div className="inline-flex items-center justify-center h-11 min-w-12 px-2 whitespace-nowrap rounded-field bg-base-200 font-bold text-lg mb-2 border border-base-300">
          {locker.code}
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] leading-4 text-center">
            {getSizeIcon(locker.size)}
          </span>
          <span>{lockerSizeLabels[locker.size]}</span>
        </div>
      </div>

      {/* Mecanismo de Fechadura / Ação */}
      <div className="pt-3 border-t border-base-300 flex flex-wrap items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          {isAvailable && <Unlock className="w-3.5 h-3.5 text-emerald-500" />}
          {isOccupied && <Lock className="w-3.5 h-3.5 text-blue-500" />}
          {isMaintenance && <Wrench className="w-3.5 h-3.5 text-amber-500" />}
          {isBlocked && <ShieldAlert className="w-3.5 h-3.5 text-red-500" />}
          <span className="text-[11px]">
            {isAvailable ? 'Liberado' : isOccupied ? 'Em uso' : 'Bloqueado'}
          </span>
        </div>

        {actionButton ? (
          <div>{actionButton}</div>
        ) : onSelect && isAvailable ? (
          <span
            className={`px-2 py-1 rounded-field font-semibold text-[11px] ${
              selected
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-600'
            }`}
          >
            {selected ? 'Escolhido' : 'Escolher'}
          </span>
        ) : null}
      </div>
    </div>
  );
};
