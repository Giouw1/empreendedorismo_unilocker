import React from 'react';
import type { LockerStatus } from '../../types/api';
import { lockerStatusLabels } from '../../utils/formatters';

interface LockerStatusBadgeProps {
  status: LockerStatus;
  className?: string;
}

const statusClasses: Record<LockerStatus, string> = {
  AVAILABLE: 'badge-success',
  OCCUPIED: 'badge-info',
  MAINTENANCE: 'badge-warning',
  BLOCKED: 'badge-neutral',
};

export const LockerStatusBadge: React.FC<LockerStatusBadgeProps> = ({ status, className = '' }) => {
  const label = lockerStatusLabels[status] || status;

  return (
    <span className={`badge badge-soft badge-sm font-medium ${statusClasses[status] ?? statusClasses.BLOCKED} ${className}`}>
      {label}
    </span>
  );
};
