'use client';

import { Fragment, memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Check, ChevronRight, ChevronDown, GitBranch, AlertTriangle } from 'lucide-react';
import type { WorkflowStepDef, StepState, StepStatus } from '@/lib/types';
import { DURATION, EASE_DEFAULT } from '@/lib/animations';

// ── Step-type color palette (inspired by Lingque DemoWorkflowPreview) ──

type StepType = 'input' | 'process' | 'extract' | 'decision' | 'audit' | 'output';

const STEP_TYPE_MAP: Record<number, StepType> = {
  1: 'input', 2: 'process', 3: 'process', 4: 'process', 5: 'extract',
  6: 'decision', 7: 'audit', 8: 'audit', 9: 'output', 10: 'output',
};

// Using rgba-based bg with low alpha — works naturally in both light and dark modes
const TYPE_PALETTE: Record<StepType, { bg: string; accent: string; label: string }> = {
  input:    { bg: 'rgba(59, 130, 246, 0.06)', accent: '#3B82F6', label: '\u8F93\u5165' },
  process:  { bg: 'rgba(13, 148, 136, 0.06)', accent: '#0D9488', label: '\u5904\u7406' },
  extract:  { bg: 'rgba(234, 88, 12, 0.06)', accent: '#EA580C', label: '\u63D0\u53D6' },
  decision: { bg: 'rgba(99, 102, 241, 0.06)', accent: '#6366F1', label: '\u5224\u5B9A' },
  audit:    { bg: 'rgba(5, 150, 105, 0.06)', accent: '#059669', label: '\u5BA1\u6838' },
  output:   { bg: 'rgba(22, 163, 74, 0.06)', accent: '#16A34A', label: '\u8F93\u51FA' },
};

const DECISION_STEP_ID = 6;
const BRANCH_LABELS = ['\u516C\u52A1', '\u5546\u52A1', '\u5176\u4ED6'];
const ITEMS_PER_ROW = 5;

// ── Micro-steps per workflow step (transparency hints) ──

const MICRO_STEPS: Record<number, string[]> = {
  1:  ['\u683C\u5F0F\u9A8C\u8BC1', '\u9875\u6570\u7EDF\u8BA1', '\u5927\u5C0F\u68C0\u67E5'],
  2:  ['\u65E5\u671F\u63D0\u53D6', '\u5929\u6570\u8BA1\u7B97', '\u8FC7\u671F\u5224\u5B9A'],
  3:  ['\u9875\u9762\u5206\u6790', '\u8FB9\u754C\u8BC6\u522B', '\u9010\u4EFD\u62C6\u5206'],
  4:  ['OCR\u8BC6\u522B', '\u5B57\u6BB5\u63D0\u53D6', '\u7F6E\u4FE1\u5EA6\u8BC4\u4F30'],
  5:  ['\u4FE1\u606F\u63D0\u53D6', '\u4EBA\u5458\u5339\u914D', '\u8D39\u7528\u5F52\u7C7B'],
  6:  ['\u89C4\u5219\u5339\u914D', '\u7C7B\u578B\u5224\u5B9A', '\u8DEF\u7531\u5206\u53D1'],
  7:  ['\u6807\u51C6\u6838\u5BF9', '\u91D1\u989D\u9A8C\u8BC1', '\u5408\u89C4\u5224\u5B9A'],
  8:  ['\u95EE\u9898\u5206\u7C7B', '\u7EA7\u522B\u6807\u6CE8', '\u5EFA\u8BAE\u751F\u6210'],
  9:  ['\u6A21\u677F\u5339\u914D', '\u6570\u636E\u586B\u5145', '\u683C\u5F0F\u6821\u9A8C'],
  10: ['\u7ED3\u8BBA\u751F\u6210', '\u62A5\u544A\u5BFC\u51FA', '\u5F52\u6863\u8BB0\u5F55'],
};

// Keyframes (wfMarchH, wfMarchV, wfGlow, wfScan, wfShimmer) are in globals.css

// ── Elapsed timer for active steps (ticks every 1s) ──

