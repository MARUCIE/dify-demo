import {
  ShieldCheck, Mic, Presentation, FileText,
  Radar, BarChart3, BookOpen, Gavel,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AgentDef {
  id: string;
  name: string;
  nameEn: string;
  icon: LucideIcon;
  tier: 'S' | 'A' | 'B';
  description: string;
  status: 'active' | 'coming-soon';
  featured?: boolean;
  href?: string;
}

export const PLATFORM_AGENTS: AgentDef[] = [
  {
    id: 'expense-audit',
    name: '报销审核',
    nameEn: 'Expense Audit',
    icon: ShieldCheck,
    tier: 'S',
    description: '10步智能审核流程，支持OCR识别、单据拆分、接待类型判定',
    status: 'active',
    featured: true,
    href: '/audit',
  },
  {
    id: 'meeting',
    name: '会议助手',
    nameEn: 'Meeting Assistant',
    icon: Mic,
    tier: 'S',
    description: '录音转写、智能纪要生成、待办自动提取',
    status: 'active',
  },
  {
    id: 'deck',
    name: '演示文稿',
    nameEn: 'Deck Studio',
    icon: Presentation,
    tier: 'S',
    description: '结构化叙事、智能版式生成、演讲备注',
    status: 'active',
  },
  {
    id: 'document',
    name: '公文撰写',
    nameEn: 'Document Writer',
    icon: FileText,
    tier: 'S',
    description: '多模板支持、格式规范检查、一键导出',
    status: 'active',
  },
  {
    id: 'contract',
    name: '合同雷达',
    nameEn: 'Contract Radar',
    icon: Radar,
    tier: 'A',
    description: '风险条款识别、逐条审核、修改建议生成',
    status: 'active',
  },
  {
    id: 'data',
    name: '数据分析',
    nameEn: 'Data Worker',
    icon: BarChart3,
    tier: 'A',
    description: '报表智能处理、数据清洗、洞察自动生成',
    status: 'active',
  },
  {
    id: 'research',
    name: '研究分析',
    nameEn: 'Research Analyst',
    icon: BookOpen,
    tier: 'A',
    description: '深度调研、竞品分析、结构化报告',
    status: 'active',
  },
  {
    id: 'bidding',
    name: '招投标',
    nameEn: 'Bidding Expert',
    icon: Gavel,
    tier: 'A',
    description: '标书生成、合规检查、评分预测',
    status: 'coming-soon',
  },
];
