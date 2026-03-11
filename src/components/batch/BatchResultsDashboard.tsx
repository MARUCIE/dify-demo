'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle, AlertTriangle, XCircle, FileText,
  ExternalLink, Download, Copy, RotateCcw,
  Clock, Zap, Search, ArrowUpDown,
  ChevronUp, ChevronDown, Check,
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { BatchFile, BatchSummary, AuditSuggestion } from '@/lib/types';
import { SUGGESTION_BADGE } from '@/lib/constants';
import { DURATION, EASE_DEFAULT } from '@/lib/animations';

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
    if (target === 0) {
      setValue(0);
      return;
    }

    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
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
    label: '人工复核',
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
// Sortable columns
// ---------------------------------------------------------------------------

type SortField = 'index' | 'name' | 'handwritingRatio' | 'receptionType' | 'suggestion' | 'issueCount';
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
// Main component
// ---------------------------------------------------------------------------

function formatSummaryText(files: BatchFile[], summary: BatchSummary): string {
  const lines: string[] = [
    '===== 批量审核汇总 =====',
    `总文件数: ${summary.totalFiles}`,
    `通过: ${summary.passed}  |  人工复核: ${summary.needsReview}  |  不通过: ${summary.rejected}`,
    `总耗时: ${summary.totalDuration.toFixed(1)}秒`,
    '',
    '--- 明细 ---',
  ];
  files.forEach((f, i) => {
    const s = f.result?.suggestion ?? '--';
    const issues = f.result?.issues.length ?? 0;
    lines.push(`${i + 1}. ${f.name}  |  ${s}  |  ${issues}个问题`);
  });
  return lines.join('\n');
}

