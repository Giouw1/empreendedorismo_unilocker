import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supportService } from '../../services/support.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import {
  formatDateTime,
  TICKET_CATEGORIES,
  ticketCategoryLabels,
  ticketStatusLabels,
  ticketTone,
} from '../../utils/formatters';
import type { TicketCategory } from '../../types/api';
import { Badge, EmptyState, ErrorAlert, Loading, PageHeader, Spinner, SuccessAlert } from '../../components/ui';

export default function SupportPage() {
  const [searchParams] = useSearchParams();
  const initialReservationId = searchParams.get('reservationId') ?? '';

  const { data: tickets, loading, error, reload } = useAsync(() => supportService.listMine(), []);
  const { pending, error: submitError, run } = useAction();

  const [category, setCategory] = useState<TicketCategory>('LOCKER_WONT_OPEN');
  const [reservationId, setReservationId] = useState(initialReservationId);
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    const created = await run(() =>
      supportService.createTicket({
        category,
        description,
        reservationId: reservationId.trim() || undefined,
      }),
    );
    if (created) {
      setDescription('');
      setSuccessMsg('Chamado registrado! A equipe administrativa foi notificada.');
      void reload();
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Ajuda e suporte" subtitle="Relate problemas com compartimentos ou aluguéis" />

      <form onSubmit={(e) => void handleSubmit(e)} className="card space-y-3">
        <h2 className="text-sm font-bold">Abrir novo chamado</h2>
        <ErrorAlert message={submitError} />
        <SuccessAlert message={successMsg} />

        <div>
          <label className="label">Categoria</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
          >
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {ticketCategoryLabels[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">ID da reserva (opcional)</label>
          <input
            className="input"
            placeholder="Ex.: res-cintra-active"
            value={reservationId}
            onChange={(e) => setReservationId(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Descrição do ocorrido</label>
          <textarea
            required
            rows={3}
            className="input"
            placeholder="Descreva o que aconteceu..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button type="submit" disabled={pending} className="btn-primary w-full text-xs">
          {pending && <Spinner />} Enviar solicitação
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-800">Meus chamados</h2>
        <ErrorAlert message={error} onRetry={() => void reload()} />
        {loading && <Loading />}
        {!loading && !tickets?.length && <EmptyState title="Nenhum chamado aberto" />}
        {tickets?.map((tk) => (
          <div key={tk.id} className="card space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <strong>{ticketCategoryLabels[tk.category]}</strong>
              <Badge tone={ticketTone(tk.status)}>{ticketStatusLabels[tk.status]}</Badge>
            </div>
            <p className="text-slate-600">{tk.description}</p>
            {tk.adminNotes && (
              <p className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <strong>Resposta da administração:</strong> {tk.adminNotes}
              </p>
            )}
            <p className="text-[11px] text-slate-400">Aberto em {formatDateTime(tk.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
