
export function ErrorBanner({
  title = 'Algo salió mal',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="clic-error" role="alert">
      <div className="clic-error__body">
        <p className="clic-error__title">{title}</p>
        <p className="clic-error__msg">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="clic-error__retry" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
