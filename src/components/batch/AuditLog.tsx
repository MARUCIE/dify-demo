'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronRight, Sparkles, Check, AlertTriangle } from 'lucide-react';
import type { BatchFile, WorkflowStepDef, StepState } from '@/lib/types';

// ── Per-step reasoning templates ──
// Each step has a series of "thought" lines the AI reveals as it works.

const STEP_THOUGHTS: Record<number, string[]> = {
  1: [
    'Receiving uploaded file, verifying PDF format...',
    'Format validation passed. Extracting metadata...',
    'Page count: {{pages}}, file size: {{size}}MB',
    'Handwriting ratio: {{hw}}%, OCR confidence adjustment applied.',
  ],
  2: [
    'Extracting reimbursement date from document header...',
    'Identified date field: checking against baseline date...',
    'Computing elapsed days since reimbursement date...',
    'Expiry check complete.',
  ],
  3: [
    'Analyzing page layout boundaries with vision model...',
    'Detecting document type signatures per page...',
    'Identified sub-document boundaries, splitting PDF...',
    'Split complete: generating isolated document segments.',
  ],
  4: [
    'Initializing OCR engine (multi-modal recognition)...',
    'Processing page regions: tables, stamps, handwriting...',
    'Extracting key fields: amount, date, payee, items...',
    'Cross-validating field consistency, confidence scoring.',
  ],
  5: [
    'Parsing reception context from approval documents...',
    'Matching personnel roster against attendee list...',
    'Categorizing expense items by reception type rules...',
    'Reception type evidence aggregated.',
  ],
  6: [
    'Loading reception type classification rules...',
    'Rule matching: checking official/business/other criteria...',
    'Decision tree evaluation complete.',
    'Routing to appropriate audit standard pipeline.',
  ],
  7: [
    'Applying official reception audit standards...',
    'Checking per-capita expense limits against regulations...',
    'Validating receipt amounts against approved budget...',
    'Compliance assessment complete.',
  ],
  8: [
    'Aggregating findings from all audit checks...',
    'Categorizing issues by severity: error/warning/info...',
    'Generating remediation suggestions per finding...',
    'Audit summary compiled.',
  ],
  9: [
    'Selecting report template based on reception type...',
    'Populating structured data fields into template...',
    'Formatting tables, cross-references, and citations...',
    'Report layout validation passed.',
  ],
  10: [
    'Generating final audit conclusion...',
    'Compiling executive summary with key findings...',
    'Preparing export-ready report package...',
    'Audit workflow complete. Results ready for review.',
  ],
};

// Chinese labels for log header
const STEP_LABELS: Record<number, string> = {
  1: '文件验证',
  2: '过期判定',
  3: '单据拆分',
  4: 'OCR 识别',
  5: '类型提取',
  6: '路由判定',
  7: '标准审核',
  8: '汇总发现',
  9: '报告编排',
  10: '结果输出',
};

// ── Log entry type ──

interface LogEntry {
  id: string;
  stepId: number;
  type: 'start' | 'thought' | 'done' | 'error';
  text: string;
  timestamp: number;
}

// ── TypewriterLine — reveals text character by character ──

const TypewriterLine = memo(function TypewriterLine({
  text,
  speed = 18,
  onDone,
}: {
  text: string;
  speed?: number;
  onDone?: () => void;
}) {
  const [displayed, setDisplayed] = useState('');
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, onDone]);

  return <>{displayed}</>;
});

// ── Main AuditLog component ──

interface AuditLogProps {
  files: BatchFile[];
  steps: WorkflowStepDef[];
}

