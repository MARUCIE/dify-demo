import {
  FileUp,
  Calendar,
  Scissors,
  ScanLine,
  Search,
  GitBranch,
  Shield,
  ClipboardList,
  LayoutGrid,
  FileCheck,
} from 'lucide-react';
import type { WorkflowStepDef } from './types';

export const WORKFLOW_STEPS: WorkflowStepDef[] = [
  { id: 1, name: '报销资料输入', nameEn: 'Document Input', icon: FileUp, description: '接收并验证上传的报销文件', estimatedDuration: 800 },
  { id: 2, name: '报销过期日判定', nameEn: 'Expiry Check', icon: Calendar, description: '检查报销单据是否在有效期内', estimatedDuration: 1200 },
  { id: 3, name: '报销单据拆分', nameEn: 'Receipt Splitting', icon: Scissors, description: '将PDF拆分为独立单据', estimatedDuration: 2000 },
  { id: 4, name: '报销单据识别', nameEn: 'Receipt Recognition', icon: ScanLine, description: 'OCR识别单据内容和关键字段', estimatedDuration: 2500 },
  { id: 5, name: '提取接待类型信息', nameEn: 'Extract Reception Info', icon: Search, description: '提取接待类型相关信息', estimatedDuration: 1000 },
  { id: 6, name: '判断接待类型', nameEn: 'Determine Type', icon: GitBranch, description: '判定接待类型：公务/商务/其他', estimatedDuration: 800 },
  { id: 7, name: '公务接待单据审核', nameEn: 'Reception Audit', icon: Shield, description: '按公务接待标准逐项审核', estimatedDuration: 3000 },
  { id: 8, name: '公务接待审核内容汇总', nameEn: 'Audit Summary', icon: ClipboardList, description: '汇总所有审核发现', estimatedDuration: 1500 },
  { id: 9, name: '审核结果编排', nameEn: 'Result Arrangement', icon: LayoutGrid, description: '编排结构化审核报告', estimatedDuration: 1000 },
  { id: 10, name: '审核结果输出', nameEn: 'Result Output', icon: FileCheck, description: '输出最终审核结论和建议', estimatedDuration: 500 },
];

export const APP_NAME = '路桥报销审核智能体';
export const APP_VERSION = 'v2.0';
export const TOTAL_STEPS = WORKFLOW_STEPS.length;

// Shared badge config for audit suggestions
export const SUGGESTION_BADGE = {
  '通过': { cls: 'badge-green', label: '通过' },
  '人工复核': { cls: 'badge-amber', label: '人工复核' },
  '不通过': { cls: 'badge-red', label: '不通过' },
} as const;
