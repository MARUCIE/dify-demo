import type { AuditResult } from './types';

// -- Mock audit results for batch demo --

export const MOCK_BATCH_RESULTS: AuditResult[] = [
  {
    receptionType: '公务接待',
    suggestion: '人工复核',
    issues: [
      { severity: 'error', message: '费用报销单申请部门未填写', detail: '报销单"申请部门"栏为空，应填写具体部门名称' },
      { severity: 'error', message: '公务接待清单接待类型未填写', detail: '接待类型栏为空，应标明公务接待/商务接待等类型' },
      { severity: 'warning', message: '公务接待清单主要行程安排未填写', detail: '行程安排栏空白，建议补充详细的公务活动日程' },
      { severity: 'error', message: '报销已超期（距今271天）', detail: '当前日期(2026-03-09) - 接待/发票日期(2025-06-11)，超过报销时限' },
    ],
    totalDuration: 0,
  },
  {
    receptionType: '公务接待',
    suggestion: '通过',
    issues: [],
    totalDuration: 0,
  },
  {
    receptionType: '商务接待',
    suggestion: '人工复核',
    issues: [
      { severity: 'warning', message: '陪餐人员信息不完整', detail: '接待清单仅列出2人，但发票金额暗示4人以上用餐' },
      { severity: 'info', message: '餐标接近上限', detail: '人均消费118元，接近公务接待人均120元上限' },
    ],
    totalDuration: 0,
  },
  {
    receptionType: '公务接待',
    suggestion: '不通过',
    issues: [
      { severity: 'error', message: '菜品清单缺失', detail: '未附菜品消费明细，不符合公务接待报销规定第7条' },
      { severity: 'error', message: '发票金额与报销金额不符', detail: '发票合计680元，报销单填写750元，差额70元' },
      { severity: 'error', message: '接待审批单缺失', detail: '无事前审批记录，违反"先审批后接待"原则' },
    ],
    totalDuration: 0,
  },
  {
    receptionType: '公务接待',
    suggestion: '人工复核',
    issues: [
      { severity: 'warning', message: '手写字迹模糊（置信度62%）', detail: '接待清单手写部分OCR识别置信度偏低，建议人工核对' },
      { severity: 'error', message: '报销日期超过有效期限', detail: '报销单据日期距今超过90天有效期' },
    ],
    totalDuration: 0,
  },
];

// -- Per-step simulated delays (ms) --

export const MOCK_STEP_DELAYS = [
  800, 1200, 2000, 2500, 1000, 800, 3000, 1500, 1000, 500,
];
