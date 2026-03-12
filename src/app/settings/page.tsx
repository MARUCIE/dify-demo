'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Cpu, Database, Bell, Shield, Key,
  CheckCircle2, AlertCircle, Download, Upload, ExternalLink,
} from 'lucide-react';

const BLUE = '#0284C7';
const BLUE_DARK = '#0369A1';

interface ModelProvider {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  models: string[];
  emoji: string;
}

const MODEL_PROVIDERS: ModelProvider[] = [
  { id: 'openai', name: 'OpenAI', status: 'connected', models: ['GPT-4o', 'GPT-4o-mini', 'text-embedding-3-small'], emoji: 'O' },
  { id: 'anthropic', name: 'Anthropic', status: 'connected', models: ['Claude Opus 4', 'Claude Sonnet 4', 'Claude Haiku 3.5'], emoji: 'A' },
  { id: 'google', name: 'Google AI', status: 'connected', models: ['Gemini 2.5 Pro', 'Gemini 2.5 Flash'], emoji: 'G' },
  { id: 'zhipu', name: '智谱 AI', status: 'disconnected', models: ['GLM-4-Plus', 'GLM-4-Flash'], emoji: 'Z' },
  { id: 'deepseek', name: 'DeepSeek', status: 'disconnected', models: ['DeepSeek-V3', 'DeepSeek-R1'], emoji: 'D' },
];

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10a37f',
  anthropic: '#cc785c',
  google: '#4285f4',
  zhipu: '#6366f1',
  deepseek: '#ef4444',
};

function providerStatusBadge(status: ModelProvider['status']) {
  switch (status) {
    case 'connected':
      return { bg: 'rgba(13, 148, 136, 0.08)', color: '#0f766e', border: '1px solid rgba(13, 148, 136, 0.15)', label: '已连接', Icon: CheckCircle2 };
    case 'disconnected':
      return { bg: '#f1f5f9', color: '#94a3b8', border: '1px solid rgba(226,232,240,0.8)', label: '未连接', Icon: AlertCircle };
    case 'error':
      return { bg: 'rgba(220, 38, 38, 0.08)', color: '#dc2626', border: '1px solid rgba(220, 38, 38, 0.15)', label: '异常', Icon: AlertCircle };
  }
}

