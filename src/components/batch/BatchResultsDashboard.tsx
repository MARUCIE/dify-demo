'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, AlertTriangle, XCircle, FileText,
  ExternalLink, Download, Copy, RotateCcw,
  Clock, Scissors, Search, ArrowUpDown,
  ChevronUp, ChevronDown, ChevronRight, Check,
  Info, Sparkles,
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { BatchFile, BatchSummary, AuditSuggestion, AuditIssue, IssueSeverity } from '@/lib/types';
import { SUB_DOC_TYPES } from '@/lib/types';
import { SUGGESTION_BADGE } from '@/lib/constants';
import { DURATION, EASE_DEFAULT } from '@/lib/animations';
import {
  countSubDocVerdicts,
  analyzeSubDocuments,
  generateBatchAnalysis,
  type SubDocCounts,
  type SubDocVerdict,
} from '@/lib/sub-doc-analysis';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BatchResultsDashboardProps {
  files: BatchFile[];
  summary: BatchSummary;
  onViewDetail: (fileId: string) => void;
  onReset: () => void;
}

// ---------------------------------------------------------------------------
// Animated counter hook
// ---------------------------------------------------------------------------

function useAnimatedCounter(target: number, duration = 800): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return value;
}

// ---------------------------------------------------------------------------
// Summary card definitions (3 cards: pass / review / reject)
// ---------------------------------------------------------------------------

interface SummaryCardDef {
  label: string;
  key: 'passed' | 'needsReview' | 'rejected';
  color: string;
  glowClass: string;
  gradientFrom: string;
  gradientTo: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
}

const SUMMARY_CARDS: SummaryCardDef[] = [
  {
    label: '通过',
    key: 'passed',
    color: '#059669',
    glowClass: 'glow-green',
    gradientFrom: 'rgba(34,197,94,0.15)',
    gradientTo: 'rgba(34,197,94,0.03)',
    Icon: CheckCircle,
  },
  {
    label: '待复核',
    key: 'needsReview',
    color: '#D97706',
    glowClass: 'glow-amber',
    gradientFrom: 'rgba(245,158,11,0.15)',
    gradientTo: 'rgba(245,158,11,0.03)',
    Icon: AlertTriangle,
  },
  {
    label: '不通过',
    key: 'rejected',
    color: '#DC2626',
    glowClass: 'glow-red',
    gradientFrom: 'rgba(239,68,68,0.15)',
    gradientTo: 'rgba(239,68,68,0.03)',
    Icon: XCircle,
  },
];

// ---------------------------------------------------------------------------
// Severity config (reused from IssueCard pattern)
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<IssueSeverity, {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  iconColor: string;
  iconBg: string;
  textColor: string;
  badgeClass: string;
  label: string;
}> = {
  error: {
    Icon: XCircle,
    iconColor: '#DC2626',
    iconBg: 'rgba(239,68,68,0.1)',
    textColor: '#DC2626',
    badgeClass: 'badge-red',
    label: '严重',
  },
  warning: {
    Icon: AlertTriangle,
    iconColor: '#D97706',
    iconBg: 'rgba(245,158,11,0.1)',
    textColor: '#D97706',
    badgeClass: 'badge-amber',
    label: '警告',
  },
  info: {
    Icon: Info,
    iconColor: '#0D9488',
    iconBg: 'rgba(59,130,246,0.1)',
    textColor: '#0D9488',
    badgeClass: 'badge-blue',
    label: '提示',
  },
};

// ---------------------------------------------------------------------------
// Sub-doc verdict colors
// ---------------------------------------------------------------------------

const VERDICT_DOT_COLOR: Record<SubDocVerdict, string> = {
  pass: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  missing: '#DC2626',
};

const VERDICT_LABEL: Record<SubDocVerdict, string> = {
  pass: '齐全',
  warning: '警告',
  error: '异常',
  missing: '缺失',
};

// ---------------------------------------------------------------------------
// Sortable columns
// ---------------------------------------------------------------------------

type SortField = 'index' | 'name' | 'subDocs' | 'receptionType' | 'suggestion' | 'issueCount';
type SortDir = 'asc' | 'desc';

const SUGGESTION_ORDER: Record<AuditSuggestion, number> = {
  '不通过': 0,
  '人工复核': 1,
  '通过': 2,
};

