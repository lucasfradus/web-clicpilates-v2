
export function Loading({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="clic-loading" role="status" aria-live="polite">
      <div className="clic-loading__dot" />
      <div className="clic-loading__dot" />
      <div className="clic-loading__dot" />
      <span className="clic-loading__label">{label}</span>
    </div>
  );
}