const NOTIFICATION_DEFAULTS = [
  { title: '工作流完成通知', desc: '当工作流执行完成时发送通知', default: true },
  { title: '异常告警', desc: '当工作流执行失败或出现异常时告警', default: true },
  { title: '知识库更新提醒', desc: '当知识库文档索引完成时提醒', default: false },
  { title: '每日摘要', desc: '每天早上发送前一天的执行摘要', default: false },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = React.useState('providers');
  const [notifications, setNotifications] = React.useState(
    NOTIFICATION_DEFAULTS.map(n => n.default)
  );

  const toggleNotification = (index: number) => {
    setNotifications(prev => prev.map((v, i) => i === index ? !v : v));
  };

  const sections = [
    { id: 'providers', label: '模型配置', icon: Cpu },
    { id: 'data', label: '数据管理', icon: Database },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'security', label: '安全与权限', icon: Shield },
  ];

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
        <div style={{ padding: '0 24px', height: 64, display: 'flex', alignItems: 'center' }}>
          <Settings size={20} color={BLUE} strokeWidth={2} />
          <div style={{ marginLeft: 12 }}>
            <h1 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>设置</h1>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>平台配置与系统管理</p>
          </div>
        </div>
      </motion.header>

      {/* Content: settings sidebar + detail */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Settings nav */}
        <div style={{
          width: 220, borderRight: '1px solid rgba(226, 232, 240, 0.6)',
          padding: '16px 12px', flexShrink: 0,
        }}>
          {sections.map(s => {
            const active = activeSection === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 12px', borderRadius: 10, border: 'none',
                  background: active ? 'rgba(2, 132, 199, 0.06)' : 'transparent',
                  color: active ? BLUE : '#64748b',
                  fontSize: 13, fontWeight: active ? 600 : 500, cursor: 'pointer',
                  marginBottom: 4, transition: 'all 0.15s ease', textAlign: 'left',
                }}
              >
                <Icon size={16} strokeWidth={2} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Settings content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {activeSection === 'providers' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>模型服务商</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>配置 AI 模型供应商的 API 密钥和连接</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {MODEL_PROVIDERS.map((provider, i) => {
                  const status = providerStatusBadge(provider.status);
                  const StatusIcon = status.Icon;
                  const color = PROVIDER_COLORS[provider.id] || BLUE;
                  return (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        borderRadius: 14, border: '1px solid rgba(226, 232, 240, 0.8)',
                        background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
                        padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: `${color}15`, border: `1px solid ${color}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, fontWeight: 800, color,
                        }}>
                          {provider.emoji}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{provider.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            {provider.models.join(' / ')}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: status.bg, color: status.color, border: status.border,
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                        }}>
                          <StatusIcon size={12} strokeWidth={2} />
                          {status.label}
                        </span>
                        <button type="button" style={{
                          padding: '6px 14px', borderRadius: 8,
                          border: '1px solid rgba(226,232,240,0.8)', background: 'white',
                          fontSize: 12, fontWeight: 500, color: '#64748b', cursor: 'pointer',
                        }}>
                          {provider.status === 'connected' ? '管理' : '连接'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* API Keys */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Key size={14} color={BLUE} strokeWidth={2} />
                  API 密钥管理
                </h3>
                <div style={{
                  borderRadius: 14, border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: 'rgba(255, 255, 255, 0.7)', padding: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>已配置 3 个 API 密钥</span>
                    <button type="button" style={{
                      padding: '6px 14px', borderRadius: 8,
                      border: 'none', background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
                      color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                      添加密钥
                    </button>
                  </div>
                  {['OpenAI API Key', 'Anthropic API Key', 'Google AI API Key'].map((key, i) => (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(241,245,249,1)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Key size={12} color="#94a3b8" strokeWidth={2} />
                        <span style={{ fontSize: 13, color: '#1e293b' }}>{key}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#cbd5e1', fontFamily: 'monospace' }}>
                        sk-****...{String(i + 1).padStart(4, '0')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'data' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>数据管理</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>备份、导出和管理平台数据</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: Download, title: '导出数据', desc: '导出知识库、对话记录和工作流配置', action: '导出' },
                  { icon: Upload, title: '导入数据', desc: '从备份文件恢复平台数据', action: '导入' },
                  { icon: Database, title: '存储用量', desc: '知识库 18.5 MB / 对话 4.2 MB / 附件 156 MB', action: '管理' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      borderRadius: 14, border: '1px solid rgba(226, 232, 240, 0.8)',
                      background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
                      padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, background: '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <item.icon size={20} color={BLUE} strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.desc}</div>
                      </div>
                    </div>
                    <button type="button" style={{
                      padding: '6px 14px', borderRadius: 8,
                      border: '1px solid rgba(226,232,240,0.8)', background: 'white',
                      fontSize: 12, fontWeight: 500, color: '#64748b', cursor: 'pointer',
                    }}>
                      {item.action}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>通知设置</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>配置系统通知和告警规则</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {NOTIFICATION_DEFAULTS.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      borderRadius: 14, border: '1px solid rgba(226, 232, 240, 0.8)',
                      background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
                      padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotification(i)}
                      style={{
                        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                        background: notifications[i] ? '#0D9488' : '#e2e8f0',
                        padding: 2, transition: 'background 0.2s ease',
                        border: 'none', position: 'relative',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 10, background: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        transform: notifications[i] ? 'translateX(20px)' : 'translateX(0)',
                        transition: 'transform 0.2s ease',
                      }} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>安全与权限</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>管理平台安全策略和访问控制</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: Shield, title: '访问控制', desc: '管理用户角色和权限', detail: '3 个角色 / 12 个用户' },
                  { icon: Key, title: '审计日志', desc: '查看系统操作和安全事件', detail: '最近 30 天' },
                  { icon: Shield, title: '数据加密', desc: 'AES-256 静态加密 / TLS 1.3 传输加密', detail: '已启用' },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      borderRadius: 14, border: '1px solid rgba(226, 232, 240, 0.8)',
                      background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(16px)',
                      padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, background: '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <item.icon size={20} color={BLUE} strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.desc}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{item.detail}</span>
                      <ExternalLink size={14} color="#94a3b8" strokeWidth={2} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}
