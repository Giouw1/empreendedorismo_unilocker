import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, RefreshCw } from 'lucide-react';
import type { BadgeTone } from '../utils/formatters';

// Componentes base construídos sobre as classes do daisyUI (tema corporate).

const toneClasses: Record<BadgeTone, string> = {
  green: 'badge-success',
  yellow: 'badge-warning',
  red: 'badge-error',
  blue: 'badge-info',
  gray: 'badge-neutral',
  purple: 'badge-secondary',
};

export function Badge({ tone = 'gray', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge-soft badge-sm font-medium whitespace-nowrap ${toneClasses[tone]}`}>{children}</span>;
}

export function Loading({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-base-content/60">
      <span className="loading loading-spinner loading-sm" />
      {label}
    </div>
  );
}

export function ErrorAlert({ message, onRetry }: { message: string | null; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" className="alert alert-error alert-soft text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-ghost btn-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
        </button>
      )}
    </div>
  );
}

export function SuccessAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="alert alert-success alert-soft text-sm">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-box border border-dashed border-base-300 bg-base-100 p-8 text-center">
      <Inbox className="h-8 w-8 text-base-content/40" />
      <p className="font-semibold">{title}</p>
      {description && <p className="text-sm text-base-content/60">{description}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-base-content/60">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="stats w-full border border-base-300 bg-base-100 shadow-xs">
      <div className="stat px-4 py-3">
        <div className="stat-title text-xs whitespace-normal">{label}</div>
        <div className="stat-value text-2xl">{value}</div>
        {hint && <div className="stat-desc whitespace-normal">{hint}</div>}
      </div>
    </div>
  );
}

export function Spinner() {
  return <span className="loading loading-spinner loading-xs" />;
}
