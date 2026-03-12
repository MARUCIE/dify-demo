'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DURATION } from '@/lib/animations';

interface StatItem {
  value: string;
  numericValue: number;
  suffix: string;
  label: string;
  color: string;
  hasGlow?: boolean;
}

const STATS: StatItem[] = [
  { value: '10', numericValue: 10, suffix: '', label: '审核步骤', color: '#0D9488', hasGlow: true },
  { value: '98.7%', numericValue: 98.7, suffix: '%', label: '识别准确率', color: '#059669' },
  { value: '15s', numericValue: 15, suffix: 's', label: '平均审核耗时', color: '#0891B2' },
  { value: '24/7', numericValue: 24, suffix: '/7', label: '全天候服务', color: '#D97706' },
];

function AnimatedCounter({ item }: { item: StatItem }) {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const target = item.numericValue;
    const duration = 1200;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(eased * target);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [item.numericValue]);

  const formatted = item.suffix === '%'
    ? displayValue.toFixed(1)
    : Math.round(displayValue).toString();

  return (
    <span
      className={`stat-number ${item.hasGlow ? 'text-glow-blue' : ''}`}
      style={{ fontSize: 32, fontWeight: 800, color: item.color }}
    >
      {formatted}{item.suffix}
    </span>
  );
}

export default function StatsBar() {
  return (
    <motion.div
      className="glass rounded-2xl p-4 mb-4 glow-blue glass-shimmer"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, delay: 0.2, ease: 'easeOut' }}
    >
      {STATS.map((stat) => (
        <div key={stat.label} className="text-center">
          <div>
            <AnimatedCounter item={stat} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            {stat.label}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
