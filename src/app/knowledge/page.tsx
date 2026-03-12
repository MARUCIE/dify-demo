'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Database, Search, Plus, FileText, Layers, Clock,
  CheckCircle2, Loader2, AlertCircle, Sparkles,
} from 'lucide-react';
import { PLATFORM_KNOWLEDGE_BASES } from '@/lib/knowledge';
import type { KnowledgeBase } from '@/lib/knowledge';

const BLUE = '#0284C7';
const BLUE_DARK = '#0369A1';

function statusConfig(status: KnowledgeBase['status']) {
  switch (status) {
    case 'active':
      return { Icon: CheckCircle2, bg: 'rgba(13, 148, 136, 0.08)', color: '#0f766e', border: '1px solid rgba(13, 148, 136, 0.15)', label: '已激活' };
    case 'indexing':
      return { Icon: Loader2, bg: 'rgba(245, 158, 11, 0.08)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.15)', label: '索引中' };
    case 'error':
      return { Icon: AlertCircle, bg: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.15)', label: '异常' };
  }
}

function KBCard({ kb, index }: { kb: KnowledgeBase; index: number }) {
  const Icon = kb.icon;
  const status = statusConfig(kb.status);
  const StatusIcon = status.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2, scale: 1.01 }}
      style={{
        borderRadius: 16,
        border: '1px solid rgba(226, 232, 240, 0.8)',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: '#f1f5f9',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={BLUE} strokeWidth={2} />
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: status.bg, color: status.color, border: status.border,
          padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
        }}>
          <StatusIcon size={12} strokeWidth={2} className={kb.status === 'indexing' ? 'animate-spin' : ''} />
          {status.label}
        </span>
      </div>

      {/* Name */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{kb.name}</h3>
      <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{kb.nameEn}</p>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>{kb.description}</p>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <FileText size={12} color="#94a3b8" strokeWidth={2} />
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{kb.documentCount}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>文档</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Layers size={12} color="#94a3b8" strokeWidth={2} />
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{kb.totalChunks.toLocaleString()}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>分块</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, color: '#94a3b8', fontFamily: 'monospace',
          background: '#f8fafc', padding: '2px 6px', borderRadius: 4,
        }}>{kb.embeddingModel}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} color="#cbd5e1" strokeWidth={2} />
          <span style={{ fontSize: 11, color: '#cbd5e1' }}>{kb.updatedAt}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function KnowledgePage() {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!query.trim()) return PLATFORM_KNOWLEDGE_BASES;
    const kw = query.trim().toLowerCase();
    return PLATFORM_KNOWLEDGE_BASES.filter(kb =>
      [kb.name, kb.nameEn, kb.description, kb.embeddingModel].join(' ').toLowerCase().includes(kw)
    );
  }, [query]);

  const activeCount = PLATFORM_KNOWLEDGE_BASES.filter(kb => kb.status === 'active').length;
  const totalDocs = PLATFORM_KNOWLEDGE_BASES.reduce((sum, kb) => sum + kb.documentCount, 0);
  const totalChunks = PLATFORM_KNOWLEDGE_BASES.reduce((sum, kb) => sum + kb.totalChunks, 0);

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
            <Database size={20} color={BLUE} strokeWidth={2} />
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>知识库</h1>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>管理智能体的专业知识来源</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226,232,240,0.8)',
            }}>
              <Database size={14} color={BLUE} strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{PLATFORM_KNOWLEDGE_BASES.length}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>个知识库</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10,
              background: 'rgba(240,253,250,0.8)', border: '1px solid rgba(13,148,136,0.12)',
            }}>
              <FileText size={14} color="#0D9488" strokeWidth={2} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f766e' }}>{totalDocs}</span>
              <span style={{ fontSize: 12, color: '#0f766e', opacity: 0.7 }}>文档</span>
            </div>
            <button type="button" style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 12,
              border: 'none', background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
              color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
            }}>
              <Plus size={16} strokeWidth={2} />
              创建知识库
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
                placeholder="搜索知识库..."
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
            {filtered.map((kb, i) => (
              <KBCard key={kb.id} kb={kb} index={i} />
            ))}
            {filtered.length === 0 && (
              <div style={{
                gridColumn: '1 / -1', borderRadius: 16, border: '2px dashed rgba(226,232,240,0.6)',
                background: 'rgba(248,250,252,0.5)', padding: '48px 24px', textAlign: 'center',
              }}>
                <Sparkles size={48} color="#cbd5e1" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: 14, color: '#94a3b8' }}>暂无匹配的知识库。</p>
              </div>
            )}
          </div>

          {/* Summary stats card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginTop: 24 }}
          >
            <div style={{
              borderRadius: 16, border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
              padding: 20,
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={14} color={BLUE} strokeWidth={2} />
                知识库概览
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: '知识库总数', value: PLATFORM_KNOWLEDGE_BASES.length.toString() },
                  { label: '已激活', value: activeCount.toString() },
                  { label: '总文档数', value: totalDocs.toString() },
                  { label: '总分块数', value: totalChunks.toLocaleString() },
                ].map(stat => (
                  <div key={stat.label} style={{
                    padding: '10px 12px', borderRadius: 10, background: '#f8fafc',
                    border: '1px solid rgba(241, 245, 249, 1)',
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
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
