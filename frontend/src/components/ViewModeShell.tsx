import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BatteryFull, Monitor, Signal, Smartphone, Wifi } from 'lucide-react';

export type ViewMode = 'mobile' | 'web';

const STORAGE_KEY = 'unilocker.viewMode';
/** Tela de referência: iPhone 14/15 (390×844 pontos). */
const SCREEN_W = 390;
const SCREEN_H = 844;
const BEZEL = 12;
const STATUS_BAR_H = 44;
/** Abaixo desta largura o próprio navegador já é um celular: não simulamos moldura. */
const REAL_MOBILE_MAX_WIDTH = 768;

/** Verdadeiro quando o app está rodando dentro da moldura (iframe) do modo celular. */
export const IS_EMBEDDED = typeof window !== 'undefined' && window.self !== window.top;

function readMode(): ViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'web' ? 'web' : 'mobile';
  } catch {
    return 'mobile';
  }
}

function currentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function useIsRealMobile() {
  const query = `(max-width: ${REAL_MOBILE_MAX_WIDTH - 1}px)`;
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

function useClock() {
  const format = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const [time, setTime] = useState(format);
  useEffect(() => {
    const id = window.setInterval(() => setTime(format()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

/** Escala a moldura para caber na altura da janela sem cortar o aparelho. */
function useFrameScale() {
  const frameH = SCREEN_H + BEZEL * 2;
  const frameW = SCREEN_W + BEZEL * 2;
  const compute = () => Math.min(1, (window.innerHeight - 48) / frameH, (window.innerWidth - 48) / frameW);
  const [scale, setScale] = useState(compute);
  useEffect(() => {
    const onResize = () => setScale(compute());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return scale;
}

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  const options: { value: ViewMode; label: string; icon: typeof Smartphone }[] = [
    { value: 'mobile', label: 'Celular', icon: Smartphone },
    { value: 'web', label: 'Web', icon: Monitor },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Modo de visualização"
      className="fixed right-4 bottom-4 z-[60] flex items-center gap-1 rounded-full border border-base-300 bg-base-100/95 p-1 shadow-lg backdrop-blur"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={`Visualizar como ${label.toLowerCase()}`}
            onClick={() => onChange(value)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              active ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function PhoneFrame({ src, iframeRef }: { src: string; iframeRef: React.RefObject<HTMLIFrameElement> }) {
  const time = useClock();
  const scale = useFrameScale();
  const frameW = SCREEN_W + BEZEL * 2;
  const frameH = SCREEN_H + BEZEL * 2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-200 via-base-300/60 to-base-200 p-6">
      <div style={{ width: frameW * scale, height: frameH * scale }}>
        <div
          className="relative rounded-[3.25rem] bg-neutral shadow-2xl ring-1 ring-black/20"
          style={{ width: frameW, height: frameH, padding: BEZEL, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {/* Botões laterais do aparelho */}
          <span className="absolute top-32 -left-1 h-10 w-1 rounded-l bg-neutral" aria-hidden />
          <span className="absolute top-48 -left-1 h-16 w-1 rounded-l bg-neutral" aria-hidden />
          <span className="absolute top-40 -right-1 h-20 w-1 rounded-r bg-neutral" aria-hidden />

          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.5rem] bg-base-100">
            {/* Barra de status */}
            <div
              className="relative flex shrink-0 items-center justify-between bg-base-100 px-7 text-[13px] font-semibold text-base-content"
              style={{ height: STATUS_BAR_H }}
            >
              <span className="tabular-nums">{time}</span>
              <span className="absolute top-2.5 left-1/2 h-[26px] w-[110px] -translate-x-1/2 rounded-full bg-black" aria-hidden />
              <span className="flex items-center gap-1">
                <Signal className="h-3.5 w-3.5" />
                <Wifi className="h-3.5 w-3.5" />
                <BatteryFull className="h-4 w-4" />
              </span>
            </div>
            <iframe
              ref={iframeRef}
              title="UniLocker no celular"
              src={src}
              className="block w-full flex-1 border-0 bg-base-200"
            />
            {/* Indicador de início (home indicator) */}
            <span
              className="pointer-events-none absolute bottom-1.5 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-base-content/70"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Alterna entre a visualização web e a simulação de celular.
 * No modo celular, o app roda num iframe de 390×844: breakpoints, rolagem e elementos fixos
 * se comportam exatamente como em um aparelho real.
 */
export function ViewModeShell({ children }: { children: ReactNode }) {
  const isRealMobile = useIsRealMobile();
  const [mode, setMode] = useState<ViewMode>(readMode);
  const [frameSrc, setFrameSrc] = useState(currentPath);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const showFrame = !IS_EMBEDDED && !isRealMobile && mode === 'mobile';

  // Mantém a URL da página igual à rota aberta dentro do celular (recarregar não perde a tela).
  useEffect(() => {
    if (!showFrame) return;
    const id = window.setInterval(() => {
      try {
        const loc = iframeRef.current?.contentWindow?.location;
        if (!loc) return;
        const inner = `${loc.pathname}${loc.search}${loc.hash}`;
        if (inner !== currentPath()) window.history.replaceState(null, '', inner);
      } catch {
        // iframe ainda carregando
      }
    }, 400);
    return () => window.clearInterval(id);
  }, [showFrame]);

  const changeMode = useCallback(
    (next: ViewMode) => {
      if (next === mode) return;
      if (next === 'mobile') {
        setFrameSrc(currentPath());
      } else {
        try {
          const loc = iframeRef.current?.contentWindow?.location;
          if (loc) window.history.replaceState(null, '', `${loc.pathname}${loc.search}${loc.hash}`);
        } catch {
          // mantém a URL atual
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // armazenamento indisponível: a escolha vale só nesta sessão
      }
      setMode(next);
    },
    [mode],
  );

  if (IS_EMBEDDED) return <>{children}</>;

  return (
    <>
      {showFrame ? <PhoneFrame src={frameSrc} iframeRef={iframeRef} /> : children}
      {!isRealMobile && <ModeToggle mode={mode} onChange={changeMode} />}
    </>
  );
}
