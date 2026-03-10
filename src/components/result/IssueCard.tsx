'use client';

import { motion } from 'framer-motion';
import { XCircle, AlertTriangle, Info } from 'lucide-react';
import type { AuditIssue } from '@/lib/types';

interface IssueCardProps {
  issue: AuditIssue;
  index: number;
}

const SEVERITY_CONFIG = {
  error: {
    Icon: XCircle,
    iconColor: '#f87171',
    iconBg: 'rgba(239,68,68,0.1)',
    textColor: '#f87171',
    badgeClass: 'badge-red',
    label: '严重',
  },
  warning: {
    Icon: AlertTriangle,
    iconColor: '#fbbf24',
    iconBg: 'rgba(245,158,11,0.1)',
    textColor: '#fbbf24',
    badgeClass: 'badge-amber',
    label: '警告',
  },
  info: {
    Icon: Info,
    iconColor: '#60a5fa',
    iconBg: 'rgba(59,130,246,0.1)',
    textColor: '#60a5fa',
    badgeClass: 'badge-blue',
    label: '提示',
  },
} as const;

export default function IssueCard({ issue, index }: IssueCardProps) {
  const config = SEVERITY_CONFIG[issue.severity];
  const { Icon } = config;

  return (
    <motion.div
      className={`issue-card ${issue.severity} glass rounded-xl p-5`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: config.iconBg,
          }}
        >
          <Icon size={18} color={config.iconColor} strokeWidth={2} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: config.textColor }}>
            {issue.message}
          </p>
          {issue.detail && (
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              {issue.detail}
            </p>
          )}
        </div>
        <span
          className={`badge ${config.badgeClass} shrink-0`}
          style={{ fontSize: 11 }}
        >
          {config.label}
        </span>
      </div>
    </motion.div>
  );
}
