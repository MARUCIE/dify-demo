'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Workflow, Play, Settings, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import WorkflowPipeline from '@/components/workflow/WorkflowPipeline';
import { WORKFLOW_STEPS } from '@/lib/constants';
import type { StepState } from '@/lib/types';

const BLUE = '#0284C7';
const BLUE_DARK = '#0369A1';

// Show all steps as idle (editor view, not running)
const IDLE_STATES: StepState[] = WORKFLOW_STEPS.map(s => ({ stepId: s.id, status: 'idle' as const }));

export default function WorkflowEditorPage() {
  return (
    <main className="h-full flex flex-col overflow-hidden">
      {/* PageHeader with back */}
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
            <Link
              href="/workflows"
              aria-label="返回工作流列表"
              style={{
                padding: 8, borderRadius: 8, border: 'none', background: 'transparent',
                color: '#64748b', textDecoration: 'none', display: 'flex', alignItems: 'center',
              }}
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </Link>
            <div style={{ height: 16, width: 1, background: '#e2e8f0' }} />
            <Workflow size={20} color={BLUE} strokeWidth={2} />
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>报销审核流程</h1>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Expense Audit Pipeline v2.0.0</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10,
              background: 'rgba(13, 148, 136, 0.06)', border: '1px solid rgba(13, 148, 136, 0.12)',
              fontSize: 12, fontWeight: 600, color: '#0f766e',
            }}>
              <Zap size={13} strokeWidth={2} />
              已就绪
            </span>
            <button type="button" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 12,
              border: 'none', background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
              color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
            }}>
              <Play size={14} strokeWidth={2} />
              运行测试
            </button>
          </div>
        </div>
      </motion.header>

      {/* Golden Ratio Layout: config panel (38.2%) + canvas (61.8%) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Config Panel */}
        <div style={{
          width: '45%', borderRight: '1px solid rgba(226, 232, 240, 0.6)',
          overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          {/* Workflow Info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 16, border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={14} color={BLUE} strokeWidth={2} />
              工作流配置
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>名称</label>
                <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600, marginTop: 2 }}>报销审核流程</div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>版本</label>
                <div style={{ fontSize: 14, color: '#1e293b', marginTop: 2 }}>v2.0.0</div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>描述</label>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginTop: 2 }}>
                  10步智能审核流程：OCR识别 → 单据拆分 → 接待类型判定 → 合规校验 → 审核建议生成
                </div>
              </div>
            </div>
          </motion.div>

          {/* Steps List */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              borderRadius: 16, border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Workflow size={14} color={BLUE} strokeWidth={2} />
              节点列表 ({WORKFLOW_STEPS.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {WORKFLOW_STEPS.map((step, i) => (
                <div
                  key={step.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10,
                    background: '#f8fafc', border: '1px solid rgba(241, 245, 249, 1)',
                    fontSize: 13, color: '#334155',
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: i < 6 ? 'rgba(2, 132, 199, 0.08)' : i === 6 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(13, 148, 136, 0.08)',
                    color: i < 6 ? BLUE : i === 6 ? '#b45309' : '#0f766e',
                    border: i < 6 ? '1px solid rgba(2,132,199,0.15)' : i === 6 ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(13,148,136,0.15)',
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: 500 }}>{step.name}</span>
                  {i === 6 && (
                    <span style={{ fontSize: 10, color: '#b45309', fontWeight: 600, background: 'rgba(245,158,11,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                      IF
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Execution Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              borderRadius: 16, border: '1px solid rgba(226, 232, 240, 0.8)',
              background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
              padding: 20,
            }}
          >
            <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} color={BLUE} strokeWidth={2} />
              执行统计
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: '总执行次数', value: '1,247' },
                { label: '成功率', value: '98.7%' },
                { label: '平均耗时', value: '15s' },
                { label: '本周执行', value: '89' },
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
          </motion.div>
        </div>

        {/* Right: Canvas (61.8%) */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column' }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ flex: 1 }}
          >
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Workflow size={14} color="#94a3b8" strokeWidth={2} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>节点流程图</span>
              </div>
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>含分支决策节点</span>
            </div>
            <WorkflowPipeline
              steps={WORKFLOW_STEPS}
              stepStates={IDLE_STATES}
            />
          </motion.div>
        </div>
      </div>
    </main>
  );
}
