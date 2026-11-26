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
    <span className={`badge badge-sm font-medium ${isAvailable ? 'badge-success' : 'badge-error'} ${className}`}>
      {isAvailable ? (
        <>
          {availableCount} {availableCount === 1 ? 'livre' : 'livres'}
          {totalCount !== undefined ? ` de ${totalCount}` : ''}
        </>
      ) : (
        'Esgotado'
      )}
    </span>
  );
};
