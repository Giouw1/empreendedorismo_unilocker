import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AccessButtonProps {
  lockerCode: string;
  onOpen: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export const AccessButton: React.FC<AccessButtonProps> = ({
  lockerCode,
  onOpen,
  disabled = false,
  className = '',
}) => {
  const [state, setState] = useState<'IDLE' | 'OPENING' | 'OPENED' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (state === 'OPENED') {
      const timer = setTimeout(() => {
        setState('IDLE');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleClick = async () => {
    if (disabled || state !== 'IDLE') return;

    setState('OPENING');
    setErrorMessage(null);

    try {
      await onOpen();
      setState('OPENED');
    } catch (err: any) {
      setState('ERROR');
      setErrorMessage(err?.response?.data?.message || err?.message || 'Falha ao destravar compartimento.');
      setTimeout(() => {
        setState('IDLE');
      }, 4000);
    }
  };

  if (state === 'OPENED') {
    return (
      <div
        className={`w-full bg-emerald-500 text-white rounded-3xl p-6 text-center shadow-lg shadow-emerald-500/30 animate-in fade-in zoom-in-95 duration-300 ${className}`}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-3 animate-bounce">
          <Unlock className="w-8 h-8 text-white stroke-[2.5]" />
        </div>
        <h4 className="text-xl font-extrabold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-6 h-6" /> Porta Destravada!
        </h4>
        <p className="text-emerald-100 text-sm mt-1">
          Locker <span className="font-bold underline">{lockerCode}</span> liberado com sucesso. Guarde ou retire seus pertences e feche a porta com firmeza.
        </p>
        <div className="mt-3 text-xs text-emerald-200 font-mono">
          Retornando ao modo de prontidão em instantes...
        </div>
      </div>
    );
  }

  if (state === 'ERROR') {
    return (
      <div
        className={`w-full bg-rose-500 text-white rounded-3xl p-6 text-center shadow-lg shadow-rose-500/30 ${className}`}
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/20 mb-2">
          <AlertCircle className="w-7 h-7 text-white" />
        </div>
        <h4 className="text-lg font-bold">Erro ao Destravar</h4>
        <p className="text-rose-100 text-xs mt-1">{errorMessage}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Abrir locker ${lockerCode}`}
      onClick={handleClick}
      disabled={disabled || state === 'OPENING'}
      className={`w-full group relative overflow-hidden rounded-3xl p-7 text-center font-bold transition-all duration-300 shadow-xl ${
        state === 'OPENING'
          ? 'bg-amber-500 text-white shadow-amber-500/30 cursor-wait'
          : disabled
          ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
          : 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 active:scale-[0.98] shadow-emerald-600/30 hover:shadow-emerald-600/50'
      } ${className}`}
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
            state === 'OPENING'
              ? 'bg-white/20 animate-spin'
              : disabled
              ? 'bg-slate-300 text-slate-400'
              : 'bg-white/20 group-hover:scale-110 shadow-inner'
          }`}
        >
          {state === 'OPENING' ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : (
            <Lock className="w-8 h-8 text-white stroke-[2.2]" />
          )}
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-100 font-semibold block mb-0.5">
            Acesso Eletrônico Seguro
          </span>
          <span className="text-xl font-black block">
            {state === 'OPENING'
              ? 'Validando autorização...'
              : `Abrir locker ${lockerCode}`}
          </span>
          <span className="text-xs text-white/80 font-normal mt-1 block">
            {state === 'OPENING'
              ? 'Comando de destravamento enviado'
              : 'Você pode abrir quantas vezes precisar durante o aluguel'}
          </span>
        </div>
      </div>
    </button>
  );
};
