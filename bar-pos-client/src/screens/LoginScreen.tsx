import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ChevronLeft, Wine, Settings, X } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { getAppKey } from '@/config/tenant';
import { useAuthStore } from '@/store/useAuthStore';
import Spinner from '@/components/Spinner';
import SystemSettingsModal from '@/components/SystemSettingsModal';

export function LoginScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentAppKey, setCurrentAppKey] = useState(() => getAppKey());
  const pinRef = useRef('');

  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  const submitPin = useCallback(async (p: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.loginByPin(p);
      useAuthStore.getState().setAuth(result.token, result.user);
      toast.success(`Bienvenido, ${result.user.username}`);
    } catch (e: unknown) {
      setPin('');
      if (axios.isAxiosError(e)) {
        if (!e.response) {
          setError('Error de conexion con el servidor');
        } else {
          const serverMsg = e.response.data?.message || e.response.data?.error;
          setError(serverMsg || 'PIN incorrecto');
        }
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Error desconocido');
      }
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDigit = useCallback(
    (d: string) => {
      if (isLoading) return;
      if (pinRef.current.length >= 4) return;
      setError('');
      const newPin = pinRef.current + d;
      setPin(newPin);
      if (newPin.length === 4) {
        void submitPin(newPin);
      }
    },
    [isLoading, submitPin],
  );

  const handleBackspace = useCallback(() => {
    if (isLoading) return;
    setPin((p) => p.slice(0, -1));
    setError('');
  }, [isLoading]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isLoading || settingsOpen) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleBackspace, handleDigit, isLoading, settingsOpen]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

  const keyClass =
    'flex h-20 w-24 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-2xl font-black text-[var(--text)] shadow-sm shadow-black/10 transition-all hover:bg-white hover:shadow-md active:scale-95';

  return (
    <div className="login-app-root relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#10151b] p-4">
      {/* Botón de Ajustes Visible */}
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="fixed top-6 right-6 z-[50] flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-white shadow-xl transition-all hover:bg-white/10 active:scale-90"
        title="Ajustes de Sistema"
      >
        <Settings className="h-5 w-5 text-[var(--green2)]" />
        <span className="text-xs font-black uppercase tracking-widest">Ajustes</span>
      </button>

      {window.electronEnv?.closeWindow && (
        <button
          type="button"
          onClick={() => window.electronEnv?.closeWindow()}
          className="fixed top-6 left-6 z-[50] flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-white shadow-xl transition-all hover:bg-[var(--red)]/15 hover:text-red-300 active:scale-90"
          title="Cerrar programa"
        >
          <X className="h-5 w-5" />
          <span className="text-xs font-black uppercase tracking-widest">Cerrar</span>
        </button>
      )}

      <div
        className={`w-full max-w-md rounded-[2rem] border border-white/25 bg-white/15 p-8 shadow-2xl shadow-black/25 backdrop-blur-xl transition-all sm:p-10 ${
          shake ? 'shake' : ''
        }`}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--green2)] to-[var(--green3)] text-white shadow-lg shadow-[var(--green)]/25">
            <Wine className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">Bar POS</h1>
          <p className="mt-1 text-sm font-medium uppercase tracking-widest text-white/60">
            Acceso Personal
          </p>
        </div>

        {isLoading ? (
          <div className="my-12 flex flex-col items-center gap-4">
            <Spinner className="h-12 w-12 border-t-[var(--green)]" />
            <span className="text-sm font-semibold text-[var(--text2)]">Validando PIN...</span>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-center gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                    pin.length > i
                      ? 'scale-110 border-[var(--green)] bg-[var(--green)] shadow-[0_0_15px_rgba(47,143,70,0.35)]'
                      : 'border-white/40 bg-white/10'
                  }`}
                />
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-white/60 bg-[var(--green-pale)]/90 p-4 shadow-xl shadow-black/10">
              <div className="mx-auto grid w-fit grid-cols-3 gap-4">
                {keys.map((k) => (
                  <button key={k} type="button" onClick={() => handleDigit(k)} className={keyClass}>
                    {k}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="flex h-20 w-24 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-[var(--red)] shadow-sm shadow-black/10 transition-all hover:bg-[var(--red-pale)] active:scale-95"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button type="button" onClick={() => handleDigit('0')} className={keyClass}>
                  0
                </button>
                <div className="h-20 w-24" />
              </div>
            </div>
          </>
        )}

        <div className="mt-8 min-h-[1.5rem]">
          {error && (
            <p className="animate-pulse text-center text-sm font-bold text-[var(--red)]">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-1 opacity-60">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white">
          v1.0.0
        </p>
        <p className="text-[9px] font-bold text-white/50 font-mono">
          ID: {currentAppKey ? `${currentAppKey.slice(0, 12)}...` : 'sin configurar'}
        </p>
      </div>

      <SystemSettingsModal 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        onSaved={setCurrentAppKey}
      />
    </div>
  );
}
