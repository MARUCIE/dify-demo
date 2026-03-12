'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Workflow, Search, Plus, Play, Clock, Tag, Sparkles,
} from 'lucide-react';
import { PLATFORM_WORKFLOWS } from '@/lib/workflows';
import type { WorkflowDef } from '@/lib/workflows';

const BLUE = '#0284C7';
const BLUE_DARK = '#0369A1';

function statusBadge(status: WorkflowDef['status']) {
  switch (status) {
    case 'active':
      return { bg: 'rgba(13, 148, 136, 0.08)', color: '#0f766e', border: '1px solid rgba(13, 148, 136, 0.15)', label: '运行中' };
    case 'draft':
      return { bg: 'rgba(245, 158, 11, 0.08)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.15)', label: '草稿' };
    case 'archived':
      return { bg: 'rgba(100, 116, 139, 0.08)', color: '#64748b', border: '1px solid rgba(100, 116, 139, 0.15)', label: '已归档' };
  }
}

function WorkflowCard({ workflow, index }: { workflow: WorkflowDef; index: number }) {
  const Icon = workflow.icon;
  const badge = statusBadge(workflow.status);

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2, scale: 1.01 }}
      style={{
        borderRadius: 16,
        border: workflow.featured ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid rgba(226, 232, 240, 0.8)',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: workflow.featured
          ? '0 4px 24px rgba(2, 132, 199, 0.08)'
          : '0 4px 24px rgba(0, 0, 0, 0.04)',
        cursor: workflow.href ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
      }}
    >
      {workflow.featured && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(2,132,199,0.03) 0%, transparent 60%)', pointerEvents: 'none' }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header: icon + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: workflow.featured ? `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})` : '#f1f5f9',
            border: workflow.featured ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={22} color={workflow.featured ? 'white' : BLUE} strokeWidth={2} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: badge.bg, color: badge.color, border: badge.border,
              padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
            }}>
              {badge.label}
            </span>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>v{workflow.version}</span>
          </div>
        </div>

        {/* Name */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{workflow.name}</h2>
        <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{workflow.nameEn}</p>

        {/* Description */}
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>{workflow.description}</p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {workflow.tags.map(tag => (
            <span key={tag} style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: '#f1f5f9', color: '#475569', border: '1px solid rgba(226, 232, 240, 0.6)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Play size={12} color="#94a3b8" strokeWidth={2} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{workflow.executionCount.toLocaleString()}</span>
            </div>
            <span style={{ fontSize: 11, color: '#cbd5e1' }}>{workflow.category}</span>
          </div>
          {workflow.featured && (
            <span style={{
              background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
              color: 'white', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
            }}>
              LIVE DEMO
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (workflow.href) {
    return <Link href={workflow.href} style={{ textDecoration: 'none', color: 'inherit' }}>{card}</Link>;
  }
  return card;
}

export default function WorkflowsPage() {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!query.trim()) return PLATFORM_WORKFLOWS;
    const kw = query.trim().toLowerCase();
    return PLATFORM_WORKFLOWS.filter(w =>
      [w.name, w.nameEn, w.description, ...w.tags].join(' ').toLowerCase().includes(kw)
    );
  }, [query]);

  const activeCount = PLATFORM_WORKFLOWS.filter(w => w.status === 'active').length;

  return (
    <main className="h-full flex flex-col overflow-hidden">
      {/* PageHeader */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
          background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Workflow size={20} color={BLUE} strokeWidth={2} />
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>我的工作流</h1>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>可视化编排智能体协作流程</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226,232,240,0.8)',
            }}>
              <Workflow size={14} color={BLUE} strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{PLATFORM_WORKFLOWS.length}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>个工作流</span>
            </div>
            <button
              type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 12,
                border: 'none', background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
                color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
              }}
            >
              <Plus size={16} strokeWidth={2} />
              创建工作流
            </button>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '24px 24px 32px' }}>
          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
            <div style={{ position: 'relative', maxWidth: 400 }}>
              <Search size={16} strokeWidth={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜索工作流..."
                style={{
                  width: '100%', height: 42, paddingLeft: 40, paddingRight: 14, borderRadius: 12,
                  border: '1px solid rgba(226,232,240,0.8)', background: 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(12px)', color: '#1e293b', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          </motion.div>

          {/* Grid */}
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filtered.map((w, i) => (
              <WorkflowCard key={w.id} workflow={w} index={i} />
            ))}
            {filtered.length === 0 && (
              <div style={{
                gridColumn: '1 / -1', borderRadius: 16, border: '2px dashed rgba(226,232,240,0.6)',
                background: 'rgba(248,250,252,0.5)', padding: '48px 24px', textAlign: 'center',
              }}>
                <Sparkles size={48} color="#cbd5e1" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: 14, color: '#94a3b8' }}>暂无匹配的工作流。</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '16px 24px 24px', color: '#94a3b8', fontSize: 11, lineHeight: 2.2 }}>
          <span>灵阙智能体平台 v3.0 -- Enterprise Edition</span>
          <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
          <span>Maurice | maurice_wen@proton.me</span>
        </div>
      </div>
    </main>
  );
}
