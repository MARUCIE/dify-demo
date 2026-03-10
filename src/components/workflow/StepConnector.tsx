import type { StepStatus } from '@/lib/types';

interface StepConnectorProps {
  status: 'idle' | 'active' | 'completed';
  direction: 'horizontal' | 'vertical';
}

function resolveConnectorClass(status: StepStatus): string {
  if (status === 'completed') return 'completed';
  if (status === 'active') return 'active';
  return '';
}

export default function StepConnector({ status, direction }: StepConnectorProps) {
  const className = resolveConnectorClass(status);

  if (direction === 'vertical') {
    return <div className={`v-connector ${className}`} />;
  }

  return (
    <div
      className={`connector ${className}`}
      style={{ flex: 1, margin: '0 -16px' }}
    />
  );
}
