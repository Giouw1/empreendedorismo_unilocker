import { useState, type ReactNode } from 'react';
import { AlertTriangle, Check, CheckCircle2, Copy, Inbox, RefreshCw } from 'lucide-react';
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
      <span className="min-w-0">{message}</span>
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
      <span className="min-w-0">{message}</span>
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

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-base-content/60">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-box border border-base-300 bg-base-100 p-4 shadow-xs">
      {icon && <span className="icon-chip">{icon}</span>}
      <div className="min-w-0">
        <div className="text-xs font-medium text-base-content/60">{label}</div>
        <div className="truncate text-xl font-semibold tabular-nums sm:text-2xl">{value}</div>
        {hint && <div className="text-xs text-base-content/50">{hint}</div>}
      </div>
    </div>
  );
}

/** ID de reserva compacto, com botão para copiar o ID completo. */
export function CopyId({ id, label = 'ID' }: { id: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
    } catch {
      const area = document.createElement('textarea');
      area.value = id;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void copy();
      }}
      title={`Copiar ${label}: ${id}`}
      className="inline-flex max-w-full items-center gap-1 rounded-field border border-base-300 bg-base-200/60 px-1.5 py-0.5 font-mono text-[11px] text-base-content/70 hover:border-primary/50 hover:text-primary"
    >
      <span className="truncate">{label} {id.length > 14 ? `${id.slice(0, 8)}…` : id}</span>
      {copied ? <Check className="h-3 w-3 shrink-0 text-success" /> : <Copy className="h-3 w-3 shrink-0" />}
    </button>
  );
}

export function Spinner() {
  return <span className="loading loading-spinner loading-xs" />;
}
