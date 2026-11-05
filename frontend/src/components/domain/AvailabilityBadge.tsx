import React from 'react';

interface AvailabilityBadgeProps {
  availableCount: number;
  totalCount?: number;
  className?: string;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  availableCount,
  totalCount,
  className = '',
}) => {
  const isAvailable = availableCount > 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
        isAvailable
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-rose-50 text-rose-700 border border-rose-200'
      } ${className}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
        }`}
      />
      {isAvailable ? (
        <span>
          {availableCount} {availableCount === 1 ? 'livre' : 'livres'}
          {totalCount !== undefined ? ` de ${totalCount}` : ''}
        </span>
      ) : (
        <span>Esgotado</span>
      )}
    </span>
  );
};
