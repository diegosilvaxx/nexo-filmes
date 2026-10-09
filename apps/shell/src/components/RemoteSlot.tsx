import { lazy, Suspense, useState } from 'react';
import { LoadingState, RecoveryBoundary } from '@nexo/ui';
import type { RemoteName } from '@nexo/contracts';
import { loadRemoteComponent, type RemoteExpose } from '../runtime/loader';

interface RemoteSlotProps {
  name: RemoteName;
  expose?: RemoteExpose;
  label?: string;
  compact?: boolean;
}

export function RemoteSlot({
  name,
  expose = 'App',
  label = 'esta área',
  compact = false,
}: RemoteSlotProps) {
  const [{ attempt, Remote }, setSlot] = useState(() => ({
    attempt: 0,
    Remote: lazy(() => loadRemoteComponent(name, expose)),
  }));
  function retry() {
    setSlot((previous) => {
      const nextAttempt = previous.attempt + 1;
      return {
        attempt: nextAttempt,
        Remote: lazy(() => loadRemoteComponent(name, expose, nextAttempt)),
      };
    });
  }
  return (
    <RecoveryBoundary
      key={`${name}/${expose}/${attempt}`}
      label={label}
      compact={compact}
      onRetry={retry}
    >
      <Suspense
        fallback={<LoadingState label={compact ? 'Carregando favoritos…' : 'Carregando…'} />}
      >
        <Remote />
      </Suspense>
    </RecoveryBoundary>
  );
}
