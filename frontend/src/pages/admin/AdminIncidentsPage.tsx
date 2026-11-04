import { useState } from 'react';
import { adminService } from '../../services/admin.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import {
  formatDateTime,
  TICKET_STATUSES,
  ticketCategoryLabels,
  ticketPriorityLabels,
  ticketStatusLabels,
  ticketTone,
} from '../../utils/formatters';
import type { TicketStatus } from '../../types/api';
import { Badge, EmptyState, ErrorAlert, Loading, PageHeader, Spinner } from '../../components/ui';

export default function AdminIncidentsPage() {
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('');
  const { data: incidents, loading, error, reload } = useAsync(
    () => adminService.listIncidents(filterStatus || undefined),
    [filterStatus],
  );
  const action = useAction();

  const [notesByTicket, setNotesByTicket] = useState<Record<string, string>>({});
  const [releaseByTicket, setReleaseByTicket] = useState<Record<string, boolean>>({});

  const handleResolve = async (ticketId: string, status: TicketStatus) => {
    const updated = await action.run(() =>
      adminService.resolveIncident(ticketId, {
        status,
        adminNotes: notesByTicket[ticketId],
        releaseLocker: releaseByTicket[ticketId],
      }),
    );
    if (updated) void reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Central de ocorrências e suporte"
        subtitle="Atendimento a usuários e liberação controlada de compartimentos retidos"
        actions={
          <select
            className="input w-48"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TicketStatus | '')}
          >
            <option value="">Todos os status</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ticketStatusLabels[s]}
              </option>
            ))}
          </select>
        }
      />

      <ErrorAlert message={error ?? action.error} onRetry={() => void reload()} />
      {loading && <Loading />}
      {!loading && !incidents?.length && <EmptyState title="Nenhuma ocorrência encontrada" />}

      <div className="space-y-3">
        {incidents?.map((tk) => (
          <div key={tk.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone={tk.priority === 'HIGH' ? 'red' : 'yellow'}>
                  Prioridade {ticketPriorityLabels[tk.priority]}
                </Badge>
                <strong>{ticketCategoryLabels[tk.category]}</strong>
                <span className="text-xs text-slate-500">
                  • {tk.userName} {tk.lockerCode ? `(Locker ${tk.lockerCode})` : ''}
                </span>
              </div>
              <Badge tone={ticketTone(tk.status)}>{ticketStatusLabels[tk.status]}</Badge>
            </div>

            <p className="text-sm text-slate-700">{tk.description}</p>
            <p className="text-xs text-slate-400">Aberto em {formatDateTime(tk.createdAt)}</p>

            <div className="grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2">
              <input
                className="input"
                placeholder="Resposta / anotação administrativa..."
                value={notesByTicket[tk.id] ?? tk.adminNotes ?? ''}
                onChange={(e) =>
                  setNotesByTicket((prev) => ({ ...prev, [tk.id]: e.target.value }))
                }
              />
              <div className="flex flex-wrap items-center justify-end gap-2">
                {tk.reservationId && (
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={!!releaseByTicket[tk.id]}
                      onChange={(e) =>
                        setReleaseByTicket((prev) => ({ ...prev, [tk.id]: e.target.checked }))
                      }
                    />
                    Liberar locker após vistoria
                  </label>
                )}
                <button
                  type="button"
                  disabled={action.pending}
                  onClick={() => void handleResolve(tk.id, 'IN_PROGRESS')}
                  className="btn-secondary px-2.5 py-1.5 text-xs"
                >
                  Em atendimento
                </button>
                <button
                  type="button"
                  disabled={action.pending}
                  onClick={() => void handleResolve(tk.id, 'RESOLVED')}
                  className="btn-success px-2.5 py-1.5 text-xs"
                >
                  {action.pending && <Spinner />} Marcar resolvido
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
