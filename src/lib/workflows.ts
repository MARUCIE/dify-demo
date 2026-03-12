import type { LucideIcon } from 'lucide-react';
import {
  ShieldCheck, Radar, Mic, BarChart3, FileText,
  Presentation, BookOpen, Gavel,
} from 'lucide-react';

export interface WorkflowDef {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: LucideIcon;
  version: string;
  executionCount: number;
  category: string;
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  featured?: boolean;
  href?: string;
}

export const PLATFORM_WORKFLOWS: WorkflowDef[] = [
  {
    id: 'expense-audit',
    name: '报销审核流程',
    nameEn: 'Expense Audit Pipeline',
    description: '10步智能审核：OCR识别 -> 单据拆分 -> 接待类型判定 -> 合规校验 -> 审核建议',
    icon: ShieldCheck,
    version: '2.0.0',
    executionCount: 1247,
    category: '合规审核',
    tags: ['OCR', 'Dify', 'SSE'],
    status: 'active',
    featured: true,
    href: '/workflows/expense-audit',
  },
  {
    id: 'contract-review',
    name: '合同风险审核',
    nameEn: 'Contract Risk Review',
    description: '逐条扫描合同条款，识别风险点，生成修改建议和合规评分',
    icon: Radar,
    version: '1.3.0',
    executionCount: 856,
    category: '合规审核',
    tags: ['NLP', 'Risk', 'Legal'],
    status: 'active',
  },
  {
    id: 'meeting-summary',
    name: '会议纪要生成',
    nameEn: 'Meeting Summary Generator',
    description: '录音转写 -> 关键信息提取 -> 纪要格式化 -> 待办自动分配',
    icon: Mic,
    version: '1.1.0',
    executionCount: 2103,
    category: '内容生产',
    tags: ['ASR', 'Summary', 'Todo'],
    status: 'active',
  },
  {
    id: 'data-report',
    name: '数据报表流水线',
    nameEn: 'Data Report Pipeline',
    description: '数据清洗 -> 指标计算 -> 图表生成 -> PDF/Excel 导出',
    icon: BarChart3,
    version: '1.5.0',
    executionCount: 634,
    category: '数据分析',
    tags: ['ETL', 'Charts', 'Export'],
    status: 'active',
  },
  {
    id: 'document-compliance',
    name: '公文合规检查',
    nameEn: 'Document Compliance Check',
    description: '格式规范校验 -> 敏感词过滤 -> 引用准确性检查 -> 一键修复',
    icon: FileText,
    version: '1.0.2',
    executionCount: 412,
    category: '合规审核',
    tags: ['Format', 'Filter', 'Fix'],
    status: 'active',
  },
  {
    id: 'deck-builder',
    name: '演示文稿生成',
    nameEn: 'Deck Auto Builder',
    description: '叙事结构设计 -> 内容填充 -> 版式排版 -> 演讲备注生成',
    icon: Presentation,
    version: '0.9.0',
    executionCount: 189,
    category: '内容生产',
    tags: ['PPT', 'Layout', 'Script'],
    status: 'draft',
  },
  {
    id: 'research-pipeline',
    name: '调研分析流水线',
    nameEn: 'Research Analysis Pipeline',
    description: '多源数据采集 -> 信息整合 -> 竞品对比 -> 结构化报告输出',
    icon: BookOpen,
    version: '1.2.0',
    executionCount: 267,
    category: '调研洞察',
    tags: ['Crawl', 'Compare', 'Report'],
    status: 'active',
  },
  {
    id: 'bidding-workflow',
    name: '招投标文件生成',
    nameEn: 'Bidding Document Generator',
    description: '需求解析 -> 资质匹配 -> 标书框架生成 -> 合规自检',
    icon: Gavel,
    version: '0.5.0',
    executionCount: 0,
    category: '合规审核',
    tags: ['Tender', 'Check', 'Template'],
    status: 'draft',
  },
];

export interface TemplateDef {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: LucideIcon;
  type: 'agent' | 'workflow';
  category: string;
  stars: number;
  featured?: boolean;
  tags: string[];
}

export const PLATFORM_TEMPLATES: TemplateDef[] = [
  {
    id: 'tpl-expense',
    name: '报销审核模板',
    nameEn: 'Expense Audit Template',
    description: '完整的10步报销审核工作流，含OCR、分类、合规判定',
    icon: ShieldCheck,
    type: 'workflow',
    category: '合规审核',
    stars: 128,
    featured: true,
    tags: ['财务', '合规', 'OCR'],
  },
  {
    id: 'tpl-contract',
    name: '合同审核模板',
    nameEn: 'Contract Review Template',
    description: '风险条款识别 + 逐条标注 + 修改建议',
    icon: Radar,
    type: 'agent',
    category: '合规审核',
    stars: 96,
    featured: true,
    tags: ['法务', '风控', '合同'],
  },
  {
    id: 'tpl-meeting',
    name: '会议纪要模板',
    nameEn: 'Meeting Summary Template',
    description: '录音 -> 转写 -> 纪要 -> 待办分配一体化流程',
    icon: Mic,
    type: 'workflow',
    category: '内容生产',
    stars: 203,
    featured: true,
    tags: ['会议', '效率', '协作'],
  },
  {
    id: 'tpl-data-report',
    name: '数据报表模板',
    nameEn: 'Data Report Template',
    description: '从Excel/CSV到可视化报表的全自动处理流水线',
    icon: BarChart3,
    type: 'workflow',
    category: '数据分析',
    stars: 87,
    tags: ['数据', '图表', '导出'],
  },
  {
    id: 'tpl-document',
    name: '公文撰写模板',
    nameEn: 'Document Writer Template',
    description: '支持通知、请示、报告等多种公文格式的智能撰写',
    icon: FileText,
    type: 'agent',
    category: '内容生产',
    stars: 156,
    tags: ['公文', '行政', '模板'],
  },
  {
    id: 'tpl-research',
    name: '竞品分析模板',
    nameEn: 'Competitive Analysis Template',
    description: '多维竞品对比 + SWOT分析 + 策略建议报告',
    icon: BookOpen,
    type: 'agent',
    category: '调研洞察',
    stars: 74,
    tags: ['调研', '竞品', '策略'],
  },
  {
    id: 'tpl-deck',
    name: '演示文稿模板',
    nameEn: 'Deck Studio Template',
    description: '结构化叙事 + 品牌适配 + 自动排版',
    icon: Presentation,
    type: 'agent',
    category: '内容生产',
    stars: 63,
    tags: ['演示', '设计', '排版'],
  },
  {
    id: 'tpl-bidding',
    name: '投标文件模板',
    nameEn: 'Bidding Document Template',
    description: '标书框架 + 资质匹配 + 合规自检',
    icon: Gavel,
    type: 'workflow',
    category: '合规审核',
    stars: 41,
    tags: ['招标', '采购', '文件'],
  },
];