function ElapsedTimer({ startedAt }: { startedAt?: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setElapsed(Math.floor((performance.now() - startedAt) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  if (!startedAt || elapsed < 1) return null;
  return <span style={{ fontSize: 10, color: '#0D9488', fontVariantNumeric: 'tabular-nums' }}>{elapsed}s</span>;
}

// ── Connector helpers ──

function connectorStatus(left: StepStatus, right: StepStatus): 'idle' | 'active' | 'completed' {
  if (left === 'completed' && right === 'completed') return 'completed';
  if (left === 'completed' && (right === 'active' || right === 'error')) return 'active';
  return 'idle';
}

const CONNECTOR_COLOR: Record<string, string> = {
  idle: '#CBD5E1',
  active: '#0D9488',
  completed: '#22C55E',
};

// ── MicroSteps component (memoized — only re-renders when stepId or status change) ──

const MicroSteps = memo(function MicroSteps({ stepId, status }: { stepId: number; status: StepStatus }) {
  const items = MICRO_STEPS[stepId] ?? [];
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (status !== 'active') { setActiveIdx(0); return; }
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % items.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [status, items.length]);

  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
      {items.map((label, i) => {
        const isItemActive = status === 'active' && i === activeIdx;
        const isItemDone = status === 'completed';

        return (
          <span key={label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 600, lineHeight: 1,
            padding: '3px 7px', borderRadius: 4,
            background: isItemActive ? 'rgba(13,148,136,0.12)'
              : isItemDone ? 'rgba(34,197,94,0.06)'
              : status === 'error' ? 'rgba(239,68,68,0.06)'
              : 'rgba(100,116,139,0.04)',
            color: isItemActive ? '#0D9488'
              : isItemDone ? '#059669'
              : status === 'error' ? '#DC2626'
              : '#94A3B8',
            border: isItemActive ? '1px solid rgba(13,148,136,0.2)' : '1px solid transparent',
            transition: 'all 0.4s ease',
          }}>
            {isItemDone && <Check size={8} strokeWidth={3} />}
            {isItemActive && (
              <motion.span
                style={{ width: 4, height: 4, borderRadius: '50%', background: '#0D9488', display: 'inline-block', flexShrink: 0 }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
            {label}
          </span>
        );
      })}
    </div>
  );
});

// ── StepCard ──

function StepCard({ step, state, index }: {
  step: WorkflowStepDef; state: StepState; index: number;
}) {
  const status: StepStatus = state?.status ?? 'idle';
  const type = STEP_TYPE_MAP[step.id] ?? 'process';
  const palette = TYPE_PALETTE[type];
  const isActive = status === 'active';
  const isCompleted = status === 'completed';
  const isError = status === 'error';
  const isDecision = step.id === DECISION_STEP_ID;
  const IconComponent = step.icon;

  const duration = isCompleted && state?.startedAt && state?.completedAt
    ? ((state.completedAt - state.startedAt) / 1000).toFixed(1) : null;

  const borderColor = isActive ? 'rgba(13,148,136,0.5)'
    : isCompleted ? 'rgba(34,197,94,0.35)'
    : isError ? 'rgba(239,68,68,0.35)'
    : `${palette.accent}22`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.45, ease: EASE_DEFAULT }}
      style={{
        flex: 1, minWidth: 140,
        padding: '18px 18px 14px',
        borderRadius: 14,
        border: `2px solid ${borderColor}`,
        background: status === 'idle' ? palette.bg
          : isActive ? 'var(--wf-card-active-bg)'
          : 'var(--wf-card-completed-bg)',
        /* backdrop-filter removed for performance — bg opacity handles the glass feel */
        boxShadow: isActive ? undefined
          : isCompleted ? '0 4px 16px rgba(34,197,94,0.08)'
          : '0 2px 8px rgba(0,0,0,0.03)',
        position: 'relative',
        opacity: status === 'idle' ? 0.88 : 1,
        transition: 'border-color 0.3s, opacity 0.3s',
        overflow: 'visible',
        animation: isActive ? 'wfGlow 2.5s ease-in-out infinite' : undefined,
      }}
    >
      {/* Animation clip container — overflow:hidden keeps scan line + shimmer inside card,
           while the card itself uses overflow:visible so the badge can extend above */}
      {isActive && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          overflow: 'hidden', pointerEvents: 'none', zIndex: 3,
        }}>
          {/* Scanning line — translateY GPU composited */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent 0%, rgba(13,148,136,0.6) 50%, transparent 100%)',
            animation: 'wfScan 2.5s ease-in-out infinite',
            willChange: 'transform',
          }} />
          {/* Shimmer bar at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
            backgroundImage: 'linear-gradient(90deg, transparent 0%, #0D9488 25%, #0891B2 50%, #0D9488 75%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'wfShimmer 2s linear infinite',
          }} />
        </div>
      )}

      {/* Type badge */}
      <div style={{
        position: 'absolute', top: -8, right: 10,
        fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
        padding: '2px 8px', borderRadius: 6,
        background: isDecision ? '#6366F1' : palette.accent,
        color: 'white', zIndex: 2,
      }}>
        {isDecision ? 'IF' : palette.label}
      </div>

      {/* Left accent stripe */}
      <div style={{
        position: 'absolute', left: 5, top: 10, bottom: 10,
        width: 3, borderRadius: 2,
        background: isActive ? '#0D9488' : isCompleted ? '#059669' : isError ? '#DC2626' : palette.accent,
        opacity: status === 'idle' ? 0.4 : 1,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 6, position: 'relative', zIndex: 1 }}>
        {/* Icon circle */}
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: isCompleted ? 'linear-gradient(135deg, #059669, #10B981)'
            : isActive ? 'linear-gradient(135deg, #0D9488, #0891B2)'
            : isError ? 'linear-gradient(135deg, #DC2626, #EF4444)'
            : `${palette.accent}1A`,
          color: (isCompleted || isActive || isError) ? 'white' : palette.accent,
          transition: 'background 0.3s',
        }}>
          {isCompleted ? <Check size={18} strokeWidth={3} /> : <IconComponent size={18} strokeWidth={2} />}
        </div>

        {/* Text block */}
        <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, lineHeight: 1.2,
            color: isActive ? '#0D9488' : isCompleted ? '#059669' : isError ? '#DC2626' : palette.accent,
            letterSpacing: '0.5px', textTransform: 'uppercase' as const,
          }}>
            STEP {String(step.id).padStart(2, '0')}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginTop: 2,
            color: status === 'idle' ? 'var(--wf-card-text-secondary)' : 'var(--wf-card-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
          }}>
            {step.name}
          </div>
          {isCompleted && duration && (
            <div style={{ fontSize: 10, color: '#059669', lineHeight: 1, marginTop: 3 }}>{duration}s</div>
          )}
          {isActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <motion.span
                style={{ width: 5, height: 5, borderRadius: '50%', background: '#0D9488', display: 'inline-block' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span style={{ fontSize: 10, color: '#0D9488', lineHeight: 1 }}>{'\u5BA1\u6838\u4E2D...'}</span>
              <ElapsedTimer startedAt={state?.startedAt} />
            </div>
          )}
          {isError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
              <AlertTriangle size={10} color="#DC2626" strokeWidth={2.5} />
              <span style={{ fontSize: 10, color: '#DC2626', lineHeight: 1 }}>{'\u5F02\u5E38'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description hint */}
      <div style={{
        fontSize: 11, color: isActive ? 'var(--wf-card-text-secondary)' : 'var(--wf-card-text-muted)', lineHeight: 1.5,
        marginTop: 10, paddingLeft: 6,
        position: 'relative', zIndex: 1,
      }}>
        {step.description}
      </div>

      {/* Micro-steps */}
      <div style={{ paddingLeft: 6, position: 'relative', zIndex: 1 }}>
        <MicroSteps stepId={step.id} status={status} />
      </div>

      {/* Decision branch labels */}
      {isDecision && (
        <div style={{ display: 'flex', gap: 3, marginTop: 6, paddingLeft: 6, position: 'relative', zIndex: 1 }}>
          {BRANCH_LABELS.map((label, bi) => (
            <span key={label} style={{
              fontSize: 9, fontWeight: 600, lineHeight: 1,
              padding: '2px 6px', borderRadius: 5,
              background: bi === 0 ? 'rgba(13,148,136,0.08)' : 'rgba(100,116,139,0.05)',
              color: bi === 0 ? '#0F766E' : '#94A3B8',
              border: bi === 0 ? '1px solid rgba(13,148,136,0.15)' : '1px solid rgba(226,232,240,0.6)',
            }}>
              {bi === 0 && <GitBranch size={8} strokeWidth={2} style={{ display: 'inline', marginRight: 2, verticalAlign: '-1px' }} />}
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Shimmer bar moved into the animation clip container above */}
    </motion.div>
  );
}

// ── Horizontal connector arrow (animated dashes) ──

function HConnector({ status }: { status: 'idle' | 'active' | 'completed' }) {
  const color = CONNECTOR_COLOR[status];
  // Use backgroundImage + backgroundSize (non-shorthand) to avoid React warning
  // about mixing shorthand `background` with `backgroundSize`
  const lineStyle: React.CSSProperties = status === 'active'
    ? {
        backgroundImage: `repeating-linear-gradient(90deg, ${color} 0, ${color} 6px, transparent 6px, transparent 12px)`,
        backgroundSize: '20px 100%',
        animation: 'wfMarchH 0.6s linear infinite',
      }
    : status === 'completed'
      ? { backgroundColor: color }
      : { backgroundImage: `repeating-linear-gradient(90deg, ${color} 0, ${color} 3px, transparent 3px, transparent 7px)` };

  return (
    <div style={{ display: 'flex', alignItems: 'center', width: 44, flexShrink: 0 }}>
      <div style={{ flex: 1, height: 2, ...lineStyle }} />
      <ChevronRight size={14} strokeWidth={2.5} color={color} style={{ flexShrink: 0, marginLeft: -3 }} />
    </div>
  );
}

// ── Main component ──

interface Props {
  steps: WorkflowStepDef[];
  stepStates: StepState[];
}

export default function WorkflowPipeline({ steps, stepStates }: Props) {
  const completedCount = stepStates.filter(s => s.status === 'completed').length;
  const progress = (completedCount / steps.length) * 100;

  // Split steps into rows of ITEMS_PER_ROW
  const rows: WorkflowStepDef[][] = [];
  for (let i = 0; i < steps.length; i += ITEMS_PER_ROW) {
    rows.push(steps.slice(i, i + ITEMS_PER_ROW));
  }

  return (
    <motion.section
      className="h-full flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slower, ease: EASE_DEFAULT }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #0D9488, #0F766E)' }}
          >
            <Settings size={16} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{'\u667A\u80FD\u5BA1\u6838\u6D41\u7A0B'}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{'AI \u6B63\u5728\u9010\u6B65\u5206\u6790\u60A8\u7684\u62A5\u9500\u6750\u6599'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{'\u8FDB\u5EA6'}</span>
          <span className="text-glow-blue" style={{ fontSize: 22, fontWeight: 800, color: '#0D9488' }}>
            {completedCount}
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>/{steps.length}</span>
          </span>
          <div className="progress-bar" style={{ width: 120 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Pipeline canvas with dot-grid background */}
      <div
        className="glass-bright rounded-2xl flex-1 min-h-0"
        style={{ overflow: 'auto', position: 'relative' }}
      >
        {/* Dot-grid background pattern */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          backgroundImage: 'radial-gradient(circle, rgba(13,148,136,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative',
          padding: '40px 28px 28px',
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          {rows.map((row, rowIndex) => {
            const globalOffset = rowIndex * ITEMS_PER_ROW;

            // Turn connector between rows
            const showTurn = rowIndex > 0;
            const turnCStatus = showTurn
              ? connectorStatus(
                  stepStates[globalOffset - 1]?.status ?? 'idle',
                  stepStates[globalOffset]?.status ?? 'idle',
                )
              : 'idle';

            return (
              <Fragment key={rowIndex}>
                {/* Vertical turn connector */}
                {showTurn && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 2, height: 24,
                        ...(turnCStatus === 'completed'
                          ? { backgroundColor: CONNECTOR_COLOR.completed }
                          : turnCStatus === 'active'
                            ? {
                                backgroundImage: `repeating-linear-gradient(180deg, ${CONNECTOR_COLOR.active} 0, ${CONNECTOR_COLOR.active} 4px, transparent 4px, transparent 8px)`,
                                backgroundSize: '100% 16px',
                                animation: 'wfMarchV 0.6s linear infinite',
                              }
                            : { backgroundImage: `repeating-linear-gradient(180deg, ${CONNECTOR_COLOR.idle} 0, ${CONNECTOR_COLOR.idle} 3px, transparent 3px, transparent 6px)` }
                        ),
                      }} />
                      <ChevronDown
                        size={14}
                        strokeWidth={2.5}
                        color={CONNECTOR_COLOR[turnCStatus]}
                        style={{ marginTop: -4 }}
                      />
                    </div>
                  </div>
                )}

                {/* Row of step cards */}
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  {row.map((step, i) => {
                    const gi = globalOffset + i;
                    const state = stepStates[gi];
                    const prevStatus = i > 0
                      ? (stepStates[gi - 1]?.status ?? 'idle')
                      : 'idle';
                    const curStatus = state?.status ?? 'idle';

                    return (
                      <Fragment key={step.id}>
                        {i > 0 && (
                          <HConnector status={connectorStatus(prevStatus, curStatus)} />
                        )}
                        <StepCard step={step} state={state} index={gi} />
                      </Fragment>
                    );
                  })}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

    </motion.section>
  );
}
