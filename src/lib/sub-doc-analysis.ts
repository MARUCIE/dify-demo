import type { AuditIssue, AuditResult, SubDocument } from './types';
import { SUB_DOC_TYPES } from './types';

// Keyword mapping for issue -> sub-document association
export const SUB_DOC_KEYWORDS: Record<string, string[]> = {
  '费用报销单': ['费用报销单', '报销单'],
  '公务接待审批单': ['审批单', '接待审批', '事前审批'],
  '公务接待清单': ['接待清单'],
  '情况说明': ['情况说明'],
  '电子发票': ['发票', '电子发票'],
  '菜品清单': ['菜品清单', '菜品'],
};

export type SubDocVerdict = 'pass' | 'warning' | 'error' | 'missing';

export interface SubDocAnalysis {
  doc: SubDocument;
  verdict: SubDocVerdict;
  issues: AuditIssue[];
}

/**
 * Map issues to sub-documents by keyword matching and determine per-doc verdict.
 * Each issue is assigned to at most one sub-document (first match wins).
 */
export function analyzeSubDocuments(
  subDocuments: SubDocument[],
  allIssues: AuditIssue[],
): { analyses: SubDocAnalysis[]; unmatchedIssues: AuditIssue[] } {
  const claimed = new Set<number>();

  const analyses: SubDocAnalysis[] = subDocuments.map(doc => {
    const keywords = SUB_DOC_KEYWORDS[doc.type] ?? [doc.type];
    const docIssues: AuditIssue[] = [];

    allIssues.forEach((issue, idx) => {
      if (claimed.has(idx)) return;
      const text = `${issue.message} ${issue.detail ?? ''}`;
      if (keywords.some(kw => text.includes(kw))) {
        docIssues.push(issue);
        claimed.add(idx);
      }
    });

    if (!doc.found) {
      return { doc, verdict: 'missing' as SubDocVerdict, issues: docIssues };
    }

    const hasError = docIssues.some(i => i.severity === 'error');
    const hasWarning = docIssues.some(i => i.severity === 'warning');
    const verdict: SubDocVerdict = hasError ? 'error' : hasWarning ? 'warning' : 'pass';
    return { doc, verdict, issues: docIssues };
  });

  const unmatchedIssues = allIssues.filter((_, idx) => !claimed.has(idx));
  return { analyses, unmatchedIssues };
}

/** Quick per-file sub-doc verdict counts. */
export interface SubDocCounts {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  missing: number;
}

export function countSubDocVerdicts(
  subDocuments: SubDocument[],
  issues: AuditIssue[],
): SubDocCounts {
  const { analyses } = analyzeSubDocuments(subDocuments, issues);
  return {
    total: analyses.length,
    pass: analyses.filter(a => a.verdict === 'pass').length,
    warn: analyses.filter(a => a.verdict === 'warning').length,
    fail: analyses.filter(a => a.verdict === 'error').length,
    missing: analyses.filter(a => a.verdict === 'missing').length,
  };
}

// ---------------------------------------------------------------------------
// Derive subDocuments from issues when Dify API does not return them
// ---------------------------------------------------------------------------

const MISSING_PATTERNS = /缺失|缺少|未找到|未附|未提供|没有/;

/**
 * Reverse-engineer subDocuments from issue text by keyword matching.
 * When the Dify workflow does not return an explicit subDocuments array,
 * we scan all issues to determine which standard sub-document types
 * are referenced and whether they are present or missing.
 */
export function deriveSubDocumentsFromIssues(issues: AuditIssue[]): SubDocument[] {
  const mentioned = new Set<string>();
  const missing = new Set<string>();

  for (const issue of issues) {
    const text = `${issue.message} ${issue.detail ?? ''}`;
    for (const [docType, keywords] of Object.entries(SUB_DOC_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        mentioned.add(docType);
        if (MISSING_PATTERNS.test(text)) {
          missing.add(docType);
        }
      }
    }
  }

  return SUB_DOC_TYPES.map(type => ({
    type,
    // If mentioned but flagged as missing -> not found
    // If mentioned without missing flag -> found (issue is about content, not absence)
    // If not mentioned at all -> assume found (conservative: no news = good news)
    found: !missing.has(type),
    derived: true,
  }));
}

