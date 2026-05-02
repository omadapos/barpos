export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-block h-8 w-8 rounded-full border-2 border-[var(--border)] border-t-[var(--green2)] animate-spin-slow ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}
