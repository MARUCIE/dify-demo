'use client';

import { useReducer, useCallback, useRef, useEffect, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import {
  FileText, CheckCircle, AlertTriangle, XCircle, X,
} from 'lucide-react';
import type {
  StepState, AuditResult, AppPhase, BatchFile, BatchSummary,
} from '@/lib/types';
import { countSubDocVerdicts } from '@/lib/sub-doc-analysis';
import { WORKFLOW_STEPS, TOTAL_STEPS } from '@/lib/constants';
import { EASE_DEFAULT } from '@/lib/animations';
import Header from '@/components/layout/Header';
import StatsBar from '@/components/layout/StatsBar';
import UploadZone from '@/components/upload/UploadZone';
import WorkflowPipeline from '@/components/workflow/WorkflowPipeline';
import BatchProgress from '@/components/batch/BatchProgress';

// M1: Dynamic imports for later-phase components (code splitting)
const BatchResultsDashboard = dynamic(() => import('@/components/batch/BatchResultsDashboard'));
const ResultPanel = dynamic(() => import('@/components/result/ResultPanel'));

// -- Helpers --

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function initStepStates(): StepState[] {
  return WORKFLOW_STEPS.map(s => ({ stepId: s.id, status: 'idle' as const }));
}

let fileIdCounter = 0;
function nextFileId(): string {
  return `f-${++fileIdCounter}-${Date.now()}`;
}

// Mock metadata for demo
function randomPages(): number {
  return Math.floor(Math.random() * 10) + 3;
}
function randomHandwritingRatio(): number {
  const r = Math.random();
  // Bias towards low and high values for variety
  if (r < 0.3) return Math.random() * 0.15;
  if (r > 0.7) return 0.5 + Math.random() * 0.3;
  return 0.15 + Math.random() * 0.35;
}

function createBatchFile(file: File): BatchFile {
  return {
    id: nextFileId(),
    file,
    name: file.name,
    size: file.size,
    pages: randomPages(),
    handwritingRatio: randomHandwritingRatio(),
    status: 'queued',
    currentStep: 0,
    stepStates: initStepStates(),
    result: null,
    error: null,
  };
}

function computeSummary(files: BatchFile[]): BatchSummary {
  const completed = files.filter(f => f.status === 'completed');

  // Sub-document level aggregation
  let totalSubDocs = 0;
  let subDocPassed = 0;
  let subDocNeedsReview = 0;
  let subDocRejected = 0;

  completed.forEach(f => {
    if (f.result?.subDocuments && f.result.subDocuments.length > 0) {
      const counts = countSubDocVerdicts(f.result.subDocuments, f.result.issues);
      totalSubDocs += counts.total;
      subDocPassed += counts.pass;
      subDocNeedsReview += counts.warn;
      subDocRejected += counts.fail + counts.missing;
    }
  });

  return {
    totalFiles: files.length,
    completed: completed.length,
    totalSubDocs,
    subDocPassed,
    subDocNeedsReview,
    subDocRejected,
    passed: completed.filter(f => f.result?.suggestion === '通过').length,
    needsReview: completed.filter(f => f.result?.suggestion === '人工复核').length,
    rejected: completed.filter(f => f.result?.suggestion === '不通过').length,
    totalDuration: completed.reduce((sum, f) => sum + (f.result?.totalDuration ?? 0), 0),
  };
}

// -- State --

interface AppState {
  phase: AppPhase;
  files: BatchFile[];
  activeFileId: string | null;
  detailFileId: string | null;
  batchStartTime: number;
}

type AppAction =
  | { type: 'ADD_FILES'; newFiles: File[] }
  | { type: 'REMOVE_FILE'; id: string }
  | { type: 'START_BATCH' }
  | { type: 'FILE_START'; fileId: string }
  | { type: 'STEP_ACTIVE'; fileId: string; stepId: number; now: number }
  | { type: 'STEP_COMPLETED'; fileId: string; stepId: number; now: number }
  | { type: 'FILE_COMPLETED'; fileId: string; result: AuditResult }
  | { type: 'FILE_ERROR'; fileId: string; error: string }
  | { type: 'BATCH_DONE' }
  | { type: 'VIEW_DETAIL'; fileId: string }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'RESET' };

