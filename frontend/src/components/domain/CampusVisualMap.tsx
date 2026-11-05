import React, { useState } from 'react';
import type { LocationSummaryDto } from '../../types/api';
import { AvailabilityBadge } from './AvailabilityBadge';
import { MapPin, ArrowRight, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CampusVisualMapProps {
  locations: LocationSummaryDto[];
  selectedLocationId?: string;
  onSelectLocation?: (location: LocationSummaryDto) => void;
  className?: string;
}

export const CampusVisualMap: React.FC<CampusVisualMapProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'FUNDAO' | 'PRAIA_VERMELHA'>('FUNDAO');
  const [activePin, setActivePin] = useState<LocationSummaryDto | null>(null);

  // Mapeamento esquemático de coordenadas relativas (%) para os pontos conhecidos da UFRJ
  const getLocationCoords = (loc: LocationSummaryDto) => {
    const text = `${loc.name} ${loc.building} ${loc.campus}`.toLowerCase();
    if (text.includes('praia vermelha') || text.includes('urca') || text.includes('ipub')) {
      return { tab: 'PRAIA_VERMELHA', x: 50, y: 55 };
    }
    if (text.includes('tecnologia') || text.includes('ct') || text.includes('poli') || text.includes('bloco a')) {
      return { tab: 'FUNDAO', x: 28, y: 42 };
    }
    if (text.includes('eba') || text.includes('reitoria') || text.includes('belas artes') || text.includes('jorge')) {
      return { tab: 'FUNDAO', x: 62, y: 38 };
    }
    if (text.includes('letras')) {
      return { tab: 'FUNDAO', x: 52, y: 64 };
    }
    if (text.includes('ccmn') || text.includes('matemática') || text.includes('física') || text.includes('química')) {
      return { tab: 'FUNDAO', x: 38, y: 56 };
    }
    if (text.includes('ccs') || text.includes('saúde') || text.includes('biologia')) {
      return { tab: 'FUNDAO', x: 74, y: 58 };
    }
    // Ponto padrão na Ilha do Fundão
    return { tab: 'FUNDAO', x: 48, y: 48 };
  };

  const filteredLocations = locations.filter(
    (loc) => getLocationCoords(loc).tab === activeTab
  );

  return (
    <div
      className={`bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-xl relative flex flex-col ${className}`}
    >
      {/* Barra de Seleção de Campus & Legenda */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('FUNDAO');
              setActivePin(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'FUNDAO'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cidade Universitária (Fundão)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('PRAIA_VERMELHA');
              setActivePin(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'PRAIA_VERMELHA'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Praia Vermelha (Urca)
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Vagas Livres
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Lotado
          </span>
          <span className="text-slate-500 hidden sm:inline">• 100% Offline</span>
        </div>
      </div>

      {/* Área do Mapa Esquemático SVG */}
      <div className="relative w-full h-80 sm:h-96 bg-[#0f172a] select-none overflow-hidden">
        {activeTab === 'FUNDAO' ? (
          /* Visual Ilustrado da Ilha do Fundão na Baía de Guanabara */
          <svg
            viewBox="0 0 800 500"
            className="w-full h-full object-cover"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#082f49" />
                <stop offset="100%" stopColor="#0c4a6e" />
              </linearGradient>
              <linearGradient id="islandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
            </defs>

            {/* Água (Baía de Guanabara) */}
            <rect width="800" height="500" fill="url(#waterGrad)" />
            <rect width="800" height="500" fill="url(#grid)" opacity="0.4" />

            {/* Pontes / Linha Vermelha esquemática */}
            <path
              d="M 50 480 Q 200 400 400 380 T 750 360"
              stroke="#475569"
              strokeWidth="6"
              strokeDasharray="8 6"
              fill="none"
              opacity="0.6"
            />
            <text x="80" y="460" fill="#64748b" fontSize="11" fontWeight="bold">
              Linha Vermelha / Acesso Galeão
            </text>

            {/* Contorno da Ilha do Fundão (Cidade Universitária) */}
            <path
              d="M 120 220 
                 C 180 140, 320 130, 480 150 
                 C 620 170, 720 230, 700 320 
                 C 670 410, 520 400, 360 380 
                 C 220 370, 100 330, 90 270 
                 Z"
              fill="url(#islandGrad)"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeOpacity="0.4"
            />

            {/* Zonas de Prédios e Polos */}
            {/* Polo CT */}
            <g className="cursor-pointer">
              <rect x="180" y="190" width="110" height="70" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" opacity="0.8" />
              <text x="195" y="225" fill="#c7d2fe" fontSize="12" fontWeight="bold">POLO CT</text>
              <text x="195" y="242" fill="#818cf8" fontSize="10">Engenharia / Poli</text>
            </g>

            {/* Polo Reitoria / EBA */}
            <g className="cursor-pointer">
              <rect x="460" y="170" width="120" height="70" rx="8" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.8" />
              <text x="475" y="205" fill="#ddd6fe" fontSize="12" fontWeight="bold">REITORIA / EBA</text>
              <text x="475" y="222" fill="#a78bfa" fontSize="10">Artes / Arquitetura</text>
            </g>

            {/* Polo Letras */}
            <g className="cursor-pointer">
              <rect x="380" y="290" width="110" height="65" rx="8" fill="#1e1b4b" stroke="#0ea5e9" strokeWidth="1.5" opacity="0.8" />
              <text x="395" y="322" fill="#bae6fd" fontSize="12" fontWeight="bold">LETRAS</text>
              <text x="395" y="339" fill="#38bdf8" fontSize="10">Fac. de Letras</text>
            </g>

            {/* Polo CCMN */}
            <g className="cursor-pointer">
              <rect x="280" y="260" width="90" height="60" rx="8" fill="#1e1b4b" stroke="#10b981" strokeWidth="1.5" opacity="0.8" />
              <text x="295" y="292" fill="#a7f3d0" fontSize="11" fontWeight="bold">CCMN</text>
              <text x="295" y="307" fill="#34d399" fontSize="9">Exatas / Bio</text>
            </g>

            {/* Polo CCS */}
            <g className="cursor-pointer">
              <rect x="560" y="260" width="90" height="60" rx="8" fill="#1e1b4b" stroke="#14b8a6" strokeWidth="1.5" opacity="0.6" />
              <text x="575" y="292" fill="#99f6e4" fontSize="11" fontWeight="bold">CCS</text>
              <text x="575" y="307" fill="#2dd4bf" fontSize="9">Saúde</text>
            </g>

            <text x="360" y="100" fill="#94a3b8" fontSize="16" fontWeight="bold" textAnchor="middle">
              ILHA DO FUNDÃO — CIDADE UNIVERSITÁRIA
            </text>
          </svg>
        ) : (
          /* Visual Ilustrado do Campus da Praia Vermelha (Urca) */
          <svg
            viewBox="0 0 800 500"
            className="w-full h-full object-cover"
            preserveAspectRatio="xMidYMid slice"
          >
            <rect width="800" height="500" fill="#082f49" />
            <path
              d="M 200 450 C 250 250, 450 180, 650 220 C 700 240, 750 350, 600 480 Z"
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeOpacity="0.4"
            />
            {/* Polo Praia Vermelha */}
            <rect x="340" y="230" width="180" height="90" rx="12" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
            <text x="360" y="270" fill="#c7d2fe" fontSize="14" fontWeight="bold">CAMPUS PRAIA VERMELHA</text>
            <text x="360" y="295" fill="#818cf8" fontSize="11">Palácio Universitário • Urca</text>
            <text x="400" y="100" fill="#94a3b8" fontSize="16" fontWeight="bold" textAnchor="middle">
              CAMPUS PRAIA VERMELHA — URCA
            </text>
          </svg>
        )}

        {/* Marcadores / Pins Dinâmicos Interativos */}
        {filteredLocations.map((loc) => {
          const coords = getLocationCoords(loc);
          const isSelected = selectedLocationId === loc.id || activePin?.id === loc.id;
          const hasLockers = loc.availableCount > 0;

          return (
            <div
              key={loc.id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-transform duration-200 hover:scale-110"
              onClick={() => {
                setActivePin(loc);
                if (onSelectLocation) onSelectLocation(loc);
              }}
            >
              <div className="relative group">
                <div
                  className={`absolute -inset-2 rounded-full opacity-75 animate-ping ${
                    hasLockers ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <div
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg font-bold text-xs border ${
                    isSelected
                      ? 'bg-brand-600 text-white border-white ring-4 ring-brand-500/30'
                      : hasLockers
                      ? 'bg-emerald-500 text-white border-emerald-300'
                      : 'bg-rose-600 text-white border-rose-300'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">{loc.availableCount} livres</span>
                </div>

                <div className="text-[10px] text-white/90 bg-slate-900/90 px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap text-center">
                  {loc.name.length > 20 ? `${loc.name.slice(0, 20)}...` : loc.name}
                </div>
              </div>
            </div>
          );
        })}

        {/* Card Flutuante com Resumo do Ponto Selecionado */}
        {activePin && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-2xl p-4 shadow-2xl border border-slate-200 z-30 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <AvailabilityBadge availableCount={activePin.availableCount} />
                <h4 className="font-bold text-slate-900 text-sm mt-2 leading-tight">
                  {activePin.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activePin.building} • {activePin.floor}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Acesso eletrônico liberado
              </span>
              <Link
                to={`/app/locations/${activePin.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-all shadow-sm"
              >
                <span>Ver Ponto</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 bg-slate-950 text-slate-400 text-xs flex items-center justify-between border-t border-slate-800">
        <span className="flex items-center gap-1 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Mapa interativo esquemático da Cidade Universitária UFRJ
        </span>
        <span className="text-[11px] font-mono">
          {filteredLocations.length} pontos cadastrados
        </span>
      </div>
    </div>
  );
};
