'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Workflow, LayoutTemplate, Database,
  Clock, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';

// -- Menu definition (matching lingque WorkspaceShell) --

interface MenuItem {
  id: string;
  label: string;
  labelEn: string;
  icon: typeof Bot;
  href: string;
  disabled?: boolean;
}

const MENU: MenuItem[] = [
  { id: 'agents', label: '智能体', labelEn: 'Agents', icon: Bot, href: '/' },
  { id: 'workflows', label: '工作流', labelEn: 'Workflows', icon: Workflow, href: '/workflows' },
  { id: 'templates', label: '模板库', labelEn: 'Templates', icon: LayoutTemplate, href: '/templates' },
  { id: 'knowledge', label: '知识库', labelEn: 'Knowledge', icon: Database, href: '/knowledge' },
  { id: 'history', label: '历史记录', labelEn: 'History', icon: Clock, href: '/history' },
  { id: 'settings', label: '设置', labelEn: 'Settings', icon: Settings, href: '/settings' },
];

// -- Constants --

const WIDTH_COLLAPSED = 64;
const WIDTH_EXPANDED = 256;

const textFade = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
};

// -- Helpers --

function matchRoute(item: MenuItem, pathname: string): boolean {
  if (item.href === '/' && pathname === '/') return true;
  if (item.id === 'agents' && pathname.startsWith('/audit')) return true;
  if (item.id === 'workflows' && pathname.startsWith('/workflows')) return true;
  if (item.id === 'templates' && pathname.startsWith('/templates')) return true;
  if (item.id === 'knowledge' && pathname.startsWith('/knowledge')) return true;
  if (item.id === 'history' && pathname.startsWith('/history')) return true;
  if (item.id === 'settings' && pathname.startsWith('/settings')) return true;
  if (item.href !== '/' && item.href !== '#' && pathname.startsWith(item.href)) return true;
  return false;
}

// -- Component --

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: expanded ? WIDTH_EXPANDED : WIDTH_COLLAPSED }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'var(--glass-bg)',
        /* backdrop-filter removed — GPU cost too high for sidebar-sized elements */
        borderRight: '1px solid var(--glass-border)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: expanded ? '20px 16px' : '20px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: expanded ? 'flex-start' : 'center',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0D9488, #0F766E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bot size={20} color="white" strokeWidth={2} />
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              key="logo-text"
              variants={textFade}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.15 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                灵阙
              </div>
              <div style={{ fontSize: 10, color: '#64748B', lineHeight: 1.2 }}>
                Enterprise
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Menu items */}
      <nav style={{ flex: 1, padding: expanded ? '8px 12px' : '8px 8px' }}>
        {MENU.map((item) => {
          const active = matchRoute(item, pathname);
          const Icon = item.icon;

          const inner = (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: expanded ? '10px 12px' : '10px 0',
                borderRadius: 12,
                marginBottom: 4,
                position: 'relative',
                cursor: item.disabled ? 'default' : 'pointer',
                opacity: item.disabled ? 0.4 : 1,
                pointerEvents: item.disabled ? 'none' : 'auto',
                background: active ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                color: active ? '#0B7A72' : '#64748b',
                justifyContent: expanded ? 'flex-start' : 'center',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!active && !item.disabled) {
                  (e.currentTarget as HTMLDivElement).style.background = 'rgba(241, 245, 249, 0.8)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active && !item.disabled) {
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                }
              }}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  style={{
                    position: 'absolute',
                    left: expanded ? -12 : -8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 20,
                    borderRadius: 2,
                    background: 'linear-gradient(to bottom, #0D9488, rgba(13,148,136,0.6))',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <Icon size={20} strokeWidth={2} style={{ flexShrink: 0 }} />

              <AnimatePresence>
                {expanded && (
                  <motion.span
                    key={`label-${item.id}`}
                    variants={textFade}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.15 }}
                    style={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          );

          if (item.disabled || item.href === '#') {
            return <div key={item.id}>{inner}</div>;
          }

          return (
            <Link key={item.id} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              {inner}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: collapse toggle */}
      <div style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)', padding: expanded ? '16px 12px' : '16px 8px' }}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: 'none',
            background: 'transparent',
            color: '#64748B',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            justifyContent: expanded ? 'flex-start' : 'center',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(241, 245, 249, 0.8)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          {expanded ? <ChevronLeft size={20} strokeWidth={2} style={{ flexShrink: 0 }} /> : <ChevronRight size={20} strokeWidth={2} style={{ flexShrink: 0 }} />}
          <AnimatePresence>
            {expanded && (
              <motion.span key="collapse-text" variants={textFade} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.15 }} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                收起菜单
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
