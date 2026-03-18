'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck, Users, AlertTriangle, Copy, Download, RotateCcw, CheckCircle, XCircle, Check,
  Scissors, ChevronDown, ChevronRight, FileX, Info,
} from 'lucide-react';
import type { AuditResult, AuditIssue } from '@/lib/types';
import { EASE_DEFAULT, DURATION } from '@/lib/animations';
import { analyzeSubDocuments, type SubDocVerdict, type SubDocAnalysis } from '@/lib/sub-doc-analysis';
import IssueCard from './IssueCard';

const VERDICT_CONFIG: Record<SubDocVerdict, {
  bg: string; border: string; color: string; iconBg: string; label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}> = {
  pass: {
    bg: 'rgba(5,150,105,0.04)', border: 'rgba(5,150,105,0.2)',
    color: '#059669', iconBg: 'rgba(5,150,105,0.1)', label: '\u901A\u8FC7',
    Icon: CheckCircle,
  },
  warning: {
    bg: 'rgba(245,158,11,0.04)', border: 'rgba(245,158,11,0.2)',
    color: '#D97706', iconBg: 'rgba(245,158,11,0.1)', label: '\u5F85\u590D\u6838',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'rgba(220,38,38,0.04)', border: 'rgba(220,38,38,0.2)',
    color: '#DC2626', iconBg: 'rgba(220,38,38,0.1)', label: '\u4E0D\u901A\u8FC7',
    Icon: XCircle,
  },
  missing: {
    bg: 'rgba(220,38,38,0.03)', border: 'rgba(220,38,38,0.15)',
    color: '#DC2626', iconBg: 'rgba(220,38,38,0.08)', label: '\u7F3A\u5931',
    Icon: FileX,
  },
};

// ── SubDocCard ──

