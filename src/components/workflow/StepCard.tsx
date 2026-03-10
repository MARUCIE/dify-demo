'use client';

import { motion } from 'framer-motion';
import type { WorkflowStepDef, StepState } from '@/lib/types';

interface StepCardProps {
  step: WorkflowStepDef;
  state: StepState;
  index: number;
}

export default function StepCard({ step, state, index }: StepCardProps) {
  const { status } = state;
  const Icon = step.icon;

  const duration = status === 'completed' && state.startedAt && state.completedAt
    ? ((state.completedAt - state.startedAt) / 1000).toFixed(1)
    : null;

  return (
    <motion.div
      className="flex flex-col items-center"
      style={{ padding: 8 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <div
        className={`step-card ${status} glass rounded-xl p-4 w-full text-center ${
          status === 'active' ? 'glow-blue-strong' : ''
        }`}
        style={{
          minHeight: 110,
          position: 'relative',
          opacity: status === 'idle' ? 0.5 : 1,
        }}
      >
        {/* Pulse ring for active state */}
        {status === 'active' && <div className="pulse-ring" />}

        {/* Icon container */}
        <div className={`icon-container ${status} mx-auto mb-3`}>
          <Icon size={22} strokeWidth={2} />
        </div>

        {/* Step name */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: status === 'idle' ? 'var(--text-secondary)' : 'var(--text-primary)',
            lineHeight: 1.4,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {step.name}
        </p>

        {/* Status text */}
        {status === 'completed' && duration && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontSize: 10, color: '#4ade80', marginTop: 4, position: 'relative', zIndex: 1 }}
          >
            {duration}s
          </motion.p>
        )}

        {status === 'active' && (
          <p style={{ fontSize: 10, color: '#60a5fa', marginTop: 4, position: 'relative', zIndex: 1 }}>
            <span className="typing-cursor">审核中</span>
          </p>
        )}

        {status === 'idle' && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, position: 'relative', zIndex: 1 }}>
            等待中
          </p>
        )}

        {status === 'error' && (
          <p style={{ fontSize: 10, color: '#f87171', marginTop: 4, position: 'relative', zIndex: 1 }}>
            异常
          </p>
        )}

        {/* Progress bar for active step */}
        {status === 'active' && (
          <div className="progress-bar mt-2" style={{ position: 'relative', zIndex: 1 }}>
            <div className="progress-fill" style={{ width: '65%' }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
