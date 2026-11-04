import { useState } from 'react';
import { adminService } from '../../services/admin.service';
import { useAsync } from '../../hooks/useAsync';
import { formatDate, partnerStatusLabels, partnerTone, roleLabels } from '../../utils/formatters';
import { Badge, EmptyState, ErrorAlert, Loading, PageHeader } from '../../components/ui';

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const { data: users, loading, error, reload } = useAsync(
    () => adminService.listUsers(search || undefined),
    [search],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Usuários da plataforma"
        subtitle="Contas cadastradas e vínculos universitários"
        actions={
          <input
            className="input w-64"
            placeholder="Buscar nome, e-mail ou vínculo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />

      <ErrorAlert message={error} onRetry={() => void reload()} />
      {loading && <Loading />}
      {!loading && !users?.length && <EmptyState title="Nenhum usuário encontrado" />}

      {!!users?.length && (
        <div className="card overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Vínculo UFRJ</th>
                <th>Perfis</th>
                <th>Parceria</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-semibold">{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.universityAffiliation}</td>
                  <td className="space-x-1">
                    {u.roles.map((r) => (
                      <Badge key={r} tone="blue">
                        {roleLabels[r]}
                      </Badge>
                    ))}
                  </td>
                  <td>
                    {u.partnerStatus ? (
                      <Badge tone={partnerTone(u.partnerStatus)}>{partnerStatusLabels[u.partnerStatus]}</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
