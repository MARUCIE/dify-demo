'use client';

import { motion } from 'framer-motion';
import { Settings, Check } from 'lucide-react';
import type { WorkflowStepDef, StepState, StepStatus } from '@/lib/types';
import { DURATION, EASE_DEFAULT } from '@/lib/animations';

// ── SVG canvas layout ──
const VB_W = 1100;
const VB_H = 430;
const NW = 150; // node width
const NH = 56;  // node height

// Node center positions — snake layout
// Row 1: steps 1-5 left→right, Row 2: steps 6-10 right→left
const POS: [number, number][] = [
  [100, 105], [325, 105], [550, 105], [775, 105], [1000, 105],
  [1000, 325], [775, 325], [550, 325], [325, 325], [100, 325],
];

// Connection pairs [fromStepIdx, toStepIdx]
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // row 1 horizontal
  [4, 5],                          // vertical turn
  [5, 6], [6, 7], [7, 8], [8, 9], // row 2 horizontal
];

// ── Bezier path between two nodes ──
function edgePath(fi: number, ti: number): string {
  const [fx, fy] = POS[fi];
  const [tx, ty] = POS[ti];

  // Vertical turn connector (step 5 → step 6, same x column)
  if (fi === 4 && ti === 5) {
    const sy = fy + NH / 2;
    const ey = ty - NH / 2;
    const my = (sy + ey) / 2;
    return `M ${fx} ${sy} C ${fx} ${my}, ${tx} ${my}, ${tx} ${ey}`;
  }

  // Horizontal connections
  const goRight = tx > fx;
  const sx = goRight ? fx + NW / 2 : fx - NW / 2;
  const ex = goRight ? tx - NW / 2 : tx + NW / 2;
  const mx = (sx + ex) / 2;
  return `M ${sx} ${fy} C ${mx} ${fy}, ${mx} ${ty}, ${ex} ${ty}`;
}

// ── Status helpers ──
function edgeStatus(l: StepStatus, r: StepStatus): 'idle' | 'active' | 'completed' {
  if (l === 'completed' && r === 'completed') return 'completed';
  if (l === 'completed' && (r === 'active' || r === 'error')) return 'active';
  return 'idle';
}

const STRIPE_COLOR: Record<StepStatus, string> = {
  idle: '#475569',
  active: '#0D9488',
  completed: '#059669',
  error: '#DC2626',
};

const EDGE_COLOR: Record<string, string> = {
  idle: 'rgba(71,85,105,0.35)',
  active: 'rgba(45,212,191,0.7)',
  completed: 'rgba(34,197,94,0.5)',
};

const ICON_BG: Record<StepStatus, string> = {
  idle: 'rgba(51,65,85,0.5)',
  active: 'linear-gradient(135deg,#0D9488,#0891B2)',
  completed: 'linear-gradient(135deg,#059669,#10b981)',
  error: 'linear-gradient(135deg,#dc2626,#ef4444)',
};

const LABEL_COLOR: Record<StepStatus, string> = {
  idle: '#64748b',
  active: '#5EEAD4',
  completed: '#4ade80',
  error: '#f87171',
};

// ── Component ──
interface Props {
  steps: WorkflowStepDef[];
  stepStates: StepState[];
}

