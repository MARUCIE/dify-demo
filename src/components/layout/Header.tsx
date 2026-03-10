'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleCheck, Sun, Moon } from 'lucide-react';

function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }, [theme]);

  return (
    <button
      onClick={toggle}
      className="btn-secondary"
      style={{ padding: '6px 10px', borderRadius: 8 }}
      aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
      type="button"
    >
      {theme === 'dark' ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
    </button>
  );
}

export default function Header() {
  return (
    <motion.header
      className="flex items-center justify-between py-3 mb-2"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div
          className="logo-glow flex items-center justify-center"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
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
        <span className="badge badge-blue">
          <motion.span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'inline-block',
            }}
            animate={{
              boxShadow: [
                '0 0 4px rgba(59,130,246,0.4)',
                '0 0 12px rgba(59,130,246,0.8)',
                '0 0 4px rgba(59,130,246,0.4)',
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
