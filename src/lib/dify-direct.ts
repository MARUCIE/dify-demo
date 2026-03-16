/**
 * Client-side direct Dify API integration.
 * Bypasses Vercel serverless to avoid payload limits and US→China network issues.
 * The Dify API at agentdemo.hegui.cn returns Access-Control-Allow-Origin: *
 */

import type { AuditResult, AuditIssue, AuditSuggestion, SubDocument } from './types';
import { deriveSubDocumentsFromIssues, generatePerFileSummary } from './sub-doc-analysis';

const DIFY_API_URL = process.env.NEXT_PUBLIC_DIFY_API_URL || '';
const DIFY_API_KEY = process.env.NEXT_PUBLIC_DIFY_API_KEY || '';
const FILE_INPUT_VAR = process.env.NEXT_PUBLIC_DIFY_FILE_INPUT_VAR || 'pdf_file';
const DATE_INPUT_VAR = process.env.NEXT_PUBLIC_DIFY_DATE_INPUT_VAR || 'today';

// Dify node types to skip (internal/system nodes)
const SKIP_NODE_TYPES = new Set([
  'start', 'end', 'if-else', 'variable-aggregator', 'variable-assigner', 'answer',
  'iteration', 'loop',
]);

// Fuzzy match Dify node title to our 10-step workflow
const STEP_KEYWORDS: [number, string[]][] = [
  [1, ['资料输入', '报销资料', 'Document Input']],
  [2, ['过期', '日期判定', 'Expiry']],
  [3, ['拆分', 'Split']],
  [4, ['识别', 'Recognition', 'OCR']],
  [5, ['提取接待', 'Extract Reception', '接待类型信息']],
  [6, ['判断接待', 'Determine Type', '判断类型', '接待类型判断']],
  [7, ['单据审核', 'Reception Audit', '接待审核', '审核内容汇总', '接待审核内容']],
  [8, ['要点提炼', '审核要点', 'Summary', '审核汇总']],
  [9, ['编排', 'Arrangement', '结果编排']],
  [10, ['结果输出', 'Result Output', '审核结果输出']],
];

function matchStepByTitle(title: string): number | null {
  for (const [stepId, keywords] of STEP_KEYWORDS) {
    if (keywords.some(kw => title.includes(kw))) return stepId;
  }
  return null;
}

export function isDifyDirectAvailable(): boolean {
  return !!(DIFY_API_URL && DIFY_API_KEY);
}

export interface DifySSEEvent {
  event: string;
  data: Record<string, unknown>;
}

/**
 * Upload file to Dify and run workflow with SSE streaming — all from the browser.
 * Yields step_start/step_done/result/error/done events.
 */
