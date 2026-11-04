import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';
import { reservationsService } from '../../services/reservations.service';
import { locationsService } from '../../services/locations.service';
import { useAsync } from '../../hooks/useAsync';
import { ErrorAlert, Loading, PageHeader } from '../../components/ui';

export default function LockerLocatePage() {
  const { id = '' } = useParams();
  const { data, loading, error, reload } = useAsync(async () => {
    const reservation = await reservationsService.getById(id);
    const location = await locationsService.getById(reservation.locationId);
    return { reservation, location };
  }, [id]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorAlert message={error ?? 'Dados não encontrados'} onRetry={() => void reload()} />;

  const { reservation, location } = data;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;

  return (
    <div className="space-y-4">
      <Link to={`/app/reservations/${reservation.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
        <ArrowLeft className="h-4 w-4" /> Voltar para reserva
      </Link>

      <PageHeader title="Localizar meu locker" subtitle={location.name} />

      <div className="card space-y-2 border-brand-200 bg-brand-50/40 text-center">
        <p className="text-xs font-semibold text-slate-500 uppercase">Seu compartimento</p>
        <p className="text-4xl font-extrabold text-brand-700">{reservation.lockerCode}</p>
      </div>

      {location.photoUrls[0] && (
        <img src={location.photoUrls[0]} alt={location.name} className="h-40 w-full rounded-2xl object-cover" />
      )}

      <div className="card space-y-2 text-xs text-slate-700">
        <p className="flex items-center gap-1.5 font-bold text-slate-900">
          <MapPin className="h-4 w-4 text-brand-600" /> Endereço no campus
        </p>
        <p>
          <strong>Campus:</strong> {location.campus}
        </p>
        <p>
          <strong>Prédio / Bloco:</strong> {location.building} — {location.block} ({location.floor})
        </p>
        <p>
          <strong>Sala / Corredor:</strong> {location.roomOrCorridor}
        </p>
        <p>
          <strong>Referência:</strong> {location.reference}
        </p>
        <div className="border-t border-slate-100 pt-2">
          <p className="font-bold text-slate-900">Como chegar ao compartimento:</p>
          <p className="mt-1 leading-relaxed">{location.accessInstructions}</p>
        </div>
      </div>

      <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full text-xs">
        <Navigation className="h-4 w-4" /> Abrir rota até o prédio no Google Maps
      </a>
    </div>
  );
}