export default function BatchResultsDashboard({
  files,
  summary,
  onViewDetail,
  onReset,
}: BatchResultsDashboardProps) {
  const [sortField, setSortField] = useState<SortField>('index');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [copied, setCopied] = useState(false);

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
        case 'handwritingRatio':
          return dir * (a.handwritingRatio - b.handwritingRatio);
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
  }, [files, sortField, sortDir]);

  // Derived stats
  const avgDuration =
    summary.totalFiles > 0
      ? summary.totalDuration / summary.totalFiles
      : 0;

  const totalIssues = files.reduce(
    (sum, f) => sum + (f.result?.issues.length ?? 0),
    0,
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slower, ease: EASE_DEFAULT }}
    >
      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #059669, #10b981)',
            }}
          >
            <CheckCircle size={16} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>批量审核结果</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              已完成 {summary.completed}/{summary.totalFiles} 个文件的智能审核
            </p>
          </div>
        </div>

        <div className="text-right">
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>总耗时</p>
          <p
            className="stat-number"
            style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}
          >
            {summary.totalDuration.toFixed(1)}
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>秒</span>
          </p>
        </div>
      </div>

      <div className="glass-bright rounded-2xl overflow-hidden success-shimmer">
        {/* ── Top row: 3 summary cards ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            padding: '24px 32px',
            borderBottom: '1px solid rgba(13,148,136,0.2)',
          }}
        >
          {SUMMARY_CARDS.map((card, i) => (
            <SummaryCard
              key={card.key}
              def={card}
              value={summary[card.key]}
              total={summary.totalFiles}
              index={i}
            />
          ))}
        </div>

        {/* ── Stats row ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            padding: '16px 32px',
            borderBottom: '1px solid rgba(13,148,136,0.2)',
            background: 'rgba(13,148,136,0.03)',
          }}
        >
          <StatCell
            icon={<FileText size={14} color="#0D9488" strokeWidth={2} />}
            label="总文件数"
            value={summary.totalFiles}
            suffix="个"
            color="#0D9488"
            index={0}
          />
          <StatCell
            icon={<Clock size={14} color="#0891B2" strokeWidth={2} />}
            label="总耗时"
            value={parseFloat(summary.totalDuration.toFixed(1))}
            suffix="秒"
            color="#0891B2"
            decimals={1}
            index={1}
          />
          <StatCell
            icon={<Zap size={14} color="#D97706" strokeWidth={2} />}
            label="平均耗时/文件"
            value={parseFloat(avgDuration.toFixed(1))}
            suffix="秒"
            color="#D97706"
            decimals={1}
            index={2}
          />
          <StatCell
            icon={<Search size={14} color="#DC2626" strokeWidth={2} />}
            label="发现问题数"
            value={totalIssues}
            suffix="个"
            color="#DC2626"
            index={3}
          />
        </div>

        {/* ── Results table ── */}
        <ResultsTable
          sortedFiles={sortedFiles}
          allFiles={files}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onViewDetail={onViewDetail}
        />

        {/* ── Bottom action bar ── */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '20px 32px',
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
// Results table with virtual scrolling for 100+ files
// ---------------------------------------------------------------------------

const ROW_HEIGHT = 48; // Fixed row height for virtualizer
const VISIBLE_ROWS = 10; // Show ~10 rows before scrolling

interface ResultsTableProps {
  sortedFiles: BatchFile[];
  allFiles: BatchFile[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onViewDetail: (fileId: string) => void;
}

function ResultsTable({ sortedFiles, allFiles, sortField, sortDir, onSort, onViewDetail }: ResultsTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: sortedFiles.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  const needsScroll = sortedFiles.length > VISIBLE_ROWS;

  return (
    <div style={{ padding: '24px 32px' }}>
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
          gridTemplateColumns: '48px 1fr 90px 110px 100px 80px 90px',
          gap: 12,
          padding: '10px 16px',
          borderRadius: 8,
          background: 'rgba(13,148,136,0.04)',
          marginBottom: 8,
        }}
      >
        <SortableHeader label="序号" field="index" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="文件名" field="name" current={sortField} dir={sortDir} onSort={onSort} />
        <SortableHeader label="手写比例" field="handwritingRatio" current={sortField} dir={sortDir} onSort={onSort} />
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
                <ResultRow
                  file={file}
                  displayIndex={allFiles.indexOf(file)}
                  animIndex={virtualRow.index}
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
// Summary card (with gradient background + animated counter)
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  def: SummaryCardDef;
  value: number;
  total: number;
  index: number;
}

function SummaryCard({ def, value, total, index }: SummaryCardProps) {
  const animatedValue = useAnimatedCounter(value, 900);
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const animatedPercent = useAnimatedCounter(
    Math.round(percentage),
    1000,
  );

  return (
    <motion.div
      className={`glass rounded-xl ${def.glowClass}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: DURATION.slow, delay: index * 0.12 }}
      style={{
        padding: '24px 20px',
        background: `linear-gradient(145deg, ${def.gradientFrom}, ${def.gradientTo})`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient orb */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${def.gradientFrom}, transparent)`,
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      <div className="flex items-center gap-3 mb-4" style={{ position: 'relative' }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${def.color}18`,
            border: `1px solid ${def.color}30`,
          }}
        >
          <def.Icon size={18} color={def.color} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
          {def.label}
        </span>
      </div>

      <div className="flex items-end gap-3" style={{ position: 'relative' }}>
        <p
          className="stat-number"
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: def.color,
            lineHeight: 1,
          }}
        >
          {animatedValue}
        </p>
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: `${def.color}99`,
            paddingBottom: 4,
          }}
        >
          {animatedPercent}%
        </p>
      </div>

      {/* Percentage bar */}
      <div className="progress-bar" style={{ height: 3, marginTop: 14 }}>
        <motion.div
          style={{
            height: '100%',
            borderRadius: 2,
            background: def.color,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.4 + index * 0.12, ease: 'easeOut' }}
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

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1"
      aria-sort={isActive ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      aria-label={`${label}, ${isActive ? (dir === 'asc' ? '升序' : '降序') : '点击排序'}`}
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
  );
}

// ---------------------------------------------------------------------------
// Result row
// ---------------------------------------------------------------------------

interface ResultRowProps {
  file: BatchFile;
  displayIndex: number;
  animIndex: number;
  onViewDetail: (fileId: string) => void;
}

function ResultRow({ file, displayIndex, animIndex, onViewDetail }: ResultRowProps) {
  const suggestion = file.result?.suggestion;
  const issueCount = file.result?.issues.length ?? 0;
  const receptionType = file.result?.receptionType ?? '--';
  const handwritingPercent = (file.handwritingRatio * 100).toFixed(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + animIndex * 0.06 }}
      className="glass rounded-lg"
      style={{
        display: 'grid',
        gridTemplateColumns: '48px 1fr 90px 110px 100px 80px 90px',
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

      {/* Handwriting ratio — M10: right-align numerics */}
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
        {handwritingPercent}%
      </span>

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

      {/* Issue count — M10: right-align numerics */}
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
          查看详情
        </button>
      </div>
    </motion.div>
  );
}
