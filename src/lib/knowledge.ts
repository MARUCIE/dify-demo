import type { LucideIcon } from 'lucide-react';
import { FileText, BookOpen, Scale, Building2, Shield } from 'lucide-react';

export interface KnowledgeBase {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: LucideIcon;
  documentCount: number;
  totalChunks: number;
  embeddingModel: string;
  status: 'active' | 'indexing' | 'error';
  updatedAt: string;
  category: string;
}

export const PLATFORM_KNOWLEDGE_BASES: KnowledgeBase[] = [
  {
    id: 'kb-expense-policy',
    name: '报销政策库',
    nameEn: 'Expense Policy KB',
    description: '企业报销管理制度、费用标准、审批流程等政策文件',
    icon: FileText,
    documentCount: 23,
    totalChunks: 1847,
    embeddingModel: 'text-embedding-3-small',
    status: 'active',
    updatedAt: '2026-03-10',
    category: '合规审核',
  },
  {
    id: 'kb-contract-templates',
    name: '合同模板库',
    nameEn: 'Contract Templates KB',
    description: '标准合同模板、条款库、风险条款清单',
    icon: Scale,
    documentCount: 56,
    totalChunks: 4230,
    embeddingModel: 'text-embedding-3-small',
    status: 'active',
    updatedAt: '2026-03-08',
    category: '合规审核',
  },
  {
    id: 'kb-financial-regs',
    name: '财务制度库',
    nameEn: 'Financial Regulations KB',
    description: '会计准则、税务法规、内控制度文件',
    icon: Building2,
    documentCount: 41,
    totalChunks: 3156,
    embeddingModel: 'bge-large-zh-v1.5',
    status: 'active',
    updatedAt: '2026-03-05',
    category: '数据分析',
  },
  {
    id: 'kb-official-docs',
    name: '公文规范库',
    nameEn: 'Official Document Standards KB',
    description: '公文格式标准、行文规范、用语指南',
    icon: BookOpen,
    documentCount: 18,
    totalChunks: 982,
    embeddingModel: 'bge-large-zh-v1.5',
    status: 'active',
    updatedAt: '2026-03-01',
    category: '内容生产',
  },
  {
    id: 'kb-compliance',
    name: '法律法规库',
    nameEn: 'Laws & Regulations KB',
    description: '劳动法、合同法、数据安全法等常用法规全文',
    icon: Shield,
    documentCount: 34,
    totalChunks: 8921,
    embeddingModel: 'text-embedding-3-large',
    status: 'indexing',
    updatedAt: '2026-03-11',
    category: '合规审核',
  },
];