const INITIAL_STATE: AppState = {
  phase: 'upload',
  files: [],
  activeFileId: null,
  detailFileId: null,
  batchStartTime: 0,
};

function updateFile(files: BatchFile[], fileId: string, updater: (f: BatchFile) => BatchFile): BatchFile[] {
  return files.map(f => f.id === fileId ? updater(f) : f);
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_FILES': {
      const newBatchFiles = action.newFiles
        .filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
        .slice(0, 100 - state.files.length) // cap at 100
        .map(createBatchFile);
      return { ...state, files: [...state.files, ...newBatchFiles] };
    }

    case 'REMOVE_FILE':
      return { ...state, files: state.files.filter(f => f.id !== action.id) };

    case 'START_BATCH':
      return {
        ...state,
        phase: 'running',
        batchStartTime: performance.now(),
        files: state.files.map(f => ({
          ...f,
          status: 'queued' as const,
          currentStep: 0,
          stepStates: initStepStates(),
          result: null,
          error: null,
        })),
      };

    case 'FILE_START':
      return {
        ...state,
        activeFileId: action.fileId,
        files: updateFile(state.files, action.fileId, f => ({
          ...f,
          status: 'processing',
          currentStep: 0,
        })),
      };

    case 'STEP_ACTIVE':
      return {
        ...state,
        files: updateFile(state.files, action.fileId, f => ({
          ...f,
          currentStep: action.stepId,
          stepStates: f.stepStates.map(s =>
            s.stepId === action.stepId
              ? { ...s, status: 'active' as const, startedAt: action.now }
              : s
          ),
        })),
      };

    case 'STEP_COMPLETED':
      return {
        ...state,
        files: updateFile(state.files, action.fileId, f => ({
          ...f,
          stepStates: f.stepStates.map(s =>
            s.stepId === action.stepId
              ? { ...s, status: 'completed' as const, completedAt: action.now }
              : s
          ),
        })),
      };

    case 'FILE_COMPLETED':
      return {
        ...state,
        files: updateFile(state.files, action.fileId, f => ({
          ...f,
          status: 'completed',
          currentStep: TOTAL_STEPS,
          result: action.result,
        })),
      };

    case 'FILE_ERROR':
      return {
        ...state,
        files: updateFile(state.files, action.fileId, f => ({
          ...f,
          status: 'error',
          error: action.error,
        })),
      };

    case 'BATCH_DONE':
      return { ...state, phase: 'completed', activeFileId: null };

    case 'VIEW_DETAIL':
      return { ...state, phase: 'detail', detailFileId: action.fileId };

    case 'CLOSE_DETAIL':
      return { ...state, phase: 'completed', detailFileId: null };

    case 'RESET':
      return { ...INITIAL_STATE, files: [] };

    default:
      return state;
  }
}

// -- Component --

