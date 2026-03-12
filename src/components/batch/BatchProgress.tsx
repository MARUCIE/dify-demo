'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, CheckCircle, AlertTriangle, XCircle, Clock, Loader2,
} from 'lucide-react';
import type { BatchFile, WorkflowStepDef } from '@/lib/types';
import { SUGGESTION_BADGE } from '@/lib/constants';
import { DURATION, EASE_DEFAULT } from '@/lib/animations';
import AuditLog from './AuditLog';

// -- Props --

interface BatchProgressProps {
  files: BatchFile[];
  steps: WorkflowStepDef[];
}

// -- Circular progress --

interface CircularProgressProps {
  percent: number;
  size: number;
  strokeWidth: number;
}

function CircularProgress({ percent, size, strokeWidth }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(209,224,222,0.4)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="url(#circularGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: DURATION.slower, ease: 'easeOut' }}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="circularGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      {/* Center text */}
      <text
        x={center}
        y={center - 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: 16,
          fontWeight: 800,
          fill: 'var(--text-primary)',
          fontFamily: 'Inter, -apple-system, sans-serif',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {Math.round(percent)}%
      </text>
      <text
        x={center}
        y={center + 14}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontSize: 9,
          fill: 'var(--text-secondary)',
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}
      >
        审核中
      </text>
    </svg>
  );
}

// -- Step dot color --

function dotColor(status: 'idle' | 'active' | 'completed' | 'error'): string {
  switch (status) {
    case 'completed': return '#059669';
    case 'active': return '#0D9488';
    case 'error': return '#DC2626';
    default: return 'rgba(13,148,136,0.15)';
  }
}

// -- File card --

interface FileCardProps {
  file: BatchFile;
  index: number;
  isActive: boolean;
  steps: WorkflowStepDef[];
  totalSteps: number;
}