function SubDocCard({ analysis, index }: { analysis: SubDocAnalysis; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const config = VERDICT_CONFIG[analysis.verdict];
  const hasIssues = analysis.issues.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={hasIssues ? { scale: 1.01 } : undefined}
      style={{
        borderRadius: 12,
        border: `1px solid ${config.border}`,
        background: config.bg,
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <button
        type="button"
        onClick={() => hasIssues && setExpanded(!expanded)}
        aria-expanded={hasIssues ? expanded : undefined}
        style={{
          width: '100%', padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'none', border: 'none',
          cursor: hasIssues ? 'pointer' : 'default',
          textAlign: 'left',
        }}
      >
        {/* Verdict icon */}
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: config.iconBg, flexShrink: 0,
        }}>
          <config.Icon size={16} color={config.color} strokeWidth={2} />
        </div>

        {/* Doc type + page info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 600,
            color: analysis.doc.found ? 'var(--text-primary)' : config.color,
          }}>
            {analysis.doc.type}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {analysis.doc.found
              ? `P${analysis.doc.page}${analysis.doc.pageCount && analysis.doc.pageCount > 1 ? `-${analysis.doc.page! + analysis.doc.pageCount - 1}` : ''}`
              : '\u672A\u627E\u5230\u6B64\u5355\u636E'
            }
            {hasIssues && ` \u00B7 ${analysis.issues.length} \u4E2A\u95EE\u9898`}
            {hasIssues && !expanded && (
              <span style={{ color: 'var(--primary, #0D9488)', marginLeft: 4 }}>{'\u70B9\u51FB\u5C55\u5F00'}</span>
            )}
          </p>
        </div>

        {/* Verdict badge */}
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
          background: config.iconBg, color: config.color,
          border: `1px solid ${config.border}`, flexShrink: 0,
        }}>
          {config.label}
        </span>

        {/* Expand indicator */}
        {hasIssues && (
          <div style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
            {expanded
              ? <ChevronDown size={16} strokeWidth={2} />
              : <ChevronRight size={16} strokeWidth={2} />
            }
          </div>
        )}
      </button>

      {/* Expandable issue list */}
      <AnimatePresence>
        {expanded && hasIssues && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '0 16px 14px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {analysis.issues.map((issue, i) => (
                <IssueCard key={i} issue={issue} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Helpers ──

interface ResultPanelProps {
  result: AuditResult;
  onReset: () => void;
}

function formatResultText(result: AuditResult): string {
  const lines: string[] = [
    `\u62DB\u5F85\u7C7B\u578B: ${result.receptionType}`,
    `\u5BA1\u6838\u5EFA\u8BAE: ${result.suggestion}`,
    `\u5BA1\u6838\u8017\u65F6: ${result.totalDuration.toFixed(1)}\u79D2`,
  ];
  if (result.amount) lines.push(`\u62A5\u9500\u91D1\u989D: ${result.amount}\u5143`);
  if (result.rawOutput) {
    lines.push('');
    lines.push('--- \u601D\u8003\u8FC7\u7A0B ---');
    lines.push(result.rawOutput);
    lines.push('');
  }
  if (result.subDocuments) {
    lines.push('');
    lines.push('--- \u5355\u636E\u8BC6\u522B ---');
    const found = result.subDocuments.filter(d => d.found);
    const missing = result.subDocuments.filter(d => !d.found);
    found.forEach(d => lines.push(`  [\u6709] ${d.type}${d.page ? ` (P${d.page})` : ''}`));
    missing.forEach(d => lines.push(`  [\u7F3A] ${d.type}`));
  }
  lines.push('');
  lines.push(`\u53D1\u73B0\u95EE\u9898: ${result.issues.length} \u4E2A`);
  result.issues.forEach((issue, i) => {
    const severity = issue.severity === 'error' ? '[\u4E25\u91CD]' : issue.severity === 'warning' ? '[\u8B66\u544A]' : '[\u4FE1\u606F]';
    lines.push(`${i + 1}. ${severity} ${issue.message}`);
    if (issue.detail) lines.push(`   ${issue.detail}`);
  });
  return lines.join('\n');
}

const SUGGESTION_CONFIG = {
  '\u901A\u8FC7': { badgeClass: 'badge-green', Icon: CheckCircle },
  '\u4EBA\u5DE5\u590D\u6838': { badgeClass: 'badge-amber', Icon: AlertTriangle },
  '\u4E0D\u901A\u8FC7': { badgeClass: 'badge-red', Icon: XCircle },
} as const;

// ── ThinkingProcessSection ──
// Mirrors Dify's "已深度思考" collapsible panel.
// Displays the full audit breakdown (rawOutput) with semantic highlighting.

function ThinkingProcessSection({ rawOutput, duration }: { rawOutput: string; duration: number }) {
  const [expanded, setExpanded] = useState(false);

  // Parse raw text into styled segments
  const segments = useMemo(() => {
    return rawOutput.split('\n').map((line, i) => {
      const trimmed = line.trim();
      // Main title (### heading)
      if (/^#{1,3}\s+/.test(trimmed)) {
        return { type: 'title' as const, text: trimmed.replace(/^#{1,3}\s+/, ''), key: i };
      }
      // Section headers: Chinese numbered sections (一、二、etc.) or bold markers
      if (/^[一二三四五六七八九十]+[、.]/.test(trimmed) || /^\*\*.*\*\*$/.test(trimmed)) {
        return { type: 'heading' as const, text: trimmed.replace(/\*\*/g, ''), key: i };
      }
      // Sub-section headers: "N. [Title]" pattern
      if (/^\d+\.\s*[\[【]/.test(trimmed)) {
        return { type: 'subheading' as const, text: trimmed, key: i };
      }
      // Bullet points with compliance status
      if (/^[•\-*]\s+/.test(trimmed)) {
        const text = trimmed.replace(/^[•\-*]\s+/, '');
        const isViolation = /违规|违反|需复核|需关注/.test(text);
        const isCompliant = /合规/.test(text) && !isViolation;
        return {
          type: 'bullet' as const,
          text,
          status: isViolation ? 'violation' : isCompliant ? 'compliant' : 'neutral',
          key: i,
        };
      }
      // Empty line
      if (!trimmed) return { type: 'blank' as const, text: '', key: i };
      // Regular text
      return { type: 'text' as const, text: trimmed, key: i };
    });
  }, [rawOutput]);

  return (
    <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(13,148,136,0.08)' }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 10,
          background: expanded
            ? 'rgba(13,148,136,0.06)'
            : 'rgba(248,250,252,0.8)',
          border: expanded
            ? '1px solid rgba(13,148,136,0.18)'
            : '1px solid rgba(226,232,240,0.6)',
          cursor: 'pointer', textAlign: 'left',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Thinking icon */}
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: expanded
            ? 'rgba(13,148,136,0.12)'
            : 'rgba(100,116,139,0.08)',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}>
          <Info size={14} color={expanded ? '#0D9488' : '#94A3B8'} strokeWidth={2} />
        </div>

        <p style={{
          fontSize: 13, fontWeight: 600,
          color: expanded ? '#0D9488' : 'var(--text-secondary)',
          flex: 1, transition: 'color 0.2s',
        }}>
          {'\u601D\u8003\u8FC7\u7A0B'}
          <span style={{
            color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, fontSize: 12,
          }}>
            {'\u5DF2\u6DF1\u5EA6\u601D\u8003'} {duration.toFixed(1)}s
          </span>
        </p>

        <span style={{
          fontSize: 11, fontWeight: 500, color: expanded ? '#0D9488' : '#94A3B8',
          transition: 'color 0.2s',
        }}>
          {expanded ? '\u6536\u8D77' : '\u5C55\u5F00'}
        </span>

        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ flexShrink: 0, color: expanded ? '#0D9488' : 'var(--text-muted)' }}
        >
          <ChevronRight size={14} strokeWidth={2} />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                marginTop: 12, padding: '20px 24px', borderRadius: 12,
                background: 'rgba(248,250,252,0.6)',
                border: '1px solid rgba(226,232,240,0.6)',
                fontSize: 13, lineHeight: 1.9,
                color: 'var(--text-primary)',
                maxHeight: 520, overflowY: 'auto',
              }}
            >
              {segments.map(seg => {
                if (seg.type === 'blank') {
                  return <div key={seg.key} style={{ height: 6 }} />;
                }
                if (seg.type === 'title') {
                  return (
                    <p key={seg.key} style={{
                      fontSize: 14, fontWeight: 700, color: 'var(--text-primary)',
                      marginBottom: 12,
                    }}>
                      {seg.text}
                    </p>
                  );
                }
                if (seg.type === 'heading') {
                  return (
                    <p key={seg.key} style={{
                      fontSize: 14, fontWeight: 700, color: '#1E293B',
                      marginTop: 16, marginBottom: 6,
                      paddingBottom: 4, borderBottom: '1px solid rgba(226,232,240,0.5)',
                    }}>
                      {seg.text}
                    </p>
                  );
                }
                if (seg.type === 'subheading') {
                  return (
                    <p key={seg.key} style={{
                      fontSize: 13, fontWeight: 600, color: '#0D9488',
                      marginTop: 10, marginBottom: 3,
                    }}>
                      {seg.text}
                    </p>
                  );
                }
                if (seg.type === 'bullet') {
                  const color = seg.status === 'violation' ? '#DC2626'
                    : seg.status === 'compliant' ? '#64748B' : 'var(--text-secondary)';
                  const weight = seg.status === 'violation' ? 600 : 400;
                  // Highlight the (违规)/(合规) suffix
                  const parts = seg.text.match(/^(.+?)(（[^）]+）)([。.]*$)/);
                  if (parts) {
                    const suffixColor = seg.status === 'violation' ? '#DC2626'
                      : seg.status === 'compliant' ? '#059669' : color;
                    return (
                      <p key={seg.key} style={{ paddingLeft: 16, marginTop: 3, color, fontWeight: weight }}>
                        {'• '}{parts[1]}
                        <span style={{ color: suffixColor, fontWeight: 500 }}>{parts[2]}</span>
                        {parts[3]}
                      </p>
                    );
                  }
                  return (
                    <p key={seg.key} style={{ paddingLeft: 16, marginTop: 3, color, fontWeight: weight }}>
                      {'• '}{seg.text}
                    </p>
                  );
                }
                return (
                  <p key={seg.key} style={{ marginTop: 2, color: 'var(--text-secondary)' }}>
                    {seg.text}
                  </p>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ──

export default function ResultPanel({ result, onReset }: ResultPanelProps) {
  const suggestionConfig = SUGGESTION_CONFIG[result.suggestion];
  // Filter out info-level "合规" items — only show actual violations in 问题列表
  const displayIssues = useMemo(() =>
    result.issues.filter(i => i.severity !== 'info'),
    [result.issues],
  );
  const errorCount = displayIssues.filter(i => i.severity === 'error').length;
  const warningCount = displayIssues.filter(i => i.severity === 'warning').length;
  const [copied, setCopied] = useState(false);

  // Memoize sub-document analysis — only recompute when result identity changes
  const subDocData = useMemo(() => {
    if (!result.subDocuments || result.subDocuments.length === 0) return null;
    return analyzeSubDocuments(result.subDocuments, result.issues);
  }, [result.subDocuments, result.issues]);

  const passCount = subDocData?.analyses.filter(a => a.verdict === 'pass').length ?? 0;
  const warnCount = subDocData?.analyses.filter(a => a.verdict === 'warning').length ?? 0;
  const failCount = subDocData?.analyses.filter(a => a.verdict === 'error' || a.verdict === 'missing').length ?? 0;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatResultText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = formatResultText(result);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slower, ease: EASE_DEFAULT }}
    >
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex items-center justify-center"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          }}
        >
          <FileCheck size={16} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{'\u5BA1\u6838\u7ED3\u679C'}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {'\u5DF2\u5B8C\u6210\u5168\u90E8\u6B65\u9AA4\u7684\u667A\u80FD\u5BA1\u6838\u5206\u6790'}
          </p>
        </div>
      </div>

      <div className="glass-bright rounded-2xl overflow-hidden success-shimmer">
        {/* Result header */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
            padding: '24px 32px',
            borderBottom: '1px solid rgba(245,158,11,0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {'\u62DB\u5F85\u7C7B\u578B'}
                </p>
                <span
                  className="badge badge-blue"
                  style={{ fontSize: 15, padding: '8px 18px' }}
                >
                  <Users size={14} strokeWidth={2} />
                  {result.receptionType}
                </span>
              </div>
              <div style={{ width: 1, height: 40, background: 'rgba(13,148,136,0.3)' }} />
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  {'\u5BA1\u6838\u5EFA\u8BAE'}
                </p>
                <span
                  className={`badge ${suggestionConfig.badgeClass}`}
                  style={{ fontSize: 15, padding: '8px 18px' }}
                >
                  <suggestionConfig.Icon size={14} strokeWidth={2} />
                  {result.suggestion}
                </span>
              </div>
              {result.amount && (
                <>
                  <div style={{ width: 1, height: 40, background: 'rgba(13,148,136,0.3)' }} />
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {'\u62A5\u9500\u91D1\u989D'}
                    </p>
                    <p className="stat-number" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                      ¥{result.amount.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{'\u5BA1\u6838\u8017\u65F6'}</p>
              <p
                className="stat-number"
                style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}
              >
                {result.totalDuration.toFixed(1)}
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{'\u79D2'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Per-sub-document breakdown ── */}
        {subDocData && (
          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(13,148,136,0.1)' }}>
            {/* Sub-doc summary header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Scissors size={14} color="#0D9488" strokeWidth={2} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {'\u62C6\u5206\u5355\u636E\u5BA1\u6838\u7ED3\u679C'}
                </p>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 4 }}>
                  {result.subDocuments!.length} {'\u4EFD\u5355\u636E'}
                  {result.pageCount ? ` \u00B7 ${result.pageCount}\u9875` : ''}
                </span>
              </div>

              {/* Mini verdict summary */}
              <div className="flex items-center gap-4">
                {passCount > 0 && (
                  <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
                    <CheckCircle size={12} strokeWidth={2.5} /> {passCount} {'\u901A\u8FC7'}
                  </span>
                )}
                {warnCount > 0 && (
                  <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>
                    <AlertTriangle size={12} strokeWidth={2.5} /> {warnCount} {'\u5F85\u590D\u6838'}
                  </span>
                )}
                {failCount > 0 && (
                  <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
                    <XCircle size={12} strokeWidth={2.5} /> {failCount} {'\u95EE\u9898'}
                  </span>
                )}
              </div>
            </div>

            {/* Sub-document cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {subDocData.analyses.map((analysis, i) => (
                <SubDocCard key={analysis.doc.type} analysis={analysis} index={i} />
              ))}
            </div>

            {/* Unmatched issues (general/cross-document) */}
            {subDocData.unmatchedIssues.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="flex items-center gap-2 mb-3">
                  <Info size={14} color="#0D9488" strokeWidth={2} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {'\u7EFC\u5408\u5BA1\u6838\u53D1\u73B0'}
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    ({subDocData.unmatchedIssues.length} {'\u4E2A\u95EE\u9898'})
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {subDocData.unmatchedIssues.map((issue, i) => (
                    <IssueCard key={i} issue={issue} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Flat issues list (when no sub-documents) ── */}
        {!subDocData && displayIssues.length > 0 && (
          <div style={{ padding: '24px 32px' }}>
            <div className="flex items-center justify-between mb-5">
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                {'\u95EE\u9898\u5217\u8868'}{' '}
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({displayIssues.length})
                </span>
              </p>
              <div className="flex gap-2">
                {errorCount > 0 && (
                  <span className="badge badge-red" style={{ fontSize: 11 }}>
                    {errorCount} {'\u4E25\u91CD'}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="badge badge-amber" style={{ fontSize: 11 }}>
                    {warningCount} {'\u8B66\u544A'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {displayIssues.map((issue, i) => (
                <IssueCard key={i} issue={issue} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* No issues — clean pass indicator */}
        {!subDocData && displayIssues.length === 0 && (
          <div style={{ padding: '24px 32px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 10,
              background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)',
            }}>
              <CheckCircle size={16} color="#059669" strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>
                {'\u672A\u53D1\u73B0\u5408\u89C4\u95EE\u9898'}
              </span>
            </div>
          </div>
        )}

        {/* ── Thinking Process (思考过程) — collapsible detailed audit ── */}
        {result.rawOutput && (
          <ThinkingProcessSection rawOutput={result.rawOutput} duration={result.totalDuration} />
        )}

        {/* Action bar */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '20px 32px', borderTop: '1px solid rgba(13,148,136,0.2)' }}
        >
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={handleCopy}>
              {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
              {copied ? '\u5DF2\u590D\u5236' : '\u590D\u5236\u7ED3\u679C'}
            </button>
            <button className="btn-secondary" disabled title="\u5373\u5C06\u4E0A\u7EBF">
              <Download size={14} strokeWidth={2} />
              {'\u5BFC\u51FA PDF'}
            </button>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            style={{ padding: '10px 28px', fontSize: 14 }}
            onClick={onReset}
          >
            <RotateCcw size={16} strokeWidth={2} />
            {'\u91CD\u65B0\u5BA1\u6838'}
          </button>
        </div>
      </div>
    </motion.section>
  );
}