export default function Home() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [, startTransition] = useTransition(); // H1: non-blocking phase transitions
  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // File handlers
  const handleFilesAdd = useCallback((files: File[]) => {
    dispatch({ type: 'ADD_FILES', newFiles: files });
  }, []);

  const handleFileRemove = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_FILE', id });
  }, []);

  // Batch audit runner — calls /api/audit SSE endpoint per file
  const handleStartAudit = useCallback(async (auditDate: string) => {
    if (runningRef.current) return;
    runningRef.current = true;

    dispatch({ type: 'START_BATCH' });
    await sleep(300);

    const filesCopy = [...state.files];
    for (let fi = 0; fi < filesCopy.length; fi++) {
      const batchFile = filesCopy[fi];
      dispatch({ type: 'FILE_START', fileId: batchFile.id });
      await sleep(200);

      const fileStart = performance.now();
      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const formData = new FormData();
        formData.append('file', batchFile.file);
        formData.append('auditDate', auditDate);
        formData.append('fileIndex', String(fi));

        const response = await fetch('/api/audit', {
          method: 'POST',
          body: formData,
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: 'Request failed' }));
          dispatch({ type: 'FILE_ERROR', fileId: batchFile.id, error: errData.error || `HTTP ${response.status}` });
          continue;
        }

        if (!response.body) {
          dispatch({ type: 'FILE_ERROR', fileId: batchFile.id, error: 'No response stream' });
          continue;
        }

        // Parse SSE stream from /api/audit
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = '';
        let fileResult: AuditResult | null = null;
        let hadError = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ') && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6));

                switch (currentEvent) {
                  case 'step_start': {
                    const sid = Number(data.stepId);
                    if (sid >= 1 && sid <= TOTAL_STEPS) {
                      dispatch({
                        type: 'STEP_ACTIVE',
                        fileId: batchFile.id,
                        stepId: sid,
                        now: performance.now(),
                      });
                    }
                    break;
                  }
                  case 'step_done': {
                    const sid = Number(data.stepId);
                    if (sid >= 1 && sid <= TOTAL_STEPS) {
                      dispatch({
                        type: 'STEP_COMPLETED',
                        fileId: batchFile.id,
                        stepId: sid,
                        now: performance.now(),
                      });
                    }
                    break;
                  }
                  case 'result':
                    fileResult = data as AuditResult;
                    break;
                  case 'error':
                    hadError = true;
                    dispatch({ type: 'FILE_ERROR', fileId: batchFile.id, error: data.message });
                    break;
                }
              } catch {
                // Skip malformed SSE data
              }
              currentEvent = '';
            }
          }
        }

        const fileDuration = (performance.now() - fileStart) / 1000;
        if (fileResult) {
          dispatch({
            type: 'FILE_COMPLETED',
            fileId: batchFile.id,
            result: { ...fileResult, totalDuration: fileDuration },
          });
        } else if (!hadError) {
          dispatch({ type: 'FILE_ERROR', fileId: batchFile.id, error: 'No result received' });
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') break;
        dispatch({
          type: 'FILE_ERROR',
          fileId: batchFile.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      await sleep(300);
    }

    // Phase transitions use plain div swaps (not AnimatePresence) because
    // framer-motion 12 + React 19 breaks exit/enter sequencing.
    dispatch({ type: 'BATCH_DONE' });
    runningRef.current = false;
    abortRef.current = null;
  }, [state.files, startTransition]);

  // Detail view — H1: wrapped in startTransition for non-blocking phase change
  const handleViewDetail = useCallback((fileId: string) => {
    startTransition(() => dispatch({ type: 'VIEW_DETAIL', fileId }));
  }, [startTransition]);

  const handleCloseDetail = useCallback(() => {
    startTransition(() => dispatch({ type: 'CLOSE_DETAIL' }));
  }, [startTransition]);

  // Reset — abort any running request + H1: wrapped in startTransition
  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    runningRef.current = false;
    startTransition(() => dispatch({ type: 'RESET' }));
  }, [startTransition]);

  // Derived state
  const activeFile = state.files.find(f => f.id === state.activeFileId);
  const detailFile = state.files.find(f => f.id === state.detailFileId);
  const summary = computeSummary(state.files);
  const completedCount = state.files.filter(f => f.status === 'completed').length;
  const progressPercent = state.files.length > 0
    ? Math.round((completedCount / state.files.length) * 100)
    : 0;

  // C5: Escape key + focus trap for detail overlay
  useEffect(() => {
    if (state.phase !== 'detail') return;

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement | null;
    if (!dialog) return;

    // Move focus into dialog
    const closeBtn = dialog.querySelector('button') as HTMLElement | null;
    closeBtn?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseDetail();
        return;
      }
      // Focus trap: cycle Tab within dialog
      if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.phase, handleCloseDetail]);

  // C6: Status text for ARIA live region
  const ariaStatus = state.phase === 'running' && activeFile
    ? `审核中: ${activeFile.name}, 步骤 ${activeFile.currentStep}/${TOTAL_STEPS}, 已完成 ${completedCount}/${state.files.length} 个文件`
    : state.phase === 'completed'
      ? summary.totalSubDocs > 0
        ? `审核完成: ${completedCount} 个文件, ${summary.totalSubDocs} 份单据, 通过 ${summary.subDocPassed}, 待复核 ${summary.subDocNeedsReview}, 不通过 ${summary.subDocRejected}`
        : `审核完成: ${completedCount} 个文件, 通过 ${summary.passed}, 人工复核 ${summary.needsReview}, 不通过 ${summary.rejected}`
      : '';

  return (
    <MotionConfig reducedMotion="user">
    <div className="h-full flex flex-col">

      {/* C6: ARIA live region for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {ariaStatus}
      </div>
        {/* Header - always visible, compact */}
        <div className="shrink-0 px-8 pt-4">
          <Header backHref="/" backLabel="返回平台" />
        </div>

        {/* Phase content - fills remaining space */}
        <main id="main-content" className="flex-1 min-h-0 px-8 pb-4 flex flex-col">
            {/* ======== PHASE 1: UPLOAD ======== */}
            {state.phase === 'upload' && (
              <div className="flex-1 flex flex-col">
                <StatsBar />
                <div className="flex-1 min-h-0 flex flex-col">
                  <UploadZone
                    files={state.files}
                    onFilesAdd={handleFilesAdd}
                    onFileRemove={handleFileRemove}
                    onStartAudit={handleStartAudit}
                    disabled={false}
                  />
                </div>
              </div>
            )}

            {/* ======== PHASE 2: RUNNING ======== */}
            {state.phase === 'running' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Collapsed upload summary bar */}
                <div
                  className="glass rounded-xl px-5 py-3 mb-4 shrink-0"
                  style={{ borderLeft: '3px solid #0D9488' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={16} color="#0D9488" strokeWidth={2} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {state.files.length} 个文件
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        已完成 {completedCount}/{state.files.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="progress-bar" style={{ width: 160 }}>
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <span
                        className="stat-number text-glow-blue"
                        style={{ fontSize: 16, fontWeight: 700, color: '#0D9488' }}
                      >
                        {progressPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Split panels: Workflow + Batch Progress */}
                <div className="flex-1 min-h-0 flex gap-4">
                  {/* Left: Workflow Pipeline for active file */}
                  <div className="flex-[3] min-h-0 overflow-auto">
                    {activeFile && (
                      <WorkflowPipeline
                        steps={WORKFLOW_STEPS}
                        stepStates={activeFile.stepStates}
                      />
                    )}
                  </div>

                  {/* Right: Batch Progress */}
                  <div className="flex-[2] min-h-0 overflow-auto">
                    <BatchProgress
                      files={state.files}
                      steps={WORKFLOW_STEPS}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ======== PHASE 3: COMPLETED ======== */}
            {(state.phase === 'completed' || state.phase === 'detail') && (
              <div className="flex-1 min-h-0 overflow-auto">
                <BatchResultsDashboard
                  files={state.files}
                  summary={summary}
                  onViewDetail={handleViewDetail}
                  onReset={handleReset}
                />
              </div>
            )}
        </main>

        {/* Footer - only in upload phase */}
        {state.phase === 'upload' && (
          <div
            className="shrink-0 text-center py-3 px-8"
            style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.8 }}
          >
            <span>路桥报销审核智能体 v2.0 -- Dify Workflow Demo</span>
            <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>|</span>
            <span>Maurice | maurice_wen@proton.me</span>
          </div>
        )}

      {/* ======== PHASE 4: DETAIL OVERLAY ======== */}
      <AnimatePresence>
        {state.phase === 'detail' && detailFile?.result && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label={`审核详情: ${detailFile.name}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'var(--overlay-bg, rgba(2,6,23,0.85))', backdropFilter: 'blur(8px)' }}
              onClick={handleCloseDetail}
              aria-hidden="true"
            />

            {/* Detail panel */}
            <motion.div
              className="relative w-full max-w-3xl max-h-[85vh] overflow-auto mx-4"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              transition={{ duration: 0.3, ease: EASE_DEFAULT }}
            >
              {/* Close button */}
              <button
                onClick={handleCloseDetail}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg"
                aria-label="关闭详情"
                type="button"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} strokeWidth={2} />
              </button>

              {/* File name header */}
              <div
                className="glass-bright rounded-t-2xl px-8 py-4"
                style={{ borderBottom: '1px solid rgba(13,148,136,0.1)' }}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} color="#0D9488" strokeWidth={2} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {detailFile.name}
                  </span>
                  {detailFile.handwritingRatio > 0.4 && (
                    <span className="badge badge-amber" style={{ fontSize: 11 }}>
                      手写为主 ({Math.round(detailFile.handwritingRatio * 100)}%)
                    </span>
                  )}
                </div>
              </div>

              <ResultPanel result={detailFile.result} onReset={handleCloseDetail} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}
