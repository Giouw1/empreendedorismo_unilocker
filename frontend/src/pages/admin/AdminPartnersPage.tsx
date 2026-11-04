import { useState } from 'react';
import { adminService } from '../../services/admin.service';
import { useAction, useAsync } from '../../hooks/useAsync';
import { formatDate, partnerStatusLabels, partnerTone } from '../../utils/formatters';
import { Badge, EmptyState, ErrorAlert, Loading, PageHeader, Spinner } from '../../components/ui';

export default function AdminPartnersPage() {
  const [includeAll, setIncludeAll] = useState(true);
  const { data: partners, loading, error, reload } = useAsync(
    () => adminService.listPartners(includeAll),
    [includeAll],
  );
  const action = useAction();

  const handleReview = async (id: string, approved: boolean) => {
    const res = await action.run(() => adminService.reviewPartner(id, { approved }));
    if (res) void reload();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestão de parceiros (ofertadores)"
        subtitle="Aprovação institucional de laboratórios, centros acadêmicos e estabelecimentos"
        actions={
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={includeAll}
              onChange={(e) => setIncludeAll(e.target.checked)}
            />
            Mostrar também aprovados/recusados
          </label>
        }
      />

      <ErrorAlert message={error ?? action.error} onRetry={() => void reload()} />
      {loading && <Loading />}
      {!loading && !partners?.length && <EmptyState title="Nenhuma solicitação pendente" />}

      {!!partners?.length && (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Organização</th>
                <th>Tipo</th>
                <th>Responsável</th>
                <th>Contato</th>
                <th>Solicitado em</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold">{p.organizationName}</td>
                  <td>{p.organizationType}</td>
                  <td>{p.responsibleName}</td>
                  <td>{p.contactPhone}</td>
                  <td>{formatDate(p.createdAt)}</td>
                  <td>
                    <Badge tone={partnerTone(p.status)}>{partnerStatusLabels[p.status]}</Badge>
                  </td>
                  <td>
                    <div className="flex gap-1.5">
                      {p.status !== 'APPROVED' && (
                        <button
                          type="button"
                          disabled={action.pending}
                          onClick={() => void handleReview(p.id, true)}
                          className="btn-success px-2.5 py-1 text-xs"
                        >
                          {action.pending && <Spinner />} Aprovar
                        </button>
                      )}
                      {p.status !== 'REJECTED' && (
                        <button
                          type="button"
                          disabled={action.pending}
                          onClick={() => void handleReview(p.id, false)}
                          className="btn-danger px-2.5 py-1 text-xs"
                        >
                          Recusar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
