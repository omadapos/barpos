import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ChevronLeft, Settings, X, Wine } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { getAppKey, setAppKey } from '@/config/tenant';
import { useAuthStore } from '@/store/useAuthStore';
import Spinner from '@/components/Spinner';

export function LoginScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [appKeyInput, setAppKeyInput] = useState('');
  const pinRef = useRef('');

  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  const submitPin = useCallback(async (p: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.loginByPin(p);
      useAuthStore.getState().setAuth(result.token, result.user);
      toast.success(`Bienvenido, ${result.user.username} 👋`);
    } catch (e: unknown) {
      setPin('');
      if (axios.isAxiosError(e)) {
        if (!e.response) {
          setError(`Error de conexión con el servidor`);
        } else {
          setError('PIN incorrecto');
        }
      } else {
        setError('PIN incorrecto');
      }
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDigit = (d: string) => {
    if (isLoading) return;
    if (pinRef.current.length >= 4) return;
    setError('');
    const newPin = pinRef.current + d;
    setPin(newPin);
    if (newPin.length === 4) {
      void submitPin(newPin);
    }
  };

  const handleBackspace = () => {
    if (isLoading) return;
    setPin((p) => p.slice(0, -1));
    setError('');
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isLoading) return;
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
  }, [isLoading]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

  const keyClass =
    'flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-[var(--border)] shadow-sm text-2xl font-semibold text-[var(--text)] transition-all hover:bg-[var(--bg3)] active:scale-95';

  return (
    <div className="login-app-root flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={() => {
            setAppKeyInput(getAppKey());
            setShowConfig(true);
          }}
          className="rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition hover:bg-white/20"
        >
          <Settings className="h-6 w-6" />
        </button>
      </div>

      <div
        className={`w-full max-w-sm rounded-[2rem] bg-white/95 p-8 shadow-2xl backdrop-blur-sm transition-all sm:p-10 ${
          shake ? 'shake' : ''
        }`}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--green-pale)] text-[var(--green)]">
            <Wine className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">Bar POS</h1>
          <p className="mt-1 text-sm font-medium text-[var(--text3)] uppercase tracking-widest">
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
            <div className="mb-10 flex justify-center gap-5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                    pin.length > i
                      ? 'scale-110 border-[var(--green)] bg-[var(--green)] shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                      : 'border-[var(--border2)] bg-transparent'
                  }`}
                />
              ))}
            </div>

            <div className="mx-auto grid grid-cols-3 gap-4">
              {keys.map((k) => (
                <button key={k} type="button" onClick={() => handleDigit(k)} className={keyClass}>
                  {k}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-[var(--border)] text-[var(--red)] transition-all hover:bg-[var(--red-pale)] active:scale-95"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button type="button" onClick={() => handleDigit('0')} className={keyClass}>
                0
              </button>
              <div className="h-20 w-20" />
            </div>
          </>
        )}

        <div className="mt-8 min-h-[1.5rem]">
          {error && (
            <p className="text-center text-sm font-bold text-[var(--red)] animate-pulse">
              {error}
            </p>
          )}
        </div>
      </div>

      <p className="mt-8 text-sm font-semibold text-white/60 uppercase tracking-widest">
        v2.1.0 Premium
      </p>

      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={() => setShowConfig(false)}>
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--text)]">Terminal Config</h2>
              <button onClick={() => setShowConfig(false)} className="rounded-full p-2 hover:bg-[var(--bg3)] transition">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-8">
              <label className="mb-2 block text-sm font-bold text-[var(--text2)] uppercase tracking-wider">App Key</label>
              <input
                type="text"
                value={appKeyInput}
                onChange={(e) => setAppKeyInput(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg3)] px-4 py-3 text-lg font-medium text-[var(--text)] focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green-pale)] outline-none transition"
                placeholder="UUID"
              />
            </div>
            <button
              onClick={() => {
                setAppKey(appKeyInput);
                setShowConfig(false);
                toast.success('App Key guardado');
              }}
              className="w-full rounded-xl bg-[var(--green)] py-4 text-lg font-bold text-white shadow-lg shadow-[var(--green)]/20 transition hover:brightness-110 active:scale-95"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