function compareBySuggestion(a: BatchFile, b: BatchFile): number {
  const sa = a.result?.suggestion;
  const sb = b.result?.suggestion;
  if (!sa && !sb) return 0;
  if (!sa) return 1;
  if (!sb) return -1;
  return SUGGESTION_ORDER[sa] - SUGGESTION_ORDER[sb];
}

// ---------------------------------------------------------------------------
// Row background tint based on suggestion
// ---------------------------------------------------------------------------

function getRowBackgroundTint(suggestion?: AuditSuggestion): string | undefined {
  if (suggestion === '不通过') return 'rgba(239,68,68,0.04)';
  if (suggestion === '人工复核') return 'rgba(245,158,11,0.04)';
  return undefined;
}

// ---------------------------------------------------------------------------
// Threshold for virtual scrolling vs plain rendering
// ---------------------------------------------------------------------------

const VIRTUAL_THRESHOLD = 50;
const ROW_HEIGHT = 48;
const VISIBLE_ROWS = 10;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function formatSummaryText(files: BatchFile[], summary: BatchSummary): string {
  const lines: string[] = [
    '===== 批量审核汇总 =====',
    `总文件数: ${summary.totalFiles}`,
    `总单据数: ${summary.totalSubDocs}`,
    `单据通过: ${summary.subDocPassed}  |  待复核: ${summary.subDocNeedsReview}  |  不通过: ${summary.subDocRejected}`,
    `总耗时: ${summary.totalDuration.toFixed(1)}秒`,
    '',
    '--- 明细 ---',
  ];
  files.forEach((f, i) => {
    const s = f.result?.suggestion ?? '--';
    const issues = f.result?.issues.length ?? 0;
    const subDocs = f.result?.subDocuments?.length ?? 0;
    lines.push(`${i + 1}. ${f.name}  |  ${s}  |  ${subDocs}份单据  |  ${issues}个问题`);
  });
  return lines.join('\n');
}

