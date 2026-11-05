import React from 'react';
import type { LockerStatus } from '../../types/api';
import { lockerStatusLabels } from '../../utils/formatters';

interface LockerStatusBadgeProps {
  status: LockerStatus;
  className?: string;
}

export const LockerStatusBadge: React.FC<LockerStatusBadgeProps> = ({ status, className = '' }) => {
  const configs: Record<LockerStatus, { bg: string; text: string; border: string; dot: string }> = {
    AVAILABLE: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    OCCUPIED: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
    },
    MAINTENANCE: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    BLOCKED: {
      bg: 'bg-zinc-100',
      text: 'text-zinc-600',
      border: 'border-zinc-300',
      dot: 'bg-zinc-400',
    },
  };

  const config = configs[status] || configs.BLOCKED;
  const label = lockerStatusLabels[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
};