export default function AuditLog({ files, steps }: AuditLogProps) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [thoughtQueue, setThoughtQueue] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevStepRef = useRef<string>('');
  const prevStepIdRef = useRef<number>(0);
  const thoughtQueueRef = useRef<string[]>([]);
  const totalSteps = steps.length;

  // Keep ref in sync
  thoughtQueueRef.current = thoughtQueue;

  // Track active file
  const activeFile = files.find(f => f.status === 'processing');
  const activeStepId = activeFile?.currentStep ?? 0;
  const activeFileId = activeFile?.id ?? '';

  // Detect step changes and queue log entries
  useEffect(() => {
    const key = `${activeFileId}:${activeStepId}`;
    if (key === prevStepRef.current || activeStepId === 0) return;
    prevStepRef.current = key;

    const now = Date.now();
    const prevSid = prevStepIdRef.current;
    prevStepIdRef.current = activeStepId;

    // Flush remaining thoughts from previous step instantly (no typewriter)
    const leftover = thoughtQueueRef.current;
    const flushed: LogEntry[] = leftover.map((text, i) => ({
      id: `thought-flush-${prevSid}-${now}-${i}`,
      stepId: prevSid,
      type: 'thought' as const,
      text,
      timestamp: now,
    }));

    // Build batch: flushed thoughts + done marker + new step start
    const batch: LogEntry[] = [...flushed];

    if (prevSid > 0) {
      batch.push({
        id: `done-${prevSid}-${now}`,
        stepId: prevSid,
        type: 'done',
        text: `Step ${prevSid} complete`,
        timestamp: now,
      });
    }

    batch.push({
      id: `start-${activeStepId}-${now}`,
      stepId: activeStepId,
      type: 'start',
      text: `[Step ${String(activeStepId).padStart(2, '0')}] ${STEP_LABELS[activeStepId] || steps[activeStepId - 1]?.name || ''}`,
      timestamp: now,
    });

    setEntries(prev => [...prev, ...batch]);
    setIsTyping(false);

    // Queue thoughts for this step
    const thoughts = STEP_THOUGHTS[activeStepId] || [];
    const interpolated = thoughts.map(t => {
      if (!activeFile) return t;
      return t
        .replace('{{pages}}', String(activeFile.pages))
        .replace('{{size}}', (activeFile.size / 1024 / 1024).toFixed(2))
        .replace('{{hw}}', String(Math.round(activeFile.handwritingRatio * 100)));
    });
    setThoughtQueue(interpolated);
  }, [activeFileId, activeStepId, activeFile, steps]);

  // Drip-feed thoughts from queue
  useEffect(() => {
    if (thoughtQueue.length === 0 || isTyping) return;

    const nextThought = thoughtQueue[0];
    const now = Date.now();

    // Add with a small random delay to feel natural
    const delay = 300 + Math.random() * 500;
    const timer = setTimeout(() => {
      setEntries(prev => [
        ...prev,
        {
          id: `thought-${activeStepId}-${now}-${thoughtQueue.length}`,
          stepId: activeStepId,
          type: 'thought',
          text: nextThought,
          timestamp: Date.now(),
        },
      ]);
      setThoughtQueue(prev => prev.slice(1));
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [thoughtQueue, isTyping, activeStepId]);

  // Handle completed/error files
  useEffect(() => {
    const completedFile = files.find(f => f.status === 'completed' && f.result);
    if (completedFile && entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      if (lastEntry.type !== 'done' || lastEntry.stepId !== totalSteps) {
        const now = Date.now();
        setEntries(prev => [
          ...prev,
          {
            id: `done-final-${now}`,
            stepId: totalSteps,
            type: 'done',
            text: `All ${totalSteps} steps complete. Audit result: ${completedFile.result!.suggestion}`,
            timestamp: now,
          },
        ]);
      }
    }
  }, [files, entries, totalSteps]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0 && !activeFile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-2 rounded-xl flex flex-col"
      style={{
        background: 'rgba(2, 6, 23, 0.88)',
        border: '1px solid rgba(13, 148, 136, 0.2)',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-2 shrink-0"
        style={{
          borderBottom: '1px solid rgba(13, 148, 136, 0.15)',
        }}
      >
        <Terminal size={13} color="#5EEAD4" strokeWidth={2} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#5EEAD4', letterSpacing: '0.5px' }}>
          AI REASONING LOG
        </span>
        <span style={{ fontSize: 10, color: 'rgba(94, 234, 212, 0.4)', marginLeft: 'auto' }}>
          {entries.length} entries
        </span>
        {isTyping && (
          <motion.div
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#0D9488' }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-2"
        style={{ fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", monospace', fontSize: 11, lineHeight: 1.7 }}
      >
        <AnimatePresence initial={false}>
          {entries.map((entry, idx) => {
            const isLatest = idx === entries.length - 1 && entry.type === 'thought';

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 2 }}
              >
                {/* Prefix icon */}
                <span style={{ flexShrink: 0, marginTop: 2 }}>
                  {entry.type === 'start' && <Sparkles size={10} color="#FBBF24" strokeWidth={2.5} />}
                  {entry.type === 'thought' && <ChevronRight size={10} color="rgba(94, 234, 212, 0.5)" strokeWidth={2} />}
                  {entry.type === 'done' && <Check size={10} color="#34D399" strokeWidth={3} />}
                  {entry.type === 'error' && <AlertTriangle size={10} color="#F87171" strokeWidth={2.5} />}
                </span>

                {/* Text */}
                <span
                  style={{
                    color: entry.type === 'start'
                      ? '#FBBF24'
                      : entry.type === 'done'
                        ? '#34D399'
                        : entry.type === 'error'
                          ? '#F87171'
                          : 'rgba(226, 232, 240, 0.75)',
                    fontWeight: entry.type === 'start' ? 600 : 400,
                  }}
                >
                  {isLatest ? (
                    <TypewriterLine
                      text={entry.text}
                      speed={15}
                      onDone={() => setIsTyping(false)}
                    />
                  ) : (
                    entry.text
                  )}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Blinking cursor at bottom */}
        {(isTyping || activeFile) && (
          <motion.span
            style={{
              display: 'inline-block',
              width: 7,
              height: 14,
              background: '#5EEAD4',
              marginLeft: 2,
              verticalAlign: 'text-bottom',
            }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}
