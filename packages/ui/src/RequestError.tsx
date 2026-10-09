import { useEffect, useState } from 'react';
import { Button, Notice } from './movie.styles';

export function RequestError({
  message,
  onRetry,
  retryAt,
}: {
  message: string;
  onRetry: () => void;
  retryAt?: number | undefined;
}) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = retryAt ? Math.max(0, Math.ceil((retryAt - now) / 1000)) : 0;
  useEffect(() => {
    if (!retryAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [retryAt]);
  return (
    <Notice>
      <p role="alert">{message}</p>
      {remaining > 0 && <p>Tente novamente em {remaining}s.</p>}
      <Button type="button" disabled={remaining > 0} onClick={onRetry}>
        Tentar novamente
      </Button>
    </Notice>
  );
}
