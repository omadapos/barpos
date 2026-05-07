import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { ApprovalStatus } from '@/api/approvals.api';

type Props = {
  open: boolean;
  status: ApprovalStatus | 'idle';
  title: string;
  detail?: string;
  error?: string;
  onClose: () => void;
};

export default function ApprovalWaitingModal({
  open,
  status,
  title,
  detail,
  error,
  onClose,
}: Props) {
  if (!open) return null;

  const done = status !== 'pending' && status !== 'idle';
  const approved = status === 'approved';

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
            approved
              ? 'bg-[var(--green-pale)] text-[var(--green)]'
              : done
                ? 'bg-[var(--red-pale)] text-[var(--red)]'
                : 'bg-[var(--bg3)] text-[var(--text2)]'
          }`}
        >
          {approved ? (
            <CheckCircle2 className="h-9 w-9" />
          ) : done ? (
            <XCircle className="h-9 w-9" />
          ) : (
            <Clock className="h-9 w-9 animate-pulse" />
          )}
        </div>

        <h3 className="text-xl font-black text-[var(--text)]">{title}</h3>
        <p className="mt-2 text-sm font-semibold text-[var(--text2)]">
          {done
            ? approved
              ? 'Aprobado por el jefe.'
              : error || 'La solicitud no fue aprobada.'
            : detail || 'Esperando aprobacion del jefe por Telegram...'}
        </p>

        {!done && (
          <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text3)]">
            No cierres esta pantalla
          </p>
        )}

        {done && (
          <button
            type="button"
            onClick={onClose}
            className="mt-6 h-12 w-full rounded-xl bg-[var(--green)] text-sm font-black uppercase tracking-wider text-white transition active:scale-95"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
