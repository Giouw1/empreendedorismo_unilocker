import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { useAction } from '../../hooks/useAsync';
import { partnerStatusLabels, partnerTone, roleLabels } from '../../utils/formatters';
import { Badge, ErrorAlert, PageHeader, Spinner, SuccessAlert } from '../../components/ui';

export default function ProfilePage() {
  const { user, refreshUser, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const { pending, error, run } = useAction();

  const [name, setName] = useState(user?.name ?? '');
  const [affiliation, setAffiliation] = useState(user?.universityAffiliation ?? '');
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const updated = await run(() =>
      authService.updateMe({ name, universityAffiliation: affiliation }),
    );
    if (updated) {
      await refreshUser();
      setSaved(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Meu perfil" subtitle={user.email} />

      <div className="card space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase">Perfis ativos</p>
        <div className="flex flex-wrap gap-1.5">
          {user.roles.map((r) => (
            <Badge key={r} tone="blue">
              {roleLabels[r]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Alternador de Área (Parceiro / Admin) */}
      <div className="card space-y-3 border-amber-200 bg-amber-50/40">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Building2 className="h-4 w-4 text-amber-600" /> Área do Ofertador (Parceiro)
        </div>
        {hasRole('PARTNER') ? (
          <Link to="/partner/dashboard" className="btn-primary w-full text-xs">
            Acessar Painel do Parceiro
          </Link>
        ) : user.partnerStatus === 'PENDING' ? (
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Sua solicitação de parceria está em análise.</span>
            <Badge tone={partnerTone('PENDING')}>{partnerStatusLabels.PENDING}</Badge>
          </div>
        ) : (
          <div className="space-y-2 text-xs text-slate-600">
            <p>Possui espaço em laboratório, centro acadêmico ou cantina na UFRJ? Disponibilize lockers e gere receita.</p>
            <Link to="/partner/apply" className="btn-secondary w-full text-xs">
              Quero ser um Ofertador
            </Link>
          </div>
        )}
      </div>

      {hasRole('ADMIN') && (
        <Link to="/admin/dashboard" className="btn-secondary w-full text-xs">
          <Shield className="h-4 w-4 text-brand-600" /> Abrir Painel Administrativo Web
        </Link>
      )}

      <form onSubmit={(e) => void handleSave(e)} className="card space-y-3">
        <h2 className="text-sm font-bold">Dados cadastrais</h2>
        <ErrorAlert message={error} />
        <SuccessAlert message={saved ? 'Perfil atualizado com sucesso!' : null} />
        <div>
          <label className="label">Nome</label>
          <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Vínculo universitário</label>
          <input required className="input" value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
        </div>
        <button type="submit" disabled={pending} className="btn-primary w-full text-xs">
          {pending && <Spinner />} Salvar alterações
        </button>
      </form>

      <button type="button" onClick={handleLogout} className="btn-secondary w-full text-xs text-red-600">
        <LogOut className="h-4 w-4" /> Sair da conta
      </button>
    </div>
  );
}
