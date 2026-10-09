import { Component, useState, type ReactNode } from 'react';
import { LoadingText, Notice, RetryButton } from './recovery.styles';

interface RecoveryBoundaryProps {
  children: ReactNode;
  onRetry: () => void;
  label?: string;
  compact?: boolean;
}

export class RecoveryBoundary extends Component<RecoveryBoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const { onRetry, label = 'esta área', compact = false } = this.props;
    return (
      <Notice role="alert" $compact={compact}>
        <span>Não foi possível carregar {label}.</span>
        <RetryButton type="button" $compact={compact} onClick={onRetry}>
          Tentar novamente
        </RetryButton>
      </Notice>
    );
  }
}

export function IsolatedArea({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <RecoveryBoundary key={attempt} onRetry={() => setAttempt((value) => value + 1)}>
      {children}
    </RecoveryBoundary>
  );
}

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <LoadingText role="status" aria-live="polite">
      {label}
    </LoadingText>
  );
}
