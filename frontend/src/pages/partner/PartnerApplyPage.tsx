import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { partnerService } from '../../services/partner.service';
import { useAuth } from '../../contexts/AuthContext';
import { useAction } from '../../hooks/useAsync';
import { ErrorAlert, PageHeader, Spinner, SuccessAlert } from '../../components/ui';

export default function PartnerApplyPage() {
  const { user, refreshUser } = useAuth();
  const { pending, error, run } = useAction();

  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState('Laboratório');
  const [responsibleName, setResponsibleName] = useState(user?.name ?? '');
  const [contactPhone, setContactPhone] = useState('(21) 99999-0000');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await run(() =>
      partnerService.apply({
        organizationName,
        organizationType,
        responsibleName,
        contactPhone,
      }),
    );
    if (res) {
      await refreshUser();
      setSubmitted(true);
    }
  };

  return (
    <div className="space-y-4">
      <Link to="/app/profile" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
        <ArrowLeft className="h-4 w-4" /> Voltar ao perfil
      </Link>

      <PageHeader
        title="Tornar-se Ofertador"
        subtitle="Cadastre seu laboratório, centro acadêmico ou estabelecimento na rede UniLocker"
      />

      {submitted || user?.partnerStatus === 'PENDING' ? (
        <SuccessAlert message="Solicitação enviada! Assim que a administração aprovar seu espaço, o Painel do Parceiro ficará disponível." />
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="card space-y-3">
          <ErrorAlert message={error} />
          <div>
            <label className="label">Nome do espaço / organização</label>
            <input
              required
              className="input"
              placeholder="Ex.: Laboratório de Robótica — CT"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Categoria</label>
            <select
              className="input"
              value={organizationType}
              onChange={(e) => setOrganizationType(e.target.value)}
            >
              <option value="Laboratório">Laboratório</option>
              <option value="Centro Acadêmico">Centro Acadêmico</option>
              <option value="Restaurante/Lanchonete">Restaurante / Lanchonete</option>
              <option value="Departamento">Departamento / Instituto</option>
            </select>
          </div>
          <div>
            <label className="label">Responsável</label>
            <input
              required
              className="input"
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Telefone / WhatsApp</label>
            <input
              required
              className="input"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
          <button type="submit" disabled={pending} className="btn-primary w-full text-xs">
            {pending && <Spinner />} Enviar solicitação de parceria
          </button>
        </form>
      )}
    </div>
  );
}