// ---------------------------------------------------------------------------
// AI summary generation (client-side template-based)
// ---------------------------------------------------------------------------

/** Generate a per-file AI summary from structured audit result. */
export function generatePerFileSummary(result: AuditResult): string {
  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');
  // Only count actual violations (error + warning), not info/passing items
  const violationCount = errors.length + warnings.length;

  if (violationCount === 0) {
    return `该报销包审核通过，未发现合规问题。接待类型: ${result.receptionType}。`;
  }

  const parts: string[] = [];

  // Severity overview (only violations)
  const counts: string[] = [];
  if (errors.length > 0) counts.push(`${errors.length}个严重问题`);
  if (warnings.length > 0) counts.push(`${warnings.length}个警告`);
  parts.push(`该报销包存在${counts.join('、')}。`);

  // Most critical issue highlight
  if (errors.length > 0) {
    parts.push(`最关键的问题: ${errors[0].message}。`);
  }

  // Sub-document completeness
  if (result.subDocuments && result.subDocuments.length > 0) {
    const found = result.subDocuments.filter(d => d.found).length;
    const total = result.subDocuments.length;
    const missingDocs = result.subDocuments.filter(d => !d.found).map(d => d.type);
    if (missingDocs.length > 0) {
      parts.push(`单据完整度 ${found}/${total}，缺少${missingDocs.join('、')}。`);
    } else {
      parts.push(`单据完整度 ${found}/${total}，材料齐全。`);
    }
  }

  // Suggestion
  if (result.suggestion === '不通过') {
    parts.push('建议退回补充材料后重新提交。');
  } else if (result.suggestion === '人工复核') {
    parts.push('建议人工复核上述问题后决定是否通过。');
  }

  return parts.join('');
}

/** Generate a batch-level analysis summary across all files. */
export function generateBatchAnalysis(
  files: { name: string; result: AuditResult | null }[],
): string {
  const completed = files.filter(f => f.result);
  if (completed.length === 0) return '';

  const allIssues = completed.flatMap(f => f.result!.issues);
  const allErrors = allIssues.filter(i => i.severity === 'error');
  const allWarnings = allIssues.filter(i => i.severity === 'warning');
  const problemFiles = completed.filter(f =>
    f.result!.suggestion === '不通过' || f.result!.suggestion === '人工复核',
  );

  const parts: string[] = [];

  // Overall stats
  parts.push(
    `本批次 ${completed.length} 个文件共发现 ${allIssues.length} 个问题` +
    (allErrors.length > 0 ? `（其中 ${allErrors.length} 个严重问题）` : '') +
    '。',
  );

  // Common patterns: group issues by keyword
  const patterns: Record<string, number> = {};
  for (const issue of allIssues) {
    const text = issue.message;
    if (/超[期标]|过期/.test(text)) patterns['报销超期'] = (patterns['报销超期'] ?? 0) + 1;
    if (/缺失|缺少|未附/.test(text)) patterns['单据缺失'] = (patterns['单据缺失'] ?? 0) + 1;
    if (/金额.*不符|金额.*不一致/.test(text)) patterns['金额不符'] = (patterns['金额不符'] ?? 0) + 1;
    if (/未填写|信息不完整/.test(text)) patterns['信息不完整'] = (patterns['信息不完整'] ?? 0) + 1;
  }
  const topPatterns = Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (topPatterns.length > 0) {
    parts.push(
      '主要风险点: ' +
      topPatterns.map(([k, v]) => `${k}(${v}处)`).join('、') +
      '。',
    );
  }

  // Priority files
  if (problemFiles.length > 0) {
    const priority = problemFiles
      .sort((a, b) => {
        const ae = a.result!.issues.filter(i => i.severity === 'error').length;
        const be = b.result!.issues.filter(i => i.severity === 'error').length;
        return be - ae;
      })
      .slice(0, 3)
      .map(f => f.name);
    parts.push(`建议优先处理: ${priority.join('、')}。`);
  }

  return parts.join('');
}
