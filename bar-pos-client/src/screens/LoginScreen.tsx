import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Delete, Settings, X } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { getAppKey, setAppKey } from '@/config/tenant';
import { getApiBaseURL } from '@/lib/apiBaseUrl';
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
          const base = getApiBaseURL() || '(proxy Vite → API local)';
          setError(
            `Sin conexión con el servidor (${base}). Revisa red y que el backend esté arriba. App empaquetada: vuelve a generar el build tras cambiar .env. API local en dev: VITE_API_URL o VITE_USE_LOCAL_PROXY=true.`
          );
        } else if (e.response.status === 404) {
          setError('Este servidor no expone /api/auth/login-pin.');
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
        const p = pinRef.current;
        if (p.length >= 4) return;
        setError('');
        const newPin = p + e.key;
        setPin(newPin);
        if (newPin.length === 4) void submitPin(newPin);
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        setPin((q) => q.slice(0, -1));
        setError('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isLoading, submitPin]);

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

  const keyClass =
    'flex min-h-[72px] min-w-[72px] items-center justify-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] text-[22px] font-bold text-[var(--green)] shadow-sm transition hover:border-[var(--border2)] hover:bg-[var(--bg4)] active:scale-[0.94] active:border-[var(--green2)] disabled:pointer-events-none disabled:opacity-40 sm:min-h-[76px] sm:min-w-[76px]';

  return (
    <div className="login-app-root flex w-full flex-1 flex-col bg-[var(--bg)]">
      <header className="app-drag shrink-0 border-b border-[var(--border)] bg-[var(--bg2)]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-11 max-w-lg items-center justify-between px-4">
          <div className="w-8"></div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text3)]">
            Inicio de sesión
          </span>
          <button 
            type="button" 
            onClick={() => {
              setAppKeyInput(getAppKey());
              setShowConfig(true);
            }} 
            className="app-no-drag flex items-center justify-center rounded p-1.5 text-[var(--text3)] hover:bg-[var(--bg3)] hover:text-[var(--text2)] transition"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="app-no-drag flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-5 flex h-[88px] w-[88px] items-center justify-center rounded-[var(--radius-xl)] border border-[var(--border2)] bg-[var(--bg3)] text-[2.75rem] shadow-lg shadow-black/30"
            aria-hidden
          >
            🍹
          </div>
          <h1 className="text-[1.75rem] font-bold tracking-tight text-[var(--text)] sm:text-3xl">
            Bar POS
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--text2)]">
            Sistema de punto de venta
          </p>
        </div>

        <div
          className={`w-full max-w-[340px] rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg2)] p-7 shadow-2xl sm:p-8 ${
            shake ? 'shake' : ''
          }`}
        >
          <p className="text-center text-[15px] font-medium text-[var(--text2)]">
            Ingresa tu PIN
          </p>

          {isLoading ? (
            <div className="my-8 flex justify-center">
              <Spinner className="h-11 w-11 border-t-[var(--green)]" />
            </div>
          ) : (
            <div className="my-8 flex justify-center gap-4" role="status" aria-live="polite">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-[14px] w-[14px] rounded-full border-2 transition-all duration-150 ${
                    pin.length > i
                      ? 'border-[var(--green2)] bg-[var(--green2)] shadow-[0_0_12px_rgba(52,211,153,0.45)]'
                      : 'border-[var(--border2)] bg-transparent'
                  }`}
                />
              ))}
            </div>
          )}

          <div
            className="mx-auto grid max-w-[280px] select-none grid-cols-3 gap-3"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {keys.map((k) => (
              <button
                key={k}
                type="button"
                disabled={isLoading}
                onClick={() => handleDigit(k)}
                className={keyClass}
              >
                {k}
              </button>
            ))}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleBackspace}
              className="col-span-2 flex min-h-[72px] items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg2)] text-[var(--red)] transition hover:bg-[var(--bg4)] active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40 sm:min-h-[76px]"
              aria-label="Borrar último dígito"
            >
              <Delete className="h-7 w-7 opacity-90" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleDigit('0')}
              className={keyClass}
            >
              0
            </button>
          </div>

          <div className="mt-6 min-h-[3rem]">
            {error ? (
              <p
                className="rounded-[var(--radius)] border border-[var(--red)]/30 bg-[var(--red-pale)] px-3 py-2.5 text-center text-sm leading-snug text-[var(--red)]"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-[var(--text3)]">
          Teclado numérico · 4 dígitos
        </p>
      </div>

      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px] app-no-drag" onClick={() => setShowConfig(false)}>
          <div className="modal-enter w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg2)] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text)]">Configuración de Terminal</h2>
              <button onClick={() => setShowConfig(false)} className="rounded p-1 text-[var(--text2)] hover:bg-[var(--bg3)] transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-[var(--text2)]">App Key</label>
              <input
                type="text"
                value={appKeyInput}
                onChange={(e) => setAppKeyInput(e.target.value)}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg3)] px-3 py-2 text-[var(--text)] transition focus:border-[var(--green)] focus:outline-none"
                placeholder="UUID o slug del restaurante"
              />
              <p className="mt-2 text-xs text-[var(--text3)]">
                Este código vincula esta tableta con su sucursal correspondiente.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfig(false)}
                className="rounded-[var(--radius)] px-4 py-2 text-sm font-medium text-[var(--text2)] transition hover:bg-[var(--bg3)]"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setAppKey(appKeyInput);
                  setShowConfig(false);
                  toast.success('App Key guardado localmente');
                }}
                className="rounded-[var(--radius)] bg-[var(--green)] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--green2)] active:scale-95"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