export default function BatchResultsDashboard({
  files,
  summary,
  onViewDetail,
  onReset,
}: BatchResultsDashboardProps) {
  const [sortField, setSortField] = useState<SortField>('suggestion');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [copied, setCopied] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Compute per-file sub-doc counts
  const fileSubDocMap = useMemo(() => {
    const map = new Map<string, SubDocCounts>();
    files.forEach(f => {
      if (f.result?.subDocuments && f.result.subDocuments.length > 0) {
        map.set(f.id, countSubDocVerdicts(f.result.subDocuments, f.result.issues));
      }
    });
    return map;
  }, [files]);

  // Determine display values: sub-doc level when available, else file level
  const hasSubDocs = summary.totalSubDocs > 0;
  const displayTotal = hasSubDocs ? summary.totalSubDocs : summary.totalFiles;
  const displayValues: Record<string, number> = {
    passed: hasSubDocs ? summary.subDocPassed : summary.passed,
    needsReview: hasSubDocs ? summary.subDocNeedsReview : summary.needsReview,
    rejected: hasSubDocs ? summary.subDocRejected : summary.rejected,
  };

  // Batch AI analysis text
  const batchAnalysisText = useMemo(() => {
    const completedWithIssues = files.filter(
      f => f.result && f.result.issues.length > 0,
    );
    if (completedWithIssues.length === 0) return '';
    return generateBatchAnalysis(files);
  }, [files]);

  // Auto-expand: files with '不通过' or error-severity issues
  useEffect(() => {
    const autoExpand = new Set<string>();
    files.forEach(f => {
      if (!f.result) return;
      if (f.result.suggestion === '不通过') {
        autoExpand.add(f.id);
      } else if (f.result.issues.some(i => i.severity === 'error')) {
        autoExpand.add(f.id);
      }
    });
    if (autoExpand.size > 0) {
      setExpandedIds(autoExpand);
    }
  }, [files]);

  const handleCopySummary = useCallback(async () => {
    const text = formatSummaryText(files, summary);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [files, summary]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const sortedFiles = useMemo(() => {
    const sorted = [...files];
    const dir = sortDir === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      switch (sortField) {
        case 'index':
          return dir * (files.indexOf(a) - files.indexOf(b));
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'subDocs': {
          const ca = fileSubDocMap.get(a.id);
          const cb = fileSubDocMap.get(b.id);
          const va = ca ? (ca.fail + ca.missing + ca.warn) : 0;
          const vb = cb ? (cb.fail + cb.missing + cb.warn) : 0;
          return dir * (va - vb);
        }
        case 'receptionType': {
          const ra = a.result?.receptionType ?? '';
          const rb = b.result?.receptionType ?? '';
          return dir * ra.localeCompare(rb);
        }
        case 'suggestion':
          return dir * compareBySuggestion(a, b);
        case 'issueCount': {
          const ia = a.result?.issues.length ?? 0;
          const ib = b.result?.issues.length ?? 0;
          return dir * (ia - ib);
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [files, sortField, sortDir, fileSubDocMap]);

  const totalIssues = files.reduce(
    (sum, f) => sum + (f.result?.issues.length ?? 0),
    0,
  );

  const toggleExpand = useCallback((fileId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const allExpanded = sortedFiles.length > 0 && sortedFiles.every(f => expandedIds.has(f.id));

  const toggleAllExpand = useCallback(() => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(sortedFiles.map(f => f.id)));
    }
  }, [allExpanded, sortedFiles]);

  const useVirtual = files.length >= VIRTUAL_THRESHOLD;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slower, ease: EASE_DEFAULT }}
    >
      {/* -- Section header (compact single-line) -- */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CheckCircle size={18} color="#059669" strokeWidth={2.5} />
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>批量审核结果</h2>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {hasSubDocs
              ? `${summary.totalSubDocs} 份单据 · ${summary.completed} 个文件 · ${totalIssues} 个问题`
              : `${summary.completed}/${summary.totalFiles} 个文件`
            }
          </span>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          耗时 <b style={{ color: 'var(--text-primary)' }}>{summary.totalDuration.toFixed(1)}s</b>
        </span>
      </div>

      <div className="glass-bright rounded-2xl overflow-hidden success-shimmer">
        {/* -- Top row: 3 summary cards (sub-doc level) -- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            padding: '10px 24px',
            borderBottom: '1px solid rgba(13,148,136,0.2)',
          }}
        >
          {SUMMARY_CARDS.map((card, i) => (
            <SummaryCard
              key={card.key}
              def={card}
              value={displayValues[card.key]}
              total={displayTotal}
              unit={hasSubDocs ? '份' : '个'}
              index={i}
            />
          ))}
        </div>

        {/* -- Batch AI Analysis Card -- */}
        {batchAnalysisText && (
          <div
            className="flex items-start gap-2"
            style={{
              margin: '0',
              padding: '8px 24px',
              borderBottom: '1px solid rgba(13,148,136,0.2)',
              background: 'rgba(13,148,136,0.03)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            <Sparkles size={13} color="#0D9488" strokeWidth={2} className="shrink-0 mt-0.5" />
            <span>{batchAnalysisText}</span>
          </div>
        )}

        {/* -- Results list -- */}
        {useVirtual ? (
          <VirtualResultsTable
            sortedFiles={sortedFiles}
            allFiles={files}
            fileSubDocMap={fileSubDocMap}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            onViewDetail={onViewDetail}
          />
        ) : (
          <AccordionFileList
            sortedFiles={sortedFiles}
            allFiles={files}
            fileSubDocMap={fileSubDocMap}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            onViewDetail={onViewDetail}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            allExpanded={allExpanded}
            onToggleAll={toggleAllExpand}
          />
        )}

        {/* -- Bottom action bar -- */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(13,148,136,0.2)',
          }}
        >
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={handleCopySummary}>
              {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
              {copied ? '已复制' : '复制汇总'}
            </button>
            <button className="btn-secondary" disabled title="即将上线">
              <Download size={14} strokeWidth={2} />
              导出报告
            </button>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            style={{ padding: '10px 28px', fontSize: 14 }}
            onClick={onReset}
          >
            <RotateCcw size={16} strokeWidth={2} />
            重新审核
          </button>
        </div>
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Accordion file list (< 50 files, default)
// ---------------------------------------------------------------------------

interface AccordionFileListProps {
  sortedFiles: BatchFile[];
  allFiles: BatchFile[];
  fileSubDocMap: Map<string, SubDocCounts>;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onViewDetail: (fileId: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (fileId: string) => void;
  allExpanded: boolean;
  onToggleAll: () => void;
}

function AccordionFileList({
  sortedFiles,
  allFiles,
  fileSubDocMap,
  sortField,
  sortDir,
  onSort,
  onViewDetail,
  expandedIds,
  onToggleExpand,
  allExpanded,
  onToggleAll,
}: AccordionFileListProps) {
  return (
    <div style={{ padding: '16px 24px' }}>
      {/* Header row with expand/collapse toggle */}
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          审核明细
        </p>
        <button
          type="button"
          onClick={onToggleAll}
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            fontWeight: 500,
            background: 'none',
            border: '1px solid rgba(13,148,136,0.15)',
            borderRadius: 6,
            padding: '4px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {allExpanded ? '全部收起' : '全部展开'}
        </button>
      </div>

      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr 180px 100px 100px 70px 48px',
          gap: 12,
          padding: '10px 16px',
          borderRadius: 8,
          background: 'rgba(13,148,136,0.04)',
          marginBottom: 8,
        }}
      >
        <SortableHeader label="序号" field="index" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="文件名" field="name" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="单据审核" field="subDocs" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="招待类型" field="receptionType" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="审核建议" field="suggestion" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="问题数" field="issueCount" current={sortField} dir={sortDir} onSort={onSort} />
        <span />
      </div>

      {/* Accordion rows */}
      {sortedFiles.map((file, idx) => (
        <AccordionRow
          key={file.id}
          file={file}
          displayIndex={allFiles.indexOf(file)}
          animIndex={idx}
          subDocCounts={fileSubDocMap.get(file.id)}
          isExpanded={expandedIds.has(file.id)}
          onToggle={() => onToggleExpand(file.id)}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Accordion row (collapsed + expandable)
// ---------------------------------------------------------------------------

interface AccordionRowProps {
  file: BatchFile;
  displayIndex: number;
  animIndex: number;
  subDocCounts?: SubDocCounts;
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetail: (fileId: string) => void;
}

function AccordionRow({
  file,
  displayIndex,
  animIndex,
  subDocCounts,
  isExpanded,
  onToggle,
  onViewDetail,
}: AccordionRowProps) {
  const suggestion = file.result?.suggestion;
  const issueCount = file.result?.issues.length ?? 0;
  const receptionType = file.result?.receptionType ?? '--';
  const bgTint = getRowBackgroundTint(suggestion);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 + animIndex * 0.04 }}
      style={{ marginBottom: 4 }}
    >
      {/* Collapsed row */}
      <div
        className="glass rounded-lg"
        role="button"
        tabIndex={0}
        aria-label={`${isExpanded ? '收起' : '展开'} ${file.name} 审核详情`}
        aria-expanded={isExpanded}
        onClick={onToggle}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr 180px 100px 100px 70px 48px',
          gap: 12,
          padding: '10px 16px',
          height: 44,
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          background: bgTint,
          borderBottomLeftRadius: isExpanded ? 0 : undefined,
          borderBottomRightRadius: isExpanded ? 0 : undefined,
        }}
      >
        {/* Index */}
        <span
          className="stat-number"
          style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}
        >
          {displayIndex + 1}
        </span>

        {/* File name */}
        <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
          <FileText size={14} color="var(--text-muted)" strokeWidth={2} className="shrink-0" />
          <span
            style={{
              fontSize: 13,
              color: 'var(--text-primary)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {file.name}
          </span>
        </div>

        {/* Sub-document breakdown */}
        <div>
          {subDocCounts ? (
            <SubDocBar counts={subDocCounts} />
          ) : (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>--</span>
          )}
        </div>

        {/* Reception type */}
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {receptionType}
        </span>

        {/* Suggestion badge */}
        <div>
          {suggestion ? (
            <span
              className={`badge ${SUGGESTION_BADGE[suggestion].cls}`}
              style={{ fontSize: 11, padding: '3px 10px' }}
            >
              {SUGGESTION_BADGE[suggestion].label}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>--</span>
          )}
        </div>

        {/* Issue count */}
        <span
          className="stat-number"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: issueCount > 0 ? '#DC2626' : '#059669',
            textAlign: 'right',
          }}
        >
          {file.status === 'error' ? '--' : issueCount}
        </span>

        {/* Chevron toggle */}
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} color="var(--text-secondary)" strokeWidth={2} />
          </motion.div>
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {isExpanded && file.result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <ExpandedPanel
              file={file}
              onViewDetail={onViewDetail}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Expanded panel (sub-doc grid + issues + AI summary)
// ---------------------------------------------------------------------------

interface ExpandedPanelProps {
  file: BatchFile;
  onViewDetail: (fileId: string) => void;
}

function ExpandedPanel({ file, onViewDetail }: ExpandedPanelProps) {
  const result = file.result!;
  const subDocuments = result.subDocuments ?? [];
  const hasSubDocData = subDocuments.length > 0;
  const [thinkingExpanded, setThinkingExpanded] = useState(false);

  // Filter out info-level "合规" items — only show actual violations
  const displayIssues = useMemo(() =>
    result.issues.filter(i => i.severity !== 'info'),
    [result.issues],
  );

  // Analyze sub-documents for detailed display
  const subDocAnalysis = useMemo(() => {
    if (!hasSubDocData) return null;
    return analyzeSubDocuments(subDocuments, result.issues);
  }, [hasSubDocData, subDocuments, result.issues]);

  // Generate or use existing AI summary
  const aiSummary = useMemo(() => {
    if (result.aiSummary) return result.aiSummary;
    // Fall back to generating from structured data
    const errors = result.issues.filter(i => i.severity === 'error');
    const warnings = result.issues.filter(i => i.severity === 'warning');
    const violationCount = errors.length + warnings.length;
    if (violationCount === 0) {
      return `该报销包审核通过，未发现合规问题。接待类型: ${result.receptionType}。`;
    }
    const parts: string[] = [];
    const counts: string[] = [];
    if (errors.length > 0) counts.push(`${errors.length}个严重问题`);
    if (warnings.length > 0) counts.push(`${warnings.length}个警告`);
    parts.push(`该报销包存在${counts.join('、')}。`);
    if (errors.length > 0) {
      parts.push(`最关键的问题: ${errors[0].message}。`);
    }
    if (result.suggestion === '不通过') {
      parts.push('建议退回补充材料后重新提交。');
    } else if (result.suggestion === '人工复核') {
      parts.push('建议人工复核上述问题后决定是否通过。');
    }
    return parts.join('');
  }, [result]);

  return (
    <div
      style={{
        padding: '16px 20px 20px',
        background: 'rgba(13,148,136,0.02)',
        borderLeft: '1px solid rgba(13,148,136,0.08)',
        borderRight: '1px solid rgba(13,148,136,0.08)',
        borderBottom: '1px solid rgba(13,148,136,0.08)',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
      }}
    >
      {/* Sub-document status grid */}
      {hasSubDocData && subDocAnalysis && (
        <div style={{ marginBottom: 16 }}>
          <p style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 10,
          }}>
            单据状态
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {subDocAnalysis.analyses.map((sa) => {
              const dotColor = VERDICT_DOT_COLOR[sa.verdict];
              const verdictLabel = VERDICT_LABEL[sa.verdict];
              return (
                <div
                  key={sa.doc.type}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(13,148,136,0.1)',
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: dotColor,
                      display: 'inline-block',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {sa.doc.type}
                  </span>
                  <span style={{ color: dotColor, fontSize: 11, fontWeight: 600 }}>
                    {verdictLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Issue list (violations only) */}
      {displayIssues.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 10,
          }}>
            问题列表 ({displayIssues.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {displayIssues.map((issue, idx) => (
              <InlineIssue key={idx} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 8,
            background: 'rgba(13,148,136,0.05)',
            border: '1px solid rgba(13,148,136,0.1)',
          }}
        >
          <div className="flex items-start gap-2">
            <Sparkles
              size={14}
              color="#0D9488"
              strokeWidth={2}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <p style={{
              fontSize: 12,
              color: 'var(--text-primary)',
              lineHeight: 1.7,
            }}>
              {aiSummary}
            </p>
          </div>
        </div>
      )}

      {/* Thinking Process (思考过程) — collapsible */}
      {result.rawOutput && (
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setThinkingExpanded(!thinkingExpanded);
            }}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 8,
              background: thinkingExpanded
                ? 'rgba(13,148,136,0.06)'
                : 'rgba(248,250,252,0.8)',
              border: thinkingExpanded
                ? '1px solid rgba(13,148,136,0.18)'
                : '1px solid rgba(226,232,240,0.6)',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: thinkingExpanded
                ? 'rgba(13,148,136,0.12)'
                : 'rgba(100,116,139,0.08)',
              flexShrink: 0,
            }}>
              <Info size={12} color={thinkingExpanded ? '#0D9488' : '#94A3B8'} strokeWidth={2} />
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600, flex: 1,
              color: thinkingExpanded ? '#0D9488' : 'var(--text-secondary)',
            }}>
              思考过程
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6, fontSize: 11 }}>
                已深度思考 {result.totalDuration.toFixed(1)}s
              </span>
            </span>
            <span style={{
              fontSize: 11, fontWeight: 500,
              color: thinkingExpanded ? '#0D9488' : '#94A3B8',
            }}>
              {thinkingExpanded ? '收起' : '展开'}
            </span>
            <motion.div
              animate={{ rotate: thinkingExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ flexShrink: 0, color: thinkingExpanded ? '#0D9488' : 'var(--text-muted)' }}
            >
              <ChevronRight size={12} strokeWidth={2} />
            </motion.div>
          </button>

          <AnimatePresence>
            {thinkingExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <div
                  style={{
                    marginTop: 8, padding: '16px 20px', borderRadius: 8,
                    background: 'rgba(248,250,252,0.6)',
                    border: '1px solid rgba(226,232,240,0.6)',
                    fontSize: 12, lineHeight: 1.8,
                    color: 'var(--text-primary)',
                    maxHeight: 400, overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {result.rawOutput.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={i} style={{ height: 4 }} />;
                    if (/^#{1,3}\s+/.test(trimmed)) {
                      return <p key={i} style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{trimmed.replace(/^#{1,3}\s+/, '')}</p>;
                    }
                    if (/^[一二三四五六七八九十]+[、.]/.test(trimmed)) {
                      return <p key={i} style={{ fontSize: 13, fontWeight: 700, marginTop: 12, marginBottom: 4, paddingBottom: 3, borderBottom: '1px solid rgba(226,232,240,0.5)' }}>{trimmed}</p>;
                    }
                    if (/^\d+\.\s*[\[【]/.test(trimmed)) {
                      return <p key={i} style={{ fontSize: 12, fontWeight: 600, color: '#0D9488', marginTop: 8, marginBottom: 2 }}>{trimmed}</p>;
                    }
                    if (/^[•\-*]\s+/.test(trimmed)) {
                      const text = trimmed.replace(/^[•\-*]\s+/, '');
                      const isViolation = /违规|违反|需复核|需关注/.test(text);
                      const color = isViolation ? '#DC2626' : '#64748B';
                      const weight = isViolation ? 600 : 400;
                      // Highlight (违规)/(合规) suffix
                      const parts = text.match(/^(.+?)(（[^）]+）)([。.]*$)/);
                      if (parts) {
                        const suffixColor = isViolation ? '#DC2626' : '#059669';
                        return <p key={i} style={{ paddingLeft: 12, marginTop: 2, color, fontWeight: weight }}>• {parts[1]}<span style={{ color: suffixColor, fontWeight: 500 }}>{parts[2]}</span>{parts[3]}</p>;
                      }
                      return <p key={i} style={{ paddingLeft: 12, marginTop: 2, color, fontWeight: weight }}>• {text}</p>;
                    }
                    return <p key={i} style={{ marginTop: 1, color: 'var(--text-secondary)' }}>{trimmed}</p>;
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Detail link */}
      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <button
          type="button"
          className="flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(file.id);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            color: '#0D9488',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            transition: 'opacity 0.15s',
          }}
        >
          <ExternalLink size={12} strokeWidth={2} />
          查看完整详情
          <ChevronRight size={12} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline issue (compact format for expanded row)
// ---------------------------------------------------------------------------

function InlineIssue({ issue }: { issue: AuditIssue }) {
  const config = SEVERITY_CONFIG[issue.severity];
  const { Icon } = config;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.5)',
        border: `1px solid ${config.iconColor}15`,
      }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 22,
          height: 22,
          borderRadius: 5,
          background: config.iconBg,
          marginTop: 1,
        }}
      >
        <Icon size={12} color={config.iconColor} strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-2">
          <span
            className={`badge ${config.badgeClass}`}
            style={{ fontSize: 10, padding: '1px 6px', lineHeight: '16px' }}
          >
            {config.label}
          </span>
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
          }}>
            {issue.message}
          </span>
        </div>
        {issue.detail && (
          <p style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            marginTop: 3,
            paddingLeft: 0,
            lineHeight: 1.5,
          }}>
            {issue.detail}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Virtual results table (>= 50 files fallback, flat rows without accordion)
// ---------------------------------------------------------------------------

interface VirtualResultsTableProps {
  sortedFiles: BatchFile[];
  allFiles: BatchFile[];
  fileSubDocMap: Map<string, SubDocCounts>;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onViewDetail: (fileId: string) => void;
}

function VirtualResultsTable({
  sortedFiles,
  allFiles,
  fileSubDocMap,
  sortField,
  sortDir,
  onSort,
  onViewDetail,
}: VirtualResultsTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // TanStack Virtual is intentional here; opt this component out of React Compiler advice.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: sortedFiles.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const needsScroll = sortedFiles.length > VISIBLE_ROWS;

  return (
    <div style={{ padding: '16px 24px' }}>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 16,
        }}
      >
        审核明细
      </p>

      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '48px 1fr 180px 100px 100px 70px 90px',
          gap: 12,
          padding: '10px 16px',
          borderRadius: 8,
          background: 'rgba(13,148,136,0.04)',
          marginBottom: 8,
        }}
      >
        <SortableHeader label="序号" field="index" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="文件名" field="name" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="单据审核" field="subDocs" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="招待类型" field="receptionType" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="审核建议" field="suggestion" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="问题数" field="issueCount" current={sortField} dir={sortDir} onSort={onSort} />
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          操作
        </span>
      </div>

      {/* Virtualized table rows */}
      <div
        ref={scrollRef}
        style={{
          maxHeight: needsScroll ? ROW_HEIGHT * VISIBLE_ROWS : undefined,
          overflowY: needsScroll ? 'auto' : undefined,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const file = sortedFiles[virtualRow.index];
            return (
              <div
                key={file.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <FlatResultRow
                  file={file}
                  displayIndex={allFiles.indexOf(file)}
                  animIndex={virtualRow.index}
                  subDocCounts={fileSubDocMap.get(file.id)}
                  onViewDetail={onViewDetail}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flat result row (used by virtual table for >= 50 files)
// ---------------------------------------------------------------------------

interface FlatResultRowProps {
  file: BatchFile;
  displayIndex: number;
  animIndex: number;
  subDocCounts?: SubDocCounts;
  onViewDetail: (fileId: string) => void;
}

function FlatResultRow({ file, displayIndex, animIndex, subDocCounts, onViewDetail }: FlatResultRowProps) {
  const suggestion = file.result?.suggestion;
  const issueCount = file.result?.issues.length ?? 0;
  const receptionType = file.result?.receptionType ?? '--';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + animIndex * 0.06 }}
      className="glass rounded-lg"
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 1fr 180px 100px 100px 70px 90px',
        gap: 12,
        padding: '10px 16px',
        height: ROW_HEIGHT - 4,
        marginBottom: 4,
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      role="button"
      tabIndex={0}
      aria-label={`查看 ${file.name} 审核详情`}
      onClick={() => onViewDetail(file.id)}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewDetail(file.id); } }}
      whileHover={{
        x: 4,
        transition: { duration: 0.15 },
      }}
    >
      {/* Index */}
      <span
        className="stat-number"
        style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}
      >
        {displayIndex + 1}
      </span>

      {/* File name */}
      <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
        <FileText size={14} color="var(--text-muted)" strokeWidth={2} className="shrink-0" />
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-primary)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {file.name}
        </span>
      </div>

      {/* Sub-document breakdown */}
      <div>
        {subDocCounts ? (
          <SubDocBar counts={subDocCounts} />
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>--</span>
        )}
      </div>

      {/* Reception type */}
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        {receptionType}
      </span>

      {/* Suggestion badge */}
      <div>
        {suggestion ? (
          <span
            className={`badge ${SUGGESTION_BADGE[suggestion].cls}`}
            style={{ fontSize: 11, padding: '3px 10px' }}
          >
            {SUGGESTION_BADGE[suggestion].label}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>--</span>
        )}
      </div>

      {/* Issue count */}
      <span
        className="stat-number"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: issueCount > 0 ? '#DC2626' : '#059669',
          textAlign: 'right',
        }}
      >
        {file.status === 'error' ? '--' : issueCount}
      </span>

      {/* Action */}
      <div style={{ textAlign: 'center' }}>
        <button
          className="btn-secondary"
          style={{
            padding: '4px 12px',
            fontSize: 11,
            display: 'inline-flex',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(file.id);
          }}
        >
          <ExternalLink size={12} strokeWidth={2} />
          详情
        </button>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Summary card (with gradient background + animated counter)
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  def: SummaryCardDef;
  value: number;
  total: number;
  unit: string;
  index: number;
}

