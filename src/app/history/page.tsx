'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Search, MessageSquare, Activity,
  CheckCircle2, AlertCircle, XCircle,
  Sparkles, Timer, Zap,
} from 'lucide-react';
import { MOCK_CONVERSATIONS, MOCK_AUDIT_TRACES } from '@/lib/history';
import type { ConversationRecord, AuditTrace, AuditTraceStep } from '@/lib/history';

const BLUE = '#0284C7';

function statusStyle(status: string) {
  switch (status) {
    case 'completed': case 'success':
      return { bg: 'rgba(13, 148, 136, 0.08)', color: '#0f766e', border: '1px solid rgba(13, 148, 136, 0.15)', label: status === 'completed' ? '已完成' : '成功' };
    case 'active':
      return { bg: 'rgba(2, 132, 199, 0.08)', color: BLUE, border: '1px solid rgba(2, 132, 199, 0.15)', label: '进行中' };
    case 'warning':
      return { bg: 'rgba(245, 158, 11, 0.08)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.15)', label: '警告' };
    case 'error':
      return { bg: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.15)', label: '异常' };
    default:
      return { bg: '#f1f5f9', color: '#64748b', border: '1px solid rgba(226,232,240,0.8)', label: status };
  }
}

function stepIcon(status: AuditTraceStep['status']) {
  switch (status) {
    case 'success': return <CheckCircle2 size={14} color="#0f766e" strokeWidth={2} />;
    case 'warning': return <AlertCircle size={14} color="#b45309" strokeWidth={2} />;
    case 'error': return <XCircle size={14} color="#dc2626" strokeWidth={2} />;
    case 'skipped': return <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#e2e8f0' }} />;
  }
}

function ConvCard({ conv, index }: { conv: ConversationRecord; index: number }) {
  const badge = statusStyle(conv.status);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      whileHover={{ y: -2 }}
      style={{
        borderRadius: 16, border: '1px solid rgba(226, 232, 240, 0.8)',
        background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
        padding: 16, cursor: 'pointer', transition: 'all 0.2s ease',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, color: BLUE,
          background: 'rgba(2,132,199,0.06)', padding: '2px 8px', borderRadius: 6,
        }}>
          {conv.agentName}
        </span>
        <span style={{
          background: badge.bg, color: badge.color, border: badge.border,
          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
        }}>
          {badge.label}
        </span>
      </div>
      <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 8, lineHeight: 1.4 }}>{conv.title}</h4>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#94a3b8' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <MessageSquare size={11} strokeWidth={2} /> {conv.messageCount}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Timer size={11} strokeWidth={2} /> {conv.duration}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Zap size={11} strokeWidth={2} /> {(conv.totalTokens / 1000).toFixed(1)}k
        </span>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: '#cbd5e1' }}>{conv.lastMessageAt}</div>
    </motion.div>
  );
}

function TraceCard({ trace, index, selected, onSelect }: { trace: AuditTrace; index: number; selected: boolean; onSelect: () => void }) {
  const badge = statusStyle(trace.status);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={onSelect}
      style={{
        borderRadius: 16,
        border: selected ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid rgba(226, 232, 240, 0.8)',
        background: selected ? 'rgba(2, 132, 199, 0.03)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)', padding: 16, cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: selected ? '0 4px 16px rgba(2,132,199,0.08)' : '0 2px 12px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{trace.workflowName}</h4>
        <span style={{
          background: badge.bg, color: badge.color, border: badge.border,
          padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
        }}>
          {badge.label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#94a3b8' }}>
        <span>{trace.spanCount} 步骤</span>
        <span>{(trace.durationMs / 1000).toFixed(1)}s</span>
        <span>{trace.triggeredBy}</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: '#cbd5e1' }}>{trace.triggeredAt}</div>
    </motion.div>
  );
}

