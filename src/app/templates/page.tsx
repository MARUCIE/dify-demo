'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutTemplate, Search, Star, Sparkles, Workflow, Bot, ArrowRight,
} from 'lucide-react';
import { PLATFORM_TEMPLATES } from '@/lib/workflows';
import type { TemplateDef } from '@/lib/workflows';

const BLUE = '#0284C7';
const BLUE_DARK = '#0369A1';

const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: '合规审核', label: '合规审核' },
  { id: '内容生产', label: '内容生产' },
  { id: '数据分析', label: '数据分析' },
  { id: '调研洞察', label: '调研洞察' },
];

function TemplateCard({ tpl, index }: { tpl: TemplateDef; index: number }) {
  const Icon = tpl.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2, scale: 1.01 }}
      style={{
        borderRadius: 16,
        border: tpl.featured ? '1px solid rgba(2, 132, 199, 0.25)' : '1px solid rgba(226, 232, 240, 0.8)',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: tpl.featured ? '0 4px 24px rgba(2, 132, 199, 0.08)' : '0 4px 24px rgba(0, 0, 0, 0.04)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
    >
      {tpl.featured && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(2,132,199,0.03) 0%, transparent 60%)', pointerEvents: 'none' }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: tpl.featured ? `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})` : '#f1f5f9',
            border: tpl.featured ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={22} color={tpl.featured ? 'white' : BLUE} strokeWidth={2} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Type badge */}
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: tpl.type === 'workflow' ? 'rgba(2, 132, 199, 0.08)' : 'rgba(13, 148, 136, 0.08)',
              color: tpl.type === 'workflow' ? BLUE : '#0f766e',
              border: `1px solid ${tpl.type === 'workflow' ? 'rgba(2,132,199,0.15)' : 'rgba(13,148,136,0.15)'}`,
            }}>
              {tpl.type === 'workflow' ? <Workflow size={10} strokeWidth={2} /> : <Bot size={10} strokeWidth={2} />}
              {tpl.type === 'workflow' ? '工作流' : '智能体'}
            </span>
            {/* Stars */}
            <span style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 11, color: '#f59e0b', fontWeight: 600,
            }}>
              <Star size={12} strokeWidth={2} fill="#f59e0b" />
              {tpl.stars}
            </span>
          </div>
        </div>

        {/* Name */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{tpl.name}</h3>
        <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{tpl.nameEn}</p>

        {/* Description */}
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>{tpl.description}</p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {tpl.tags.map(tag => (
            <span key={tag} style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: '#f1f5f9', color: '#64748b', border: '1px solid rgba(226,232,240,0.6)',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Use button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
            background: tpl.featured ? `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})` : '#f1f5f9',
            border: tpl.featured ? 'none' : '1px solid rgba(226,232,240,0.8)',
            fontSize: 12, fontWeight: 600,
            color: tpl.featured ? 'white' : '#64748b',
          }}>
            使用模板
            <ArrowRight size={12} strokeWidth={2} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TemplatesPage() {
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const [featuredOnly, setFeaturedOnly] = React.useState(false);

  const filtered = React.useMemo(() => {
    let items = PLATFORM_TEMPLATES;
    if (query.trim()) {
      const kw = query.trim().toLowerCase();
      items = items.filter(t => [t.name, t.nameEn, t.description, ...t.tags].join(' ').toLowerCase().includes(kw));
    }
    if (category !== 'all') {
      items = items.filter(t => t.category === category);
    }
    if (featuredOnly) {
      items = items.filter(t => t.featured);
    }
    return items;
  }, [query, category, featuredOnly]);

  const workflowCount = PLATFORM_TEMPLATES.filter(t => t.type === 'workflow').length;
  const agentCount = PLATFORM_TEMPLATES.filter(t => t.type === 'agent').length;

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
            <LayoutTemplate size={20} color={BLUE} strokeWidth={2} />
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>模板库</h1>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>快速启用预设的智能体和工作流模板</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226,232,240,0.8)',
            }}>
              <Workflow size={14} color={BLUE} strokeWidth={2} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{workflowCount}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>工作流</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10,
              background: 'rgba(240,253,250,0.8)', border: '1px solid rgba(13,148,136,0.12)',
            }}>
              <Bot size={14} color="#0D9488" strokeWidth={2} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f766e' }}>{agentCount}</span>
              <span style={{ fontSize: 12, color: '#0f766e', opacity: 0.7 }}>智能体</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '24px 24px 32px' }}>
          {/* Search + Filters */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                <Search size={16} strokeWidth={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="搜索模板..."
                  style={{
                    width: '100%', height: 42, paddingLeft: 40, paddingRight: 14, borderRadius: 12,
                    border: '1px solid rgba(226,232,240,0.8)', background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(12px)', color: '#1e293b', fontSize: 14, outline: 'none',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setFeaturedOnly(!featuredOnly)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12,
                  border: featuredOnly ? 'none' : '1px solid rgba(226,232,240,0.6)',
                  background: featuredOnly ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.6)',
                  color: featuredOnly ? '#b45309' : '#64748b',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Star size={14} strokeWidth={2} fill={featuredOnly ? '#f59e0b' : 'none'} color={featuredOnly ? '#f59e0b' : '#94a3b8'} />
                精选
              </button>
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {CATEGORIES.map(cat => {
                const isActive = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                      border: isActive ? 'none' : '1px solid rgba(226,232,240,0.6)',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      background: isActive ? `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})` : 'rgba(255,255,255,0.6)',
                      color: isActive ? 'white' : '#64748b',
                      boxShadow: isActive ? '0 4px 12px rgba(2,132,199,0.2)' : 'none',
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Grid */}
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filtered.map((tpl, i) => (
              <TemplateCard key={tpl.id} tpl={tpl} index={i} />
            ))}
            {filtered.length === 0 && (
              <div style={{
                gridColumn: '1 / -1', borderRadius: 16, border: '2px dashed rgba(226,232,240,0.6)',
                background: 'rgba(248,250,252,0.5)', padding: '48px 24px', textAlign: 'center',
              }}>
                <Sparkles size={48} color="#cbd5e1" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: 14, color: '#94a3b8' }}>暂无匹配的模板。</p>
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