function FileCard({ file, index, isActive, steps, totalSteps }: FileCardProps) {
  const activeStepDef = file.status === 'processing' && file.currentStep > 0
    ? steps[file.currentStep - 1]
    : null;

  const miniProgressPercent = totalSteps > 0
    ? (file.stepStates.filter(s => s.status === 'completed').length / totalSteps) * 100
    : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -24, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.97 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: EASE_DEFAULT }}
      className={`glass rounded-xl p-4 ${isActive ? 'glow-blue' : ''}`}
      style={{
        marginBottom: 8,
        borderLeft: isActive
          ? '3px solid #0D9488'
          : file.status === 'completed'
            ? '3px solid #059669'
            : file.status === 'error'
              ? '3px solid #DC2626'
              : '3px solid transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Breathing glow overlay for active card */}
      {isActive && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            pointerEvents: 'none',
            zIndex: 0,
          }}
          animate={{
            boxShadow: [
              'inset 0 0 24px rgba(13,148,136,0.06), 0 0 24px rgba(13,148,136,0.12)',
              'inset 0 0 40px rgba(13,148,136,0.14), 0 0 50px rgba(13,148,136,0.22)',
              'inset 0 0 24px rgba(13,148,136,0.06), 0 0 24px rgba(13,148,136,0.12)',
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="flex items-center gap-4" style={{ position: 'relative', zIndex: 1 }}>
        {/* File icon */}
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: isActive
              ? 'rgba(13,148,136,0.12)'
              : file.status === 'completed'
                ? 'rgba(5,150,105,0.08)'
                : file.status === 'error'
                  ? 'rgba(220,38,38,0.08)'
                  : 'rgba(13,148,136,0.06)',
          }}
        >
          {file.status === 'completed' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <CheckCircle size={18} color="#059669" strokeWidth={2} />
            </motion.div>
          ) : file.status === 'error' ? (
            <XCircle size={18} color="#DC2626" strokeWidth={2} />
          ) : isActive ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={18} color="#0D9488" strokeWidth={2} />
            </motion.div>
          ) : (
            <FileText size={18} color="var(--text-muted)" strokeWidth={2} />
          )}
        </div>

        {/* File name + step info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isActive
                ? 'var(--text-primary)'
                : file.status === 'queued'
                  ? 'var(--text-muted)'
                  : 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {file.name}
          </p>
          {isActive && activeStepDef && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: 11, color: '#0D9488', marginTop: 2 }}
            >
              <span className="typing-cursor">
                步骤 {file.currentStep}/{totalSteps} -- {activeStepDef.name}
              </span>
            </motion.p>
          )}
          {file.status === 'completed' && file.result && (
            <p style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>
              耗时 {file.result.totalDuration.toFixed(1)}s · {file.result.issues.length} 个问题
            </p>
          )}
          {file.status === 'error' && file.error && (
            <p style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}>
              {file.error}
            </p>
          )}
        </div>

        {/* Mini progress bar (for active/completed) */}
        <div className="shrink-0" style={{ width: 64 }}>
          {(file.status === 'processing' || file.status === 'completed') && (
            <div className="progress-bar" style={{ height: 3 }}>
              <motion.div
                className={file.status === 'completed' ? '' : 'progress-fill'}
                initial={{ width: 0 }}
                animate={{ width: `${file.status === 'completed' ? 100 : miniProgressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  borderRadius: 2,
                  background: file.status === 'completed'
                    ? 'linear-gradient(90deg, #059669, #059669)'
                    : undefined,
                }}
              />
            </div>
          )}
        </div>

        {/* Mini step dots */}
        <div className="flex items-center gap-1 shrink-0">
          {Array.from({ length: totalSteps }, (_, dotIdx) => {
            const stepState = file.stepStates[dotIdx];
            const status = stepState ? stepState.status : 'idle';
            const color = dotColor(status);

            return (
              <motion.div
                key={dotIdx}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: color,
                }}
                animate={
                  status === 'active'
                    ? {
                        boxShadow: [
                          `0 0 2px ${color}`,
                          `0 0 8px ${color}`,
                          `0 0 2px ${color}`,
                        ],
                      }
                    : {}
                }
                transition={
                  status === 'active'
                    ? { duration: 1.5, repeat: Infinity }
                    : {}
                }
              />
            );
          })}
        </div>

        {/* Status badge */}
        <div className="shrink-0" style={{ minWidth: 72, textAlign: 'right' }}>
          {file.status === 'queued' && (
            <span
              className="badge"
              style={{
                fontSize: 11,
                padding: '4px 10px',
                background: 'var(--glass-bg)',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(13,148,136,0.3)',
              }}
            >
              <Clock size={11} strokeWidth={2} />
              等待中
            </span>
          )}
          {file.status === 'processing' && (
            <span className="badge badge-blue" style={{ fontSize: 11, padding: '4px 10px' }}>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-flex' }}
              >
                <Loader2 size={11} strokeWidth={2} />
              </motion.span>
              处理中
            </span>
          )}
          {file.status === 'completed' && file.result && (
            <span
              className={`badge ${SUGGESTION_BADGE[file.result.suggestion].cls}`}
              style={{ fontSize: 11, padding: '4px 10px' }}
            >
              <CheckCircle size={11} strokeWidth={2} />
              {SUGGESTION_BADGE[file.result.suggestion].label}
            </span>
          )}
          {file.status === 'error' && (
            <span className="badge badge-red" style={{ fontSize: 11, padding: '4px 10px' }}>
              <AlertTriangle size={11} strokeWidth={2} />
              失败
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// -- Main component --

export default function BatchProgress({ files, steps }: BatchProgressProps) {
  const totalSteps = steps.length;

  const completedCount = files.filter(f => f.status === 'completed').length;
  const processingCount = files.filter(f => f.status === 'processing').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const totalCount = files.length;

  // Overall progress: completed files + partial progress of the active file
  const overallPercent = useMemo(() => {
    if (totalCount === 0) return 0;
    const activeFile = files.find(f => f.status === 'processing');
    const activePartial = activeFile
      ? activeFile.stepStates.filter(s => s.status === 'completed').length / totalSteps
      : 0;
    return ((completedCount + activePartial) / totalCount) * 100;
  }, [files, completedCount, totalCount, totalSteps]);

  // Active file index (first processing file)
  const activeFileIndex = files.findIndex(f => f.status === 'processing');

  // Status label
  const statusLabel = processingCount > 0
    ? '审核中'
    : errorCount > 0
      ? '部分失败'
      : '已完成';

  return (
    <motion.section
      className="h-full flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slower, ease: EASE_DEFAULT }}
    >
      {/* -- Section header with overall progress -- */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-4">
          {/* Circular progress indicator */}
          <CircularProgress percent={overallPercent} size={56} strokeWidth={4} />

          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>批量处理进度</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              已完成{' '}
              <span className="stat-number" style={{ color: '#0D9488', fontWeight: 700 }}>
                {completedCount}/{totalCount}
              </span>
              {' '}个文件
              <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>·</span>
              <span style={{ color: '#0D9488' }}>
                {Math.round(overallPercent)}%
              </span>
              {' '}{statusLabel}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-5">
          {completedCount > 0 && (
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                完成 <span className="stat-number" style={{ fontWeight: 700, color: '#059669' }}>{completedCount}</span>
              </span>
            </div>
          )}
          {processingCount > 0 && (
            <div className="flex items-center gap-2">
              <motion.div
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D9488' }}
                animate={{
                  boxShadow: [
                    '0 0 3px rgba(13,148,136,0.4)',
                    '0 0 10px rgba(13,148,136,0.8)',
                    '0 0 3px rgba(13,148,136,0.4)',
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                处理中 <span className="stat-number" style={{ fontWeight: 700, color: '#0D9488' }}>{processingCount}</span>
              </span>
            </div>
          )}
          {errorCount > 0 && (
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                失败 <span className="stat-number" style={{ fontWeight: 700, color: '#DC2626' }}>{errorCount}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* -- Overall progress bar -- */}
      <div className="progress-bar mb-3 shrink-0" style={{ height: 4 }}>
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${overallPercent}%` }}
          transition={{ duration: DURATION.slow, ease: 'easeOut' }}
          style={{ height: '100%' }}
        />
      </div>

      {/* -- File cards + AI Reasoning Log (unified container) -- */}
      <div
        className="glass-bright rounded-2xl flex-1 min-h-0 flex flex-col"
        style={{ overflow: 'hidden' }}
      >
        {/* File cards (compact, no scroll — cards stay at top) */}
        <div className="p-4 pb-0 shrink-0">
          <AnimatePresence mode="popLayout">
            {files.map((file, i) => (
              <FileCard
                key={file.id}
                file={file}
                index={i}
                isActive={i === activeFileIndex}
                steps={steps}
                totalSteps={totalSteps}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* AI Reasoning Log (fills remaining space, scrollable) */}
        <div className="flex-1 min-h-0 px-4 pb-4">
          <AuditLog files={files} steps={steps} />
        </div>
      </div>
    </motion.section>
  );
}
