'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Search, ArrowRight, Star, ChevronRight,
  X, Play, Zap, Bot,
} from 'lucide-react';
import { PLATFORM_AGENTS } from '@/lib/agents';
import type { AgentDef } from '@/lib/agents';

// -- Constants --

const BLUE = '#0284C7';
const BLUE_DARK = '#0369A1';
const BLUE_LIGHT = '#0EA5E9';
const TEAL = '#0D9488';

// -- Agent Categories --

const AGENT_CATEGORIES = [
  { id: 'all', label: '全部', icon: Sparkles },
  { id: 'audit', label: '合规审核', icon: Sparkles },
  { id: 'content', label: '内容生产', icon: Sparkles },
  { id: 'data', label: '数据分析', icon: Sparkles },
  { id: 'research', label: '调研洞察', icon: Search },
];

const AGENT_CATEGORY_MAP: Record<string, string> = {
  'expense-audit': 'audit',
  'contract': 'audit',
  'meeting': 'content',
  'deck': 'content',
  'document': 'content',
  'data': 'data',
  'research': 'research',
  'bidding': 'audit',
};

// -- Tier badge styling (light theme) --

function tierStyle(tier: AgentDef['tier']) {
  switch (tier) {
    case 'S':
      return {
        background: 'rgba(2, 132, 199, 0.1)',
        color: BLUE,
        border: '1px solid rgba(2, 132, 199, 0.2)',
      };
    case 'A':
      return {
        background: 'rgba(100, 116, 139, 0.08)',
        color: '#64748b',
        border: '1px solid rgba(100, 116, 139, 0.15)',
      };
    case 'B':
      return {
        background: 'rgba(100, 116, 139, 0.05)',
        color: '#94a3b8',
        border: '1px solid rgba(100, 116, 139, 0.1)',
      };
  }
}

// -- Featured Agent Card (horizontal scroll) --