export async function* difyDirectStream(
  file: File,
  auditDate: string,
): AsyncGenerator<DifySSEEvent> {
  // Step 1: Upload file to Dify
  yield { event: 'step_start', data: { stepId: 1, title: '报销资料输入' } };

  const uploadForm = new FormData();
  uploadForm.append('file', file, file.name);
  uploadForm.append('user', 'demo-user');

  const uploadRes = await fetch(`${DIFY_API_URL}/v1/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DIFY_API_KEY}` },
    body: uploadForm,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    yield { event: 'error', data: { message: `File upload failed (${uploadRes.status}): ${text}` } };
    yield { event: 'done', data: {} };
    return;
  }

  const uploadData = await uploadRes.json();
  const uploadFileId = uploadData.id;
  yield { event: 'step_done', data: { stepId: 1, title: '报销资料输入' } };

  // Step 2: Run workflow with streaming
  const workflowRes = await fetch(`${DIFY_API_URL}/v1/workflows/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        [FILE_INPUT_VAR]: {
          type: 'document',
          transfer_method: 'local_file',
          upload_file_id: uploadFileId,
        },
        [DATE_INPUT_VAR]: auditDate,
      },
      response_mode: 'streaming',
      user: 'demo-user',
    }),
  });

  if (!workflowRes.ok) {
    const text = await workflowRes.text();
    yield { event: 'error', data: { message: `Workflow failed (${workflowRes.status}): ${text}` } };
    yield { event: 'done', data: {} };
    return;
  }

  if (!workflowRes.body) {
    yield { event: 'error', data: { message: 'No response stream from Dify' } };
    yield { event: 'done', data: {} };
    return;
  }

  // Parse SSE stream
  const reader = workflowRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastAssignedStep = 1;
  const startedSteps = new Set<number>([1]);
  const completedSteps = new Set<number>([1]);
  let workflowOutputs: Record<string, unknown> | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      try {
        const payload = JSON.parse(line.slice(6));
        const event = payload.event;
        const isInsideIteration = !!payload.data?.iteration_id;

        if (event === 'node_started') {
          const nodeType = payload.data?.node_type || '';
          if (SKIP_NODE_TYPES.has(nodeType) || isInsideIteration) continue;

          const title = payload.data?.title || '';
          let stepId = matchStepByTitle(title);
          if (!stepId) stepId = Math.min(lastAssignedStep + 1, 10);

          if (!startedSteps.has(stepId)) {
            startedSteps.add(stepId);
            lastAssignedStep = stepId;
            yield { event: 'step_start', data: { stepId, title } };
          }
        }

        if (event === 'node_finished') {
          const nodeType = payload.data?.node_type || '';
          if (SKIP_NODE_TYPES.has(nodeType) || isInsideIteration) continue;

          const title = payload.data?.title || '';
          let stepId = matchStepByTitle(title);
          if (!stepId) {
            for (const s of startedSteps) {
              if (!completedSteps.has(s)) { stepId = s; break; }
            }
            stepId = stepId || Math.min(lastAssignedStep, 10);
          }

          if (!completedSteps.has(stepId)) {
            completedSteps.add(stepId);
            yield { event: 'step_done', data: { stepId, title } };
          }
        }

        if (event === 'iteration_started') {
          if (!startedSteps.has(4)) {
            startedSteps.add(4);
            lastAssignedStep = 4;
            yield { event: 'step_start', data: { stepId: 4, title: '报销单据识别' } };
          }
        }

        if (event === 'iteration_completed' || event === 'iteration_finished') {
          if (!completedSteps.has(4)) {
            completedSteps.add(4);
            yield { event: 'step_done', data: { stepId: 4, title: '报销单据识别' } };
          }
        }

        if (event === 'workflow_finished') {
          workflowOutputs = payload.data?.outputs || {};
        }

        if (event === 'error' || event === 'workflow_failed') {
          yield { event: 'error', data: { message: payload.message || payload.data?.error || 'Workflow error' } };
          return;
        }
      } catch {
        // Skip malformed SSE lines
      }
    }
  }

  // Fast-complete remaining steps
  for (let i = 1; i <= 10; i++) {
    if (!startedSteps.has(i)) {
      yield { event: 'step_start', data: { stepId: i } };
    }
    if (!completedSteps.has(i)) {
      yield { event: 'step_done', data: { stepId: i } };
    }
  }

  // Emit final result
  if (workflowOutputs) {
    const result = parseDifyOutput(workflowOutputs);
    yield { event: 'result', data: result as unknown as Record<string, unknown> };
  }

  yield { event: 'done', data: {} };
}

// -- Output parsing (duplicated from dify-client.ts to avoid Node.js imports) --

function enrichResult(result: AuditResult): AuditResult {
  if ((!result.subDocuments || result.subDocuments.length === 0) && result.issues.length > 0) {
    result.subDocuments = deriveSubDocumentsFromIssues(result.issues);
  }
  if (!result.aiSummary) {
    result.aiSummary = generatePerFileSummary(result);
  }
  return result;
}

function parseDifyOutput(outputs: Record<string, unknown>): AuditResult {
  const raw = outputs.text ?? outputs.result ?? outputs.output ?? outputs.answer ?? '';

  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (obj.suggestion || obj.receptionType || obj.issues) {
      return enrichResult({
        receptionType: String(obj.receptionType || obj.reception_type || '公务接待'),
        suggestion: normalizeSuggestion(obj.suggestion),
        issues: normalizeIssues(obj.issues),
        subDocuments: normalizeSubDocuments(obj.subDocuments || obj.sub_documents || obj.documents),
        amount: typeof obj.amount === 'number' ? obj.amount : undefined,
        pageCount: typeof obj.pageCount === 'number' ? obj.pageCount : undefined,
        aiSummary: typeof obj.aiSummary === 'string' ? obj.aiSummary :
                   typeof obj.summary === 'string' ? obj.summary :
                   typeof obj.ai_summary === 'string' ? obj.ai_summary : undefined,
        totalDuration: 0,
      });
    }
  }

  const text = String(raw);
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      return enrichResult({
        receptionType: String(parsed.receptionType || parsed.reception_type || '公务接待'),
        suggestion: normalizeSuggestion(parsed.suggestion || parsed.result),
        issues: normalizeIssues(parsed.issues || parsed.problems || []),
        subDocuments: normalizeSubDocuments(parsed.subDocuments || parsed.sub_documents || parsed.documents),
        amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
        pageCount: typeof parsed.pageCount === 'number' ? parsed.pageCount : undefined,
        aiSummary: typeof parsed.aiSummary === 'string' ? parsed.aiSummary :
                   typeof parsed.summary === 'string' ? parsed.summary :
                   typeof parsed.ai_summary === 'string' ? parsed.ai_summary : undefined,
        totalDuration: 0,
      });
    }
  } catch {
    // Not JSON
  }

  return enrichResult({
    receptionType: text.includes('商务接待') ? '商务接待' : '公务接待',
    suggestion: extractSuggestion(text),
    issues: extractIssuesFromText(text),
    totalDuration: 0,
  });
}

function normalizeSuggestion(s: unknown): AuditSuggestion {
  const str = String(s || '');
  if (str.includes('不通过') || str.includes('reject')) return '不通过';
  if (str === '通过' || str === 'pass' || str === 'approved') return '通过';
  if (str.includes('通过') && !str.includes('不') && !str.includes('复核')) return '通过';
  return '人工复核';
}

function normalizeSubDocuments(items: unknown): SubDocument[] | undefined {
  if (!Array.isArray(items)) return undefined;
  return items.map(item => {
    if (typeof item === 'string') return { type: item, found: true };
    const obj = item as Record<string, unknown>;
    return {
      type: String(obj.type || obj.name || ''),
      found: obj.found !== false && obj.found !== 'false',
      page: typeof obj.page === 'number' ? obj.page : undefined,
      pageCount: typeof obj.pageCount === 'number' ? obj.pageCount : undefined,
    };
  });
}

function normalizeIssues(items: unknown): AuditIssue[] {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    if (typeof item === 'string') return { severity: 'warning' as const, message: item };
    const obj = item as Record<string, unknown>;
    const sev = String(obj.severity || '');
    const severity: AuditIssue['severity'] =
      (['error', 'warning', 'info'].includes(sev) ? sev : 'warning') as AuditIssue['severity'];
    return {
      severity,
      message: String(obj.message || obj.msg || ''),
      detail: obj.detail ? String(obj.detail) : undefined,
    };
  });
}

function extractSuggestion(text: string): AuditSuggestion {
  if (text.includes('不通过') || text.includes('拒绝')) return '不通过';
  if (text.includes('人工复核') || text.includes('复核')) return '人工复核';
  if (text.includes('通过')) return '通过';
  return '人工复核';
}

function extractIssuesFromText(text: string): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const lines = text.split(/\n|。|；/).filter(l => l.trim().length > 5);
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.replace(/^[-*•\d.]+\s*/, '').trim();
    if (trimmed.length < 5 || trimmed.length > 300) continue;
    const severity: AuditIssue['severity'] =
      /缺失|不符|错误|超[期标]|违反/.test(trimmed) ? 'error' :
      /注意|建议|偏[低高]|接近/.test(trimmed) ? 'warning' : 'info';
    issues.push({ severity, message: trimmed });
  }
  return issues.length > 0 ? issues : [{ severity: 'info', message: text.slice(0, 200) }];
}
