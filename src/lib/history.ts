export interface ConversationRecord {
  id: string;
  title: string;
  agentName: string;
  agentId: string;
  status: 'completed' | 'active' | 'error';
  messageCount: number;
  totalTokens: number;
  lastMessageAt: string;
  duration: string;
}

export interface AuditTraceStep {
  name: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  durationMs: number;
  detail?: string;
}

export interface AuditTrace {
  id: string;
  workflowName: string;
  workflowId: string;
  status: 'success' | 'warning' | 'error';
  spanCount: number;
  durationMs: number;
  triggeredAt: string;
  triggeredBy: string;
  steps: AuditTraceStep[];
}

export const MOCK_CONVERSATIONS: ConversationRecord[] = [
  {
    id: 'conv-001',
    title: '3月报销单批量审核（第12批）',
    agentName: '报销审核',
    agentId: 'expense-audit',
    status: 'completed',
    messageCount: 24,
    totalTokens: 18500,
    lastMessageAt: '2026-03-12 10:30',
    duration: '2m 15s',
  },
  {
    id: 'conv-002',
    title: '供应商合同风险扫描',
    agentName: '合同雷达',
    agentId: 'contract-radar',
    status: 'completed',
    messageCount: 18,
    totalTokens: 32100,
    lastMessageAt: '2026-03-12 09:15',
    duration: '4m 30s',
  },
  {
    id: 'conv-003',
    title: '产品评审会议纪要生成',
    agentName: '会议助手',
    agentId: 'meeting-assistant',
    status: 'completed',
    messageCount: 12,
    totalTokens: 8900,
    lastMessageAt: '2026-03-11 16:45',
    duration: '1m 42s',
  },
  {
    id: 'conv-004',
    title: 'Q1数据分析报表',
    agentName: '数据分析',
    agentId: 'data-worker',
    status: 'completed',
    messageCount: 31,
    totalTokens: 45200,
    lastMessageAt: '2026-03-11 14:20',
    duration: '6m 10s',
  },
  {
    id: 'conv-005',
    title: '竞品功能对比分析',
    agentName: '研究分析',
    agentId: 'research-analyst',
    status: 'completed',
    messageCount: 22,
    totalTokens: 28700,
    lastMessageAt: '2026-03-10 11:30',
    duration: '3m 55s',
  },
  {
    id: 'conv-006',
    title: '年度公文格式检查',
    agentName: '公文撰写',
    agentId: 'document-writer',
    status: 'error',
    messageCount: 8,
    totalTokens: 5400,
    lastMessageAt: '2026-03-10 09:00',
    duration: '0m 58s',
  },
  {
    id: 'conv-007',
    title: '投标文件自动生成',
    agentName: '演示文稿',
    agentId: 'deck-studio',
    status: 'active',
    messageCount: 5,
    totalTokens: 12300,
    lastMessageAt: '2026-03-12 11:00',
    duration: '-',
  },
];

export const MOCK_AUDIT_TRACES: AuditTrace[] = [
  {
    id: 'trace-001',
    workflowName: '报销审核流程',
    workflowId: 'expense-audit',
    status: 'success',
    spanCount: 10,
    durationMs: 14200,
    triggeredAt: '2026-03-12 10:28',
    triggeredBy: '批量任务',
    steps: [
      { name: '报销资料输入', status: 'success', durationMs: 800 },
      { name: '报销过期日判定', status: 'success', durationMs: 1200 },
      { name: '报销单据拆分', status: 'success', durationMs: 2100 },
      { name: '报销单据识别', status: 'success', durationMs: 3400 },
      { name: '提取接待类型信息', status: 'success', durationMs: 1500 },
      { name: '判断接待类型', status: 'success', durationMs: 900 },
      { name: '公务接待单据审核', status: 'success', durationMs: 1800 },
      { name: '公务接待审核内容汇总', status: 'success', durationMs: 800 },
      { name: '审核结果编排', status: 'success', durationMs: 1200 },
      { name: '审核结果输出', status: 'success', durationMs: 500 },
    ],
  },
  {
    id: 'trace-002',
    workflowName: '合同风险审核',
    workflowId: 'contract-review',
    status: 'warning',
    spanCount: 8,
    durationMs: 22800,
    triggeredAt: '2026-03-12 09:10',
    triggeredBy: '手动触发',
    steps: [
      { name: '合同文件解析', status: 'success', durationMs: 2400 },
      { name: '条款结构化提取', status: 'success', durationMs: 4200 },
      { name: '风险条款识别', status: 'warning', durationMs: 6100, detail: '发现3处高风险条款' },
      { name: '合规性校验', status: 'success', durationMs: 3200 },
      { name: '修改建议生成', status: 'success', durationMs: 2800 },
      { name: '评分计算', status: 'success', durationMs: 900 },
      { name: '报告生成', status: 'success', durationMs: 2100 },
      { name: '结果输出', status: 'success', durationMs: 1100 },
    ],
  },
  {
    id: 'trace-003',
    workflowName: '会议纪要生成',
    workflowId: 'meeting-summary',
    status: 'success',
    spanCount: 6,
    durationMs: 8900,
    triggeredAt: '2026-03-11 16:40',
    triggeredBy: '定时任务',
    steps: [
      { name: '录音转写', status: 'success', durationMs: 3200 },
      { name: '关键信息提取', status: 'success', durationMs: 2100 },
      { name: '纪要格式化', status: 'success', durationMs: 1500 },
      { name: '待办提取', status: 'success', durationMs: 800 },
      { name: '分配确认', status: 'success', durationMs: 700 },
      { name: '输出生成', status: 'success', durationMs: 600 },
    ],
  },
  {
    id: 'trace-004',
    workflowName: '数据报表流水线',
    workflowId: 'data-report',
    status: 'error',
    spanCount: 4,
    durationMs: 5600,
    triggeredAt: '2026-03-11 14:15',
    triggeredBy: '手动触发',
    steps: [
      { name: '数据源连接', status: 'success', durationMs: 1200 },
      { name: '数据清洗', status: 'success', durationMs: 2400 },
      { name: '指标计算', status: 'error', durationMs: 1800, detail: '缺少Q1营收字段' },
      { name: '图表生成', status: 'skipped', durationMs: 0 },
    ],
  },
];
