import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Navigation, Building2, Footprints, Info } from 'lucide-react';
import { reservationsService } from '../../services/reservations.service';
import { locationsService } from '../../services/locations.service';
import { useAsync } from '../../hooks/useAsync';
import { ErrorAlert, Loading, PageHeader } from '../../components/ui';

export default function LockerLocatePage() {
  const { id = '' } = useParams();
  const [imgError, setImgError] = useState(false);
  const { data, loading, error, reload } = useAsync(async () => {
    const reservation = await reservationsService.getById(id);
    const location = await locationsService.getById(reservation.locationId);
    return { reservation, location };
  }, [id]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorAlert message={error ?? 'Dados não encontrados'} onRetry={() => void reload()} />;

  const { reservation, location } = data;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
  const coverUrl = location.photoUrls?.[0];

  return (
    <div className="space-y-4">
      <Link
        to={`/app/reservations/${reservation.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para reserva
      </Link>

      <PageHeader
        title="Localizar meu locker"
        subtitle={`Guia de orientação dentro do ${location.name}`}
      />

      {/* Destaque do Compartimento */}
      <div className="card space-y-2 border-brand-300 bg-gradient-to-br from-brand-50 to-white text-center py-6 shadow-sm">
        <p className="text-xs font-black tracking-widest text-brand-600 uppercase">
          Identificação da Porta
        </p>
        <div className="inline-flex items-center justify-center px-6 py-2 rounded-2xl bg-brand-600 text-white font-black text-4xl shadow-md">
          {reservation.lockerCode}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Procure pela placa numerada correspondente no armário físico
        </p>
      </div>

      {/* Imagem do Ponto ou Fallback */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
        {coverUrl && !imgError ? (
          <img
            src={coverUrl}
            alt={location.name}
            onError={() => setImgError(true)}
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="h-44 w-full flex flex-col items-center justify-center bg-slate-200 text-slate-400">
            <Building2 className="w-12 h-12 stroke-[1.5] mb-1" />
            <span className="text-xs font-semibold text-slate-500">{location.campus}</span>
          </div>
        )}
      </div>

      {/* Rota Passo a Passo Indoor */}
      <div className="card space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Footprints className="w-4 h-4 text-brand-600" />
          Passo a Passo até o Armário
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
              1
            </span>
            <div>
              <span className="font-bold text-slate-800 block">Prédio e Campus</span>
              <span className="text-slate-500">{location.campus} — {location.building}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
              2
            </span>
            <div>
              <span className="font-bold text-slate-800 block">Bloco e Andar</span>
              <span className="text-slate-500">{location.block} • {location.floor}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
              3
            </span>
            <div>
              <span className="font-bold text-slate-800 block">Sala e Ponto de Referência</span>
              <span className="text-slate-500">{location.roomOrCorridor} — {location.reference}</span>
            </div>
          </div>
        </div>

        {location.accessInstructions && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mb-1">
              <Info className="w-3.5 h-3.5 text-amber-500" /> Instruções adicionais de chegada:
            </span>
            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
              {location.accessInstructions}
            </p>
          </div>
        )}
      </div>

      {/* Rota Externa */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="btn-secondary w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
      >
        <Navigation className="h-4 w-4 text-brand-600" />
        Traçar rota no mapa externo (Google Maps)
      </a>
    </div>
  );
}
