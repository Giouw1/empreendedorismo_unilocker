import type { LockerSize, RentalPeriod } from '../../types/api';
import { formatCents, lockerSizeLabels, periodLabels } from '../../utils/formatters';
import { Tag } from 'lucide-react';

interface PriceSummaryProps {
  period: RentalPeriod;
  size: LockerSize;
  amountCents: number;
  locationName?: string;
  lockerCode?: string;
  className?: string;
}

const durationLabels: Record<RentalPeriod, string> = {
  DAILY: '24 horas após a confirmação',
  WEEKLY: '7 dias após a confirmação',
  MONTHLY: '30 dias após a confirmação',
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-base-content/60">{label}</span>
      <span className="min-w-0 text-right font-medium">{children}</span>
    </div>
  );
}

export function PriceSummary({ period, size, amountCents, locationName, lockerCode, className = '' }: PriceSummaryProps) {
  return (
    <section className={`panel space-y-3 ${className}`}>
      <h2 className="section-title border-b border-base-300 pb-3">
        <Tag className="h-4 w-4 text-primary" /> Resumo
      </h2>
      <div className="space-y-2 text-sm">
        {locationName && <Row label="Ponto">{locationName}</Row>}
        <Row label="Compartimento">{lockerCode ? <span className="badge badge-neutral badge-sm">{lockerCode}</span> : 'Escolhido automaticamente'}</Row>
        <Row label="Tamanho">{lockerSizeLabels[size]}</Row>
        <Row label="Período">{periodLabels[period]}</Row>
        <Row label="Validade">
          <span className="text-xs font-normal text-base-content/60">{durationLabels[period]}</span>
        </Row>
      </div>
      <div className="flex items-end justify-between gap-3 border-t border-base-300 pt-3">
        <div>
          <span className="block text-xs text-base-content/60">Total</span>
          <span className="text-2xl font-bold tabular-nums">{formatCents(amountCents)}</span>
        </div>
        <span className="text-right text-xs text-base-content/60">Pago no local</span>
      </div>
    </section>
  );
}