export default function WorkflowPipeline({ steps, stepStates }: Props) {
  const completedCount = stepStates.filter(s => s.status === 'completed').length;
  const activeStep = stepStates.find(s => s.status === 'active');
  const activeStepDef = activeStep ? steps.find(s => s.id === activeStep.stepId) : null;
  const progress = (completedCount / steps.length) * 100;

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
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>智能审核流程</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>AI 正在逐步分析您的报销材料</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>进度</span>
          <span className="text-glow-blue" style={{ fontSize: 22, fontWeight: 800, color: '#0D9488' }}>
            {completedCount}
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}>/{steps.length}</span>
          </span>
          <div className="progress-bar" style={{ width: 120 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* n8n-style flow canvas */}
      <div className="glass-bright rounded-2xl flex-1 min-h-0 overflow-hidden" style={{ padding: '8px 12px' }}>
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block' }}
        >
          {/* ── Bezier connections ── */}
          {EDGES.map(([fi, ti], i) => {
            const s = edgeStatus(stepStates[fi]?.status ?? 'idle', stepStates[ti]?.status ?? 'idle');
            return (
              <path
                key={`e${i}`}
                d={edgePath(fi, ti)}
                fill="none"
                stroke={EDGE_COLOR[s]}
                strokeWidth={s === 'active' ? 2.5 : 2}
                strokeDasharray={s === 'completed' ? 'none' : '6 8'}
                strokeLinecap="round"
                style={s === 'active' ? {
                  animation: 'flowDash 2.5s linear infinite',
                  animationDelay: `${-i * 0.3}s`,
                } : undefined}
              />
            );
          })}

          {/* ── Nodes ── */}
          {steps.map((step, i) => {
            const [cx, cy] = POS[i];
            const status = stepStates[i]?.status ?? 'idle';
            const x = cx - NW / 2;
            const y = cy - NH / 2;
            const Icon = step.icon;
            const isActive = status === 'active';
            const isCompleted = status === 'completed';
            const isError = status === 'error';

            // Duration for completed steps
            const state = stepStates[i];
            const duration = isCompleted && state?.startedAt && state?.completedAt
              ? ((state.completedAt - state.startedAt) / 1000).toFixed(1)
              : null;

            return (
              <g key={step.id} opacity={status === 'idle' ? 0.5 : 1}>
                {/* Active pulse ring */}
                {isActive && (
                  <rect
                    x={x - 4} y={y - 4} width={NW + 8} height={NH + 8} rx={14}
                    fill="none" stroke="rgba(13,148,136,0.25)" strokeWidth={2}
                    style={{ animation: 'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
                  />
                )}

                {/* Node background */}
                <rect
                  x={x} y={y} width={NW} height={NH} rx={10}
                  fill={isActive ? 'rgba(13,148,136,0.08)'
                    : isCompleted ? 'rgba(34,197,94,0.05)'
                    : isError ? 'rgba(239,68,68,0.05)'
                    : 'rgba(15,23,42,0.7)'}
                  stroke={isActive ? 'rgba(13,148,136,0.5)'
                    : isCompleted ? 'rgba(34,197,94,0.3)'
                    : isError ? 'rgba(239,68,68,0.3)'
                    : 'rgba(51,65,85,0.4)'}
                  strokeWidth={1.5}
                />

                {/* Left color stripe (n8n signature) */}
                <rect
                  x={x + 2} y={y + 8} width={4} height={NH - 16} rx={2}
                  fill={STRIPE_COLOR[status]}
                />

                {/* Connection ports */}
                {i > 0 && (
                  <circle
                    cx={i >= 5 ? cx + NW / 2 : cx - NW / 2} cy={cy} r={3.5}
                    fill={STRIPE_COLOR[status]} opacity={0.6}
                  />
                )}
                {i < 9 && (
                  <circle
                    cx={i >= 5 ? cx - NW / 2 : cx + NW / 2} cy={cy} r={3.5}
                    fill={STRIPE_COLOR[status]} opacity={0.6}
                  />
                )}
                {/* Turn ports (bottom of step 5, top of step 6) */}
                {i === 4 && <circle cx={cx} cy={cy + NH / 2} r={3.5} fill={STRIPE_COLOR[status]} opacity={0.6} />}
                {i === 5 && <circle cx={cx} cy={cy - NH / 2} r={3.5} fill={STRIPE_COLOR[status]} opacity={0.6} />}

                {/* Node content via foreignObject */}
                <foreignObject x={x} y={y} width={NW} height={NH}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      height: '100%',
                      paddingLeft: 14,
                      paddingRight: 6,
                      fontFamily: '"Inter", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: 26, height: 26, borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: ICON_BG[status],
                        color: status === 'idle' ? '#94a3b8' : 'white',
                      }}
                    >
                      {isCompleted
                        ? <Check size={14} strokeWidth={3} />
                        : <Icon size={14} strokeWidth={2} />}
                    </div>

                    {/* Text */}
                    <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 9, fontWeight: 700, lineHeight: 1.2,
                        color: LABEL_COLOR[status],
                        letterSpacing: '0.5px',
                      }}>
                        STEP {String(step.id).padStart(2, '0')}
                      </div>
                      <div style={{
                        fontSize: 11, fontWeight: 500, lineHeight: 1.3,
                        color: status === 'idle' ? '#94a3b8' : '#e2e8f0',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {step.name}
                      </div>
                      {isCompleted && duration && (
                        <div style={{ fontSize: 8, color: '#059669', lineHeight: 1.2 }}>{duration}s</div>
                      )}
                      {isActive && (
                        <div style={{ fontSize: 8, color: '#0D9488', lineHeight: 1.2 }}>审核中...</div>
                      )}
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active step detail bar */}
      {activeStepDef && (
        <motion.div
          className="mt-3 p-3 rounded-xl shrink-0"
          style={{ background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.12)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D9488' }}
              animate={{
                boxShadow: [
                  '0 0 4px rgba(13,148,136,0.4)',
                  '0 0 12px rgba(13,148,136,0.8)',
                  '0 0 4px rgba(13,148,136,0.4)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#5EEAD4' }}>
              步骤 {activeStepDef.id}/{steps.length} -- {activeStepDef.name}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, marginLeft: 20 }}>
            {activeStepDef.description}
          </p>
        </motion.div>
      )}
    </motion.section>
  );
}
