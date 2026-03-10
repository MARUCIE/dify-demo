'use client';

import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import type { WorkflowStepDef, StepState, StepStatus } from '@/lib/types';
import StepCard from './StepCard';

interface WorkflowPipelineProps {
  steps: WorkflowStepDef[];
  stepStates: StepState[];
}

// Derive connector status from neighboring step states
function connectorStatus(leftStatus: StepStatus, rightStatus: StepStatus): 'idle' | 'active' | 'completed' {
  if (leftStatus === 'completed' && rightStatus === 'completed') return 'completed';
  if (leftStatus === 'completed' && (rightStatus === 'active' || rightStatus === 'error')) return 'active';
  return 'idle';
}

export default function WorkflowPipeline({ steps, stepStates }: WorkflowPipelineProps) {
  const row1 = steps.slice(0, 5);
  const row2 = steps.slice(5, 10);
  const states1 = stepStates.slice(0, 5);
  const states2 = stepStates.slice(5, 10);

  const completedCount = stepStates.filter(s => s.status === 'completed').length;
  const activeStep = stepStates.find(s => s.status === 'active');
  const activeStepDef = activeStep ? steps.find(s => s.id === activeStep.stepId) : null;
  const progressPercent = (completedCount / steps.length) * 100;

  // Build row 1 horizontal connector statuses
  const row1Connectors: Array<'idle' | 'active' | 'completed'> = [];
  for (let i = 0; i < 4; i++) {
    row1Connectors.push(connectorStatus(states1[i].status, states1[i + 1].status));
  }

  // Build row 2 horizontal connector statuses
  const row2Connectors: Array<'idle' | 'active' | 'completed'> = [];
  for (let i = 0; i < 4; i++) {
    row2Connectors.push(connectorStatus(states2[i].status, states2[i + 1].status));
  }

  // Vertical connector statuses (right side: step5->step6, left side is decorative)
  const rightVertical = connectorStatus(states1[4].status, states2[0].status);
  const leftVertical: 'idle' | 'active' | 'completed' = states2[4]?.status === 'completed'
    ? 'completed'
    : states2[4]?.status === 'active'
      ? 'active'
      : 'idle';

  return (
    <motion.section
      className="h-full flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] as const }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            }}
          >
            <Settings size={16} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>智能审核流程</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              AI 正在逐步分析您的报销材料
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>进度</span>
          <span
            className="text-glow-blue"
            style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa' }}
          >
            {completedCount}
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>
              /{steps.length}
            </span>
          </span>
          <div className="progress-bar" style={{ width: 120 }}>
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="glass-bright rounded-2xl p-4 glow-blue-strong flex-1 min-h-0">
        {/* Step grid: 5 columns x 2 rows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, position: 'relative' }}>
          {/* Row 1: Steps 1-5 */}
          {row1.map((step, i) => (
            <StepCard key={step.id} step={step} state={states1[i]} index={i} />
          ))}

          {/* Row 1 horizontal connectors (overlay) */}
          <div
            style={{
              position: 'absolute',
              top: 70,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              padding: '0 60px',
              pointerEvents: 'none',
            }}
          >
            <div style={{ flex: 1 }} />
            {row1Connectors.map((cs, i) => (
              <div key={`r1c-${i}`} style={{ display: 'contents' }}>
                <div
                  className={`connector ${cs}`}
                  style={{ width: 'calc(20% - 40px)', margin: '0 -16px' }}
                />
                {i < 3 && <div style={{ flex: '0 0 20%' }} />}
              </div>
            ))}
            <div style={{ flex: 1 }} />
          </div>

          {/* Row separator with vertical connectors */}
          <div
            style={{
              gridColumn: '1 / -1',
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <div
              className={`v-connector ${rightVertical}`}
              style={{
                position: 'absolute',
                right: '10%',
                top: 0,
                bottom: 0,
                width: 2,
                height: '100%',
              }}
            />
            <div
              className={`v-connector ${leftVertical}`}
              style={{
                position: 'absolute',
                left: '10%',
                top: 0,
                bottom: 0,
                width: 2,
                height: '100%',
              }}
            />
          </div>

          {/* Row 2: Steps 6-10 */}
          {row2.map((step, i) => (
            <StepCard key={step.id} step={step} state={states2[i]} index={i + 5} />
          ))}

          {/* Row 2 horizontal connectors (overlay) */}
          <div
            style={{
              position: 'absolute',
              bottom: 70,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              padding: '0 60px',
              pointerEvents: 'none',
            }}
          >
            <div style={{ flex: 1 }} />
            {row2Connectors.map((cs, i) => (
              <div key={`r2c-${i}`} style={{ display: 'contents' }}>
                <div
                  className={`connector ${cs}`}
                  style={{ width: 'calc(20% - 40px)', margin: '0 -16px' }}
                />
                {i < 3 && <div style={{ flex: '0 0 20%' }} />}
              </div>
            ))}
            <div style={{ flex: 1 }} />
          </div>
        </div>

        {/* Active step detail bar */}
        {activeStepDef && (
          <motion.div
            className="mt-6 p-4 rounded-xl"
            style={{
              background: 'rgba(37,99,235,0.06)',
              border: '1px solid rgba(59,130,246,0.15)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#3b82f6',
                }}
                animate={{
                  boxShadow: [
                    '0 0 4px rgba(59,130,246,0.4)',
                    '0 0 12px rgba(59,130,246,0.8)',
                    '0 0 4px rgba(59,130,246,0.4)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>
                步骤 {activeStepDef.id}/{steps.length} -- {activeStepDef.name}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, marginLeft: 20 }}>
              {activeStepDef.description}
            </p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