function TraceDetail({ trace }: { trace: AuditTrace }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        borderRadius: 16, border: '1px solid rgba(226, 232, 240, 0.8)',
        background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
        padding: 20, height: '100%', overflowY: 'auto',
      }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{trace.workflowName}</h3>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>
        {trace.triggeredAt} -- {trace.triggeredBy} -- {(trace.durationMs / 1000).toFixed(1)}s
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {trace.steps.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
              {stepIcon(step.status)}
              {i < trace.steps.length - 1 && (
                <div style={{
                  width: 2, flex: 1,
                  background: step.status === 'error' ? '#fecaca' : '#e2e8f0',
                  minHeight: 24,
                }} />
              )}
            </div>
            <div style={{ flex: 1, paddingBottom: i < trace.steps.length - 1 ? 16 : 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{step.name}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {step.status === 'skipped' ? '已跳过' : `${(step.durationMs / 1000).toFixed(1)}s`}
              </div>
              {step.detail && (
                <div style={{
                  marginTop: 4, fontSize: 12,
                  color: step.status === 'error' ? '#dc2626' : '#b45309',
                  background: step.status === 'error' ? 'rgba(220,38,38,0.06)' : 'rgba(245,158,11,0.06)',
                  padding: '4px 8px', borderRadius: 6,
                }}>
                  {step.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [tab, setTab] = React.useState<'conversations' | 'audit'>('conversations');
  const [query, setQuery] = React.useState('');
  const [selectedTraceId, setSelectedTraceId] = React.useState<string | null>(null);

  const filteredConvs = React.useMemo(() => {
    if (!query.trim()) return MOCK_CONVERSATIONS;
    const kw = query.trim().toLowerCase();
    return MOCK_CONVERSATIONS.filter(c => [c.title, c.agentName].join(' ').toLowerCase().includes(kw));
  }, [query]);

  const filteredTraces = React.useMemo(() => {
    if (!query.trim()) return MOCK_AUDIT_TRACES;
    const kw = query.trim().toLowerCase();
    return MOCK_AUDIT_TRACES.filter(t => [t.workflowName, t.triggeredBy].join(' ').toLowerCase().includes(kw));
  }, [query]);

  const selectedTrace = MOCK_AUDIT_TRACES.find(t => t.id === selectedTraceId) || null;

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
            <Clock size={20} color={BLUE} strokeWidth={2} />
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>历史记录</h1>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>查看对话历史和执行轨迹</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(226,232,240,0.8)',
            }}>
              <MessageSquare size={14} color={BLUE} strokeWidth={2} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{MOCK_CONVERSATIONS.length}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>对话</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10,
              background: 'rgba(240,253,250,0.8)', border: '1px solid rgba(13,148,136,0.12)',
            }}>
              <Activity size={14} color="#0D9488" strokeWidth={2} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f766e' }}>{MOCK_AUDIT_TRACES.length}</span>
              <span style={{ fontSize: 12, color: '#0f766e', opacity: 0.7 }}>轨迹</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '24px 24px 32px' }}>
          {/* Tabs + Search */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 3 }}>
                {([
                  { id: 'conversations' as const, label: '对话记录', icon: MessageSquare },
                  { id: 'audit' as const, label: '决策审计', icon: Activity },
                ] as const).map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setTab(t.id); setSelectedTraceId(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
                      border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      background: tab === t.id ? 'white' : 'transparent',
                      color: tab === t.id ? '#1e293b' : '#94a3b8',
                      boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <t.icon size={14} strokeWidth={2} />
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
                <Search size={16} strokeWidth={2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={tab === 'conversations' ? '搜索对话...' : '搜索执行轨迹...'}
                  style={{
                    width: '100%', height: 42, paddingLeft: 40, paddingRight: 14, borderRadius: 12,
                    border: '1px solid rgba(226,232,240,0.8)', background: 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(12px)', color: '#1e293b', fontSize: 14, outline: 'none',
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {tab === 'conversations' ? (
              <motion.div key="conversations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {filteredConvs.map((conv, i) => (
                    <ConvCard key={conv.id} conv={conv} index={i} />
                  ))}
                </div>
                {filteredConvs.length === 0 && (
                  <div style={{
                    borderRadius: 16, border: '2px dashed rgba(226,232,240,0.6)',
                    background: 'rgba(248,250,252,0.5)', padding: '48px 24px', textAlign: 'center',
                  }}>
                    <Sparkles size={48} color="#cbd5e1" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 14, color: '#94a3b8' }}>暂无匹配的对话记录。</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', gap: 16, minHeight: 400 }}
              >
                {/* Trace list */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredTraces.map((trace, i) => (
                    <TraceCard
                      key={trace.id}
                      trace={trace}
                      index={i}
                      selected={selectedTraceId === trace.id}
                      onSelect={() => setSelectedTraceId(trace.id === selectedTraceId ? null : trace.id)}
                    />
                  ))}
                  {filteredTraces.length === 0 && (
                    <div style={{
                      borderRadius: 16, border: '2px dashed rgba(226,232,240,0.6)',
                      background: 'rgba(248,250,252,0.5)', padding: '48px 24px', textAlign: 'center',
                    }}>
                      <Sparkles size={48} color="#cbd5e1" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
                      <p style={{ fontSize: 14, color: '#94a3b8' }}>暂无匹配的执行轨迹。</p>
                    </div>
                  )}
                </div>
                {/* Detail panel */}
                <AnimatePresence>
                  {selectedTrace && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 380 }}
                      exit={{ opacity: 0, width: 0 }}
                      style={{ flexShrink: 0, overflow: 'hidden' }}
                    >
                      <TraceDetail trace={selectedTrace} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
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
