'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck, Users, AlertTriangle, Copy, Download, RotateCcw, CheckCircle, XCircle, Check,
  Scissors, FileText,
} from 'lucide-react';
import type { AuditResult } from '@/lib/types';
import { EASE_DEFAULT, DURATION } from '@/lib/animations';
import IssueCard from './IssueCard';

interface ResultPanelProps {
  result: AuditResult;
  onReset: () => void;
}

function formatResultText(result: AuditResult): string {
  const lines: string[] = [
    `招待类型: ${result.receptionType}`,
    `审核建议: ${result.suggestion}`,
    `审核耗时: ${result.totalDuration.toFixed(1)}秒`,
  ];
  if (result.amount) lines.push(`报销金额: ${result.amount}元`);
  if (result.subDocuments) {
    lines.push('');
    lines.push('--- 单据识别 ---');
    const found = result.subDocuments.filter(d => d.found);
    const missing = result.subDocuments.filter(d => !d.found);
    found.forEach(d => lines.push(`  [有] ${d.type}${d.page ? ` (P${d.page})` : ''}`));
    missing.forEach(d => lines.push(`  [缺] ${d.type}`));
  }
  lines.push('');
  lines.push(`发现问题: ${result.issues.length} 个`);
  result.issues.forEach((issue, i) => {
    const severity = issue.severity === 'error' ? '[严重]' : issue.severity === 'warning' ? '[警告]' : '[信息]';
    lines.push(`${i + 1}. ${severity} ${issue.message}`);
    if (issue.detail) lines.push(`   ${issue.detail}`);
  });
  return lines.join('\n');
}

const SUGGESTION_CONFIG = {
  '通过': { badgeClass: 'badge-green', Icon: CheckCircle },
  '人工复核': { badgeClass: 'badge-amber', Icon: AlertTriangle },
  '不通过': { badgeClass: 'badge-red', Icon: XCircle },
} as const;

export default function ResultPanel({ result, onReset }: ResultPanelProps) {
  const suggestionConfig = SUGGESTION_CONFIG[result.suggestion];
  const errorCount = result.issues.filter(i => i.severity === 'error').length;
  const warningCount = result.issues.filter(i => i.severity === 'warning').length;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatResultText(result));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select + copy via textarea
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
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          }}
        >
          <FileCheck size={16} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>审核结果</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            已完成全部步骤的智能审核分析
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
                  招待类型
                </p>
                <span
                  className="badge badge-blue"
                  style={{ fontSize: 15, padding: '8px 18px' }}
                >
                  <Users size={14} strokeWidth={2} />
                  {result.receptionType}
                </span>
              </div>
              <div
                style={{
                  width: 1,
                  height: 40,
                  background: 'rgba(13,148,136,0.3)',
                }}
              />
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  审核建议
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
                  <div
                    style={{
                      width: 1,
                      height: 40,
                      background: 'rgba(13,148,136,0.3)',
                    }}
                  />
                  <div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      报销金额
                    </p>
                    <p className="stat-number" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                      ¥{result.amount.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>审核耗时</p>
              <p
                className="stat-number"
                style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}
              >
                {result.totalDuration.toFixed(1)}
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>秒</span>
              </p>
            </div>
          </div>
        </div>

        {/* Sub-document breakdown */}
        {result.subDocuments && result.subDocuments.length > 0 && (
          <div
            style={{
              padding: '20px 32px',
              borderBottom: '1px solid rgba(13,148,136,0.1)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Scissors size={14} color="#0D9488" strokeWidth={2} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                单据拆分识别
              </p>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 4 }}>
                {result.subDocuments.filter(d => d.found).length}/{result.subDocuments.length} 份单据
                {result.pageCount ? ` · ${result.pageCount}页` : ''}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 8,
              }}
            >
              {result.subDocuments.map((doc, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="glass rounded-lg"
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: `1px solid ${doc.found ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'}`,
                    background: doc.found ? 'rgba(5,150,105,0.04)' : 'rgba(220,38,38,0.04)',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: doc.found ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                      flexShrink: 0,
                    }}
                  >
                    {doc.found
                      ? <CheckCircle size={14} color="#059669" strokeWidth={2} />
                      : <XCircle size={14} color="#DC2626" strokeWidth={2} />
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: doc.found ? 'var(--text-primary)' : '#DC2626',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {doc.type}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {doc.found
                        ? `P${doc.page}${doc.pageCount && doc.pageCount > 1 ? `-${doc.page! + doc.pageCount - 1}` : ''}`
                        : '缺失'
                      }
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Issues list */}
        <div style={{ padding: '24px 32px' }}>
          <div className="flex items-center justify-between mb-5">
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
              发现{' '}
              <span style={{ color: '#DC2626' }}>{result.issues.length}</span>{' '}
              个问题
            </p>
            <div className="flex gap-2">
              {errorCount > 0 && (
                <span className="badge badge-red" style={{ fontSize: 11 }}>
                  {errorCount} 严重
                </span>
              )}
              {warningCount > 0 && (
                <span className="badge badge-amber" style={{ fontSize: 11 }}>
                  {warningCount} 警告
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {result.issues.map((issue, i) => (
              <IssueCard key={i} issue={issue} index={i} />
            ))}
          </div>

          {/* Action bar */}
          <div
            className="flex items-center justify-between mt-8 pt-6"
            style={{ borderTop: '1px solid rgba(13,148,136,0.2)' }}
          >
            <div className="flex gap-3">
              <button className="btn-secondary" onClick={handleCopy}>
                {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
                {copied ? '已复制' : '复制结果'}
              </button>
              <button className="btn-secondary" disabled title="即将上线">
                <Download size={14} strokeWidth={2} />
                导出 PDF
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
      </div>
    </motion.section>
  );
}
