import type { AuditResult } from './types';

// -- Realistic mock audit results based on SRBG reimbursement packages --
// Each PDF is a merged document containing multiple sub-documents (报销包)

export const MOCK_BATCH_RESULTS: AuditResult[] = [
  // Case 1: 人工复核 — Based on real KDBABXD2507090055.pdf
  // Complete documents but expired + missing fields
  {
    receptionType: '公务接待',
    suggestion: '人工复核',
    amount: 470,
    pageCount: 5,
    subDocuments: [
      { type: '费用报销单', found: true, page: 1, pageCount: 1 },
      { type: '公务接待审批单', found: true, page: 2, pageCount: 1 },
      { type: '公务接待清单', found: true, page: 3, pageCount: 1 },
      { type: '情况说明', found: true, page: 4, pageCount: 1 },
      { type: '电子发票', found: true, page: 5, pageCount: 1 },
      { type: '菜品清单', found: false },
    ],
    issues: [
      { severity: 'error', message: '费用报销单申请部门未填写', detail: '报销单"申请部门"栏仅填写"部门"，未填写具体部门名称' },
      { severity: 'error', message: '报销已超期（距今271天）', detail: '接待日期2025-06-11，申请日期2025-11-17，超过90天报销时限' },
      { severity: 'warning', message: '公务接待清单主要行程安排未填写', detail: '行程安排栏填写"/"，应详细说明公务活动内容' },
      { severity: 'warning', message: '菜品清单缺失', detail: '未附菜品消费明细清单，建议补充' },
      { severity: 'info', message: '金额交叉验证通过', detail: '报销单470元 = 接待清单470元 = 发票470元，三单一致' },
      { severity: 'info', message: '人数一致性通过', detail: '审批单6人(宾5+陪1) = 接待清单6人(宾5+陪1)' },
    ],
    totalDuration: 0,
  },

  // Case 2: 通过 — All documents complete, amounts match, within deadline
  {
    receptionType: '公务接待',
    suggestion: '通过',
    amount: 680,
    pageCount: 7,
    subDocuments: [
      { type: '费用报销单', found: true, page: 1, pageCount: 1 },
      { type: '公务接待审批单', found: true, page: 2, pageCount: 1 },
      { type: '公务接待清单', found: true, page: 3, pageCount: 1 },
      { type: '情况说明', found: true, page: 4, pageCount: 1 },
      { type: '电子发票', found: true, page: 5, pageCount: 2 },
      { type: '菜品清单', found: true, page: 7, pageCount: 1 },
    ],
    issues: [
      { severity: 'info', message: '金额交叉验证通过', detail: '报销单680元 = 接待清单680元 = 发票680元' },
      { severity: 'info', message: '人均消费85元，低于公务接待人均120元标准' },
    ],
    totalDuration: 0,
  },

  // Case 3: 人工复核 — Missing 菜品清单, handwriting recognition issues
  {
    receptionType: '商务接待',
    suggestion: '人工复核',
    amount: 1260,
    pageCount: 6,
    subDocuments: [
      { type: '费用报销单', found: true, page: 1, pageCount: 1 },
      { type: '公务接待审批单', found: true, page: 2, pageCount: 1 },
      { type: '公务接待清单', found: true, page: 3, pageCount: 1 },
      { type: '情况说明', found: true, page: 4, pageCount: 1 },
      { type: '电子发票', found: true, page: 5, pageCount: 2 },
      { type: '菜品清单', found: false },
    ],
    issues: [
      { severity: 'warning', message: '手写字迹模糊（OCR置信度62%）', detail: '接待清单手写部分识别置信度偏低，接待对象姓名可能有误' },
      { severity: 'warning', message: '陪餐人员信息不完整', detail: '接待清单仅列出2名陪餐人员，但发票金额暗示10人以上用餐' },
      { severity: 'warning', message: '人均消费126元，接近公务接待人均150元上限', detail: '1260元 / 10人 = 126元/人' },
      { severity: 'warning', message: '菜品清单缺失', detail: '超过1000元的接待费用建议附菜品明细' },
      { severity: 'info', message: '金额交叉验证通过', detail: '报销单1260元 = 发票合计1260元' },
    ],
    totalDuration: 0,
  },

  // Case 4: 不通过 — Missing critical documents, amount mismatch
  {
    receptionType: '公务接待',
    suggestion: '不通过',
    amount: 750,
    pageCount: 3,
    subDocuments: [
      { type: '费用报销单', found: true, page: 1, pageCount: 1 },
      { type: '公务接待审批单', found: false },
      { type: '公务接待清单', found: false },
      { type: '情况说明', found: false },
      { type: '电子发票', found: true, page: 2, pageCount: 2 },
      { type: '菜品清单', found: false },
    ],
    issues: [
      { severity: 'error', message: '公务接待审批单缺失', detail: '无事前审批记录，违反"先审批后接待"原则（中央八项规定）' },
      { severity: 'error', message: '公务接待清单缺失', detail: '无法核实接待对象、人数、就餐地点等关键信息' },
      { severity: 'error', message: '情况说明缺失', detail: '缺少公务活动情况说明材料' },
      { severity: 'error', message: '发票金额与报销金额不符', detail: '发票合计680元，报销单填写750元，差额70元' },
      { severity: 'warning', message: '仅有报销单和发票，单据不完整', detail: '公务接待报销至少需要审批单、接待清单、发票三件' },
    ],
    totalDuration: 0,
  },

  // Case 5: 人工复核 — Budget discrepancy, guest list incomplete
  {
    receptionType: '公务接待',
    suggestion: '人工复核',
    amount: 520,
    pageCount: 6,
    subDocuments: [
      { type: '费用报销单', found: true, page: 1, pageCount: 1 },
      { type: '公务接待审批单', found: true, page: 2, pageCount: 1 },
      { type: '公务接待清单', found: true, page: 3, pageCount: 1 },
      { type: '情况说明', found: true, page: 4, pageCount: 1 },
      { type: '电子发票', found: true, page: 5, pageCount: 1 },
      { type: '菜品清单', found: true, page: 6, pageCount: 1 },
    ],
    issues: [
      { severity: 'error', message: '报销日期超过有效期限', detail: '接待日期距今超过90天报销时限，需补充超期说明' },
      { severity: 'warning', message: '经费预算与实际支出偏差大', detail: '审批预算150×8=1200元，实际支出520元，偏差率56.7%' },
      { severity: 'warning', message: '接待清单来宾职务栏空白', detail: '5名来宾中3人未填写职务信息' },
      { severity: 'info', message: '金额交叉验证通过', detail: '报销单520元 = 接待清单520元 = 发票520元' },
      { severity: 'info', message: '人均消费65元，低于标准' },
    ],
    totalDuration: 0,
  },
];

// -- Per-step simulated delays (ms) --

export const MOCK_STEP_DELAYS = [
  800, 1200, 2000, 2500, 1000, 800, 3000, 1500, 1000, 500,
];
