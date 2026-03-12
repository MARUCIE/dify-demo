'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, CircleCheck, Sun } from 'lucide-react';
import { DURATION } from '@/lib/animations';

function readStoredTheme(): 'dark' | 'light' {
  const saved = localStorage.getItem('theme');
  return saved === 'dark' ? 'dark' : 'light';
}

function ThemeToggle() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', readStoredTheme());
  }, []);

  const toggle = useCallback(() => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }, []);

  return (
    <button
      onClick={toggle}
      className="btn-secondary"
      style={{ padding: '6px 10px', borderRadius: 8 }}
      aria-label="切换深浅色模式"
      type="button"
    >
      <Sun size={16} strokeWidth={2} />
    </button>
  );
}

interface HeaderProps {
  backHref?: string;
  backLabel?: string;
}

export default function Header({ backHref, backLabel }: HeaderProps) {
  return (
    <motion.header
      className="flex items-center justify-between py-3 mb-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-4">
        {/* Back link */}
        {backHref && (
          <Link
            href={backHref}
            className="btn-secondary"
            style={{ padding: '6px 10px', borderRadius: 8, textDecoration: 'none' }}
            aria-label={backLabel || '返回'}
          >
            <ArrowLeft size={16} strokeWidth={2} />
          </Link>
        )}
        {/* Logo */}
        <div
          className="logo-glow flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0D9488, #0891B2)',
          }}
        >
          <CircleCheck size={24} color="white" strokeWidth={2} />
        </div>
        <div>
          <h1
            className="text-glow-blue"
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.5px',
            }}
          >
            路桥报销审核智能体
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
            SRBG Expense Audit Agent v2.0
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="badge badge-blue">
          <motion.span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#0D9488',
              display: 'inline-block',
            }}
            animate={{
              boxShadow: [
                '0 0 4px rgba(13,148,136,0.4)',
                '0 0 12px rgba(13,148,136,0.8)',
                '0 0 4px rgba(13,148,136,0.4)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          AI 引擎就绪
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>v2.0.0</span>
      </div>
    </motion.header>
  );
}