function SummaryCard({ def, value, total, unit, index }: SummaryCardProps) {
  const animatedValue = useAnimatedCounter(value, 900);
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const animatedPercent = useAnimatedCounter(
    Math.round(percentage),
    1000,
  );

  return (
    <motion.div
      className={`glass rounded-lg ${def.glowClass}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DURATION.slow, delay: index * 0.1 }}
      style={{
        padding: '8px 14px',
        background: `linear-gradient(145deg, ${def.gradientFrom}, ${def.gradientTo})`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <def.Icon size={16} color={def.color} strokeWidth={2.2} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
        {def.label}
      </span>
      <span
        className="stat-number"
        style={{ fontSize: 22, fontWeight: 800, color: def.color, lineHeight: 1, marginLeft: 'auto' }}
      >
        {animatedValue}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: `${def.color}99` }}>
        {animatedPercent}%
      </span>
      {/* Inline percentage bar */}
      <div className="progress-bar" style={{ height: 3, width: 40, flexShrink: 0 }}>
        <motion.div
          style={{ height: '100%', borderRadius: 2, background: def.color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stat cell (stats row)
// ---------------------------------------------------------------------------

interface StatCellProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  color: string;
  decimals?: number;
  index: number;
}

function StatCell({ icon, label, value, suffix, color, decimals = 0, index }: StatCellProps) {
  const animated = useAnimatedCounter(
    decimals > 0 ? Math.round(value * 10) : value,
    700,
  );
  const display = decimals > 0 ? (animated / 10).toFixed(decimals) : animated;

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: `${color}15`,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>
          {label}
        </p>
        <p className="stat-number" style={{ fontSize: 18, fontWeight: 700, color }}>
          {display}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>{suffix}</span>
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sortable header
// ---------------------------------------------------------------------------

interface SortableHeaderProps {
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (field: SortField) => void;
}

function SortableHeader({ label, field, current, dir, onSort }: SortableHeaderProps) {
  const isActive = current === field;
  const ariaSort = isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <div role="columnheader" aria-sort={ariaSort} className="flex">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1"
        aria-label={`${label}, ${isActive ? (dir === 'asc' ? '升序' : '降序') : '点击排序'}`}
        type="button"
        style={{
          fontSize: 11,
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontWeight: 600,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'color 0.15s',
        }}
      >
        {label}
        {isActive ? (
          dir === 'asc' ? (
            <ChevronUp size={12} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={12} strokeWidth={2.5} />
          )
        ) : (
          <ArrowUpDown size={10} strokeWidth={2} style={{ opacity: 0.4 }} />
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-doc segmented bar (compact visual of pass/warn/fail proportions)
// ---------------------------------------------------------------------------

function SubDocBar({ counts }: { counts: SubDocCounts }) {
  const { total, pass, warn, fail, missing } = counts;
  const failTotal = fail + missing;

  return (
    <div className="flex items-center gap-2">
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {total}份
      </span>
      <div
        className="flex"
        style={{
          width: 72,
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
          background: 'rgba(13,148,136,0.08)',
        }}
      >
        {pass > 0 && (
          <div style={{ flex: pass, background: '#059669', transition: 'flex 0.3s' }} />
        )}
        {warn > 0 && (
          <div style={{ flex: warn, background: '#D97706', transition: 'flex 0.3s' }} />
        )}
        {failTotal > 0 && (
          <div style={{ flex: failTotal, background: '#DC2626', transition: 'flex 0.3s' }} />
        )}
      </div>
      {/* Mini count labels */}
      <div className="flex items-center gap-1" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
        {pass > 0 && <span style={{ color: '#059669', fontWeight: 700 }}>{pass}</span>}
        {warn > 0 && <span style={{ color: '#D97706', fontWeight: 700 }}>{warn}</span>}
        {failTotal > 0 && <span style={{ color: '#DC2626', fontWeight: 700 }}>{failTotal}</span>}
      </div>
    </div>
  );
}