function FeaturedAgentCard({
  agent,
  onSelect,
  index,
}: {
  agent: AgentDef;
  onSelect: () => void;
  index: number;
}) {
  const Icon = agent.icon;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onSelect}
      type="button"
      style={{
        flexShrink: 0,
        width: 280,
        overflow: 'hidden',
        borderRadius: 16,
        border: '1px solid rgba(226, 232, 240, 0.8)',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: 20,
        textAlign: 'left',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        color: 'inherit',
      }}
    >
      {/* Hover gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, rgba(2, 132, 199, 0.04) 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top row: icon + badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={24} color="white" strokeWidth={2} />
          </div>
          <span
            style={{
              ...tierStyle(agent.tier),
              padding: '3px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            {agent.tier}
          </span>
        </div>

        {/* Name */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
          {agent.name}
        </h2>
        <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
          {agent.nameEn}
        </p>

        {/* Description */}
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 12 }}>
          {agent.description}
        </p>

        {/* Bottom: status + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: 10,
            color: agent.status === 'active' ? TEAL : '#94a3b8',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {agent.status === 'active' ? 'ACTIVE' : 'COMING SOON'}
          </span>
          <ChevronRight size={16} color="#cbd5e1" strokeWidth={2} />
        </div>
      </div>
    </motion.button>
  );
}

// -- Grid Agent Card --

function AgentGridCard({
  agent,
  onSelect,
}: {
  agent: AgentDef;
  onSelect: () => void;
}) {
  const Icon = agent.icon;
  const isFeatured = agent.featured;
  const isComingSoon = agent.status === 'coming-soon';

  return (
    <motion.button
      whileHover={!isComingSoon ? { y: -2, scale: 1.01 } : undefined}
      onClick={onSelect}
      type="button"
      style={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 16,
        border: isFeatured
          ? '1px solid rgba(2, 132, 199, 0.25)'
          : '1px solid rgba(226, 232, 240, 0.8)',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: 20,
        textAlign: 'left',
        cursor: isComingSoon ? 'default' : 'pointer',
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: isFeatured
          ? '0 4px 24px rgba(2, 132, 199, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)'
          : '0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.03)',
        opacity: isComingSoon ? 0.5 : 1,
        color: 'inherit',
      }}
    >
      {/* Featured glow overlay */}
      {isFeatured && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(2,132,199,0.03) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Coming soon overlay */}
      {isComingSoon && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#94a3b8',
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid rgba(226, 232, 240, 0.8)',
            }}
          >
            即将上线
          </span>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Top: icon + badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: isFeatured
                ? `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`
                : '#f1f5f9',
              border: isFeatured ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={22} color={isFeatured ? 'white' : BLUE} strokeWidth={2} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                ...tierStyle(agent.tier),
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              {agent.tier}
            </span>
            {isFeatured && (
              <span
                style={{
                  background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                }}
              >
                LIVE DEMO
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.3px', marginBottom: 2 }}>
            {agent.name}
          </h2>
          <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
            {agent.nameEn}
          </p>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          {agent.description}
        </p>

        {/* Arrow */}
        {agent.href && !isComingSoon && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: isFeatured
                  ? `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`
                  : '#f1f5f9',
                border: isFeatured ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowRight size={16} color={isFeatured ? 'white' : '#64748b'} strokeWidth={2} />
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// -- Agent Preview Panel (slide-in from right) --

function AgentPreviewPanel({
  agent,
  onClose,
}: {
  agent: AgentDef;
  onClose: () => void;
}) {
  const Icon = agent.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100%',
        width: 384,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderLeft: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.08)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(241, 245, 249, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={24} color="white" strokeWidth={2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                {agent.name}
              </h2>
              <span
                style={{
                  ...tierStyle(agent.tier),
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {agent.tier}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>{agent.nameEn}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          style={{
            padding: 8,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9';
            (e.currentTarget as HTMLButtonElement).style.color = '#1e293b';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
          }}
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Description */}
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            介绍
          </h3>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
            {agent.description}
          </p>
        </div>

        {/* Capabilities */}
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            核心能力
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {getCapabilities(agent.id).map((cap) => (
              <div
                key={cap}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid rgba(241, 245, 249, 1)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: BLUE,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: '#334155' }}>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            适用场景
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {getTags(agent.id).map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: 'white',
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#64748b',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Status */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: agent.status === 'active'
              ? 'rgba(13, 148, 136, 0.05)'
              : 'rgba(100, 116, 139, 0.05)',
            border: `1px solid ${agent.status === 'active' ? 'rgba(13, 148, 136, 0.12)' : 'rgba(100, 116, 139, 0.1)'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Zap size={14} color={agent.status === 'active' ? TEAL : '#94a3b8'} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 600, color: agent.status === 'active' ? '#0f766e' : '#64748b' }}>
              {agent.status === 'active' ? '已就绪' : '开发中'}
            </span>
          </div>
          <p style={{ fontSize: 12, color: agent.status === 'active' ? '#0f766e' : '#94a3b8', opacity: 0.8 }}>
            {agent.status === 'active'
              ? '此智能体已上线，可直接使用。'
              : '此智能体正在开发中，敬请期待。'}
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: 16, borderTop: '1px solid rgba(241, 245, 249, 1)' }}>
        {agent.href && agent.status === 'active' ? (
          <Link
            href={agent.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            <Play size={16} strokeWidth={2} />
            进入工作台
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '12px 24px',
              borderRadius: 12,
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: '#f8fafc',
              color: '#94a3b8',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'not-allowed',
            }}
          >
            {agent.status === 'coming-soon' ? '即将上线' : '暂无工作台'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// -- Helper data --

function getCapabilities(agentId: string): string[] {
  const map: Record<string, string[]> = {
    'expense-audit': ['OCR 智能识别', '单据自动拆分', '接待类型判定', '合规规则校验', '审核建议生成'],
    'meeting': ['实时录音转写', '智能纪要生成', '待办自动提取', '多语言支持'],
    'deck': ['结构化叙事', '智能版式生成', '演讲备注', '品牌模板适配'],
    'document': ['多模板支持', '格式规范检查', '一键导出', '版本管理'],
    'contract': ['风险条款识别', '逐条审核', '修改建议生成', '法律合规校验'],
    'data': ['报表智能处理', '数据清洗', '可视化图表', '洞察自动生成'],
    'research': ['深度调研', '竞品分析', '结构化报告', '趋势预测'],
    'bidding': ['标书生成', '合规检查', '评分预测', '历史分析'],
  };
  return map[agentId] || ['智能处理', '自动化分析', '报告生成'];
}

function getTags(agentId: string): string[] {
  const map: Record<string, string[]> = {
    'expense-audit': ['财务', '合规', '审计', '报销'],
    'meeting': ['协作', '会议', '效率', '记录'],
    'deck': ['演示', '设计', '报告', '品牌'],
    'document': ['公文', '行政', '规范', '模板'],
    'contract': ['法务', '合同', '风控', '合规'],
    'data': ['数据', '分析', '可视化', '报表'],
    'research': ['调研', '洞察', '竞品', '趋势'],
    'bidding': ['招标', '投标', '采购', '评审'],
  };
  return map[agentId] || ['通用', '办公', '效率'];
}

// -- Animation Variants --

const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// -- Page Component --

export default function PlatformHome() {
  const [query, setQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedAgent, setSelectedAgent] = React.useState<AgentDef | null>(null);

  const featuredAgents = React.useMemo(() => {
    return PLATFORM_AGENTS.filter(a => a.tier === 'S').slice(0, 6);
  }, []);

  const filteredAgents = React.useMemo(() => {
    let agents = PLATFORM_AGENTS;

    if (query.trim()) {
      const keyword = query.trim().toLowerCase();
      agents = agents.filter(a =>
        [a.name, a.nameEn, a.description].join(' ').toLowerCase().includes(keyword)
      );
    }

    if (selectedCategory !== 'all') {
      agents = agents.filter(a => AGENT_CATEGORY_MAP[a.id] === selectedCategory);
    }

    return agents;
  }, [query, selectedCategory]);

  const activeAgents = PLATFORM_AGENTS.filter(a => a.status === 'active');

  return (
    <main className="h-full flex flex-col overflow-hidden">
      {/* PageHeader - sticky top bar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sparkles size={20} color={BLUE} strokeWidth={2} />
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', letterSpacing: '-0.3px' }}>
                专业智能体
              </h1>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                选择专家，直接进入生产交付
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
              }}
            >
              <Bot size={14} color={BLUE} strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{PLATFORM_AGENTS.length}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>位专家</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 10,
                background: 'rgba(240, 253, 250, 0.8)',
                border: '1px solid rgba(13, 148, 136, 0.12)',
              }}
            >
              <Zap size={14} color={TEAL} strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f766e' }}>{activeAgents.length}</span>
              <span style={{ fontSize: 12, color: '#0f766e', opacity: 0.7 }}>就绪</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Scrollable content area */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ padding: '24px 24px 32px' }}>

          {/* Section 1: Featured Agents Horizontal Scroll */}
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 32 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={18} color="#f59e0b" strokeWidth={2} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>精选智能体</h2>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>推荐使用</span>
            </div>

            <div
              className="scrollbar-hide"
              style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                paddingBottom: 8,
              }}
            >
              {featuredAgents.map((agent, index) => (
                <FeaturedAgentCard
                  key={agent.id}
                  agent={agent}
                  index={index}
                  onSelect={() => setSelectedAgent(agent)}
                />
              ))}
            </div>
          </motion.div>

          {/* Section 2: Search & Category Filter */}
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.05 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{ position: 'relative', maxWidth: 400, marginBottom: 16 }}>
              <Search
                size={16}
                strokeWidth={2}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索专家 / 场景 / 能力..."
                style={{
                  width: '100%',
                  height: 42,
                  paddingLeft: 40,
                  paddingRight: 14,
                  borderRadius: 12,
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  color: '#1e293b',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(2, 132, 199, 0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {AGENT_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const CatIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      border: isActive ? 'none' : '1px solid rgba(226, 232, 240, 0.6)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: isActive
                        ? `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`
                        : 'rgba(255, 255, 255, 0.6)',
                      color: isActive ? 'white' : '#64748b',
                      boxShadow: isActive ? '0 4px 12px rgba(2, 132, 199, 0.2)' : 'none',
                    }}
                  >
                    <CatIcon size={14} strokeWidth={2} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Section 3: All Agents Grid */}
          <motion.div
            {...fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingLeft: 4 }}>
              <Sparkles size={14} color="#94a3b8" strokeWidth={2} />
              <h2 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                {query ? `搜索结果 (${filteredAgents.length})` : '全部智能体'}
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              }}
            >
              {filteredAgents.map((agent) => (
                <AgentGridCard
                  key={agent.id}
                  agent={agent}
                  onSelect={() => setSelectedAgent(agent)}
                />
              ))}

              {filteredAgents.length === 0 && (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    borderRadius: 16,
                    border: '2px dashed rgba(226, 232, 240, 0.6)',
                    background: 'rgba(248, 250, 252, 0.5)',
                    padding: '48px 24px',
                    textAlign: 'center',
                  }}
                >
                  <Sparkles size={48} color="#cbd5e1" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
                  <p style={{ fontSize: 14, color: '#94a3b8' }}>
                    暂无匹配的专家，请调整关键词。
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            padding: '16px 24px 24px',
            color: '#94a3b8',
            fontSize: 11,
            lineHeight: 2.2,
          }}
        >
          <span>灵阙智能体平台 v3.0 -- Enterprise Edition</span>
          <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
          <span>Maurice | maurice_wen@proton.me</span>
        </div>
      </div>

      {/* Agent Preview Panel */}
      <AnimatePresence>
        {selectedAgent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.15)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: 40,
              }}
              onClick={() => setSelectedAgent(null)}
            />
            <AgentPreviewPanel
              agent={selectedAgent}
              onClose={() => setSelectedAgent(null)}
            />
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
