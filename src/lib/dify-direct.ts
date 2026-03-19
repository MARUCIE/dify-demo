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

// Strip HTML tags (e.g. <font color="red">...</font>) to plain text
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

// Parse the "res" string format from Guo's Dify workflow:
//   <think>...thinking process...</think>
//   招待类型：公务接待
//   审核建议：人工复核
//   问题列表：
//   <font color="red">1. issue text</font>
//   <font color="red">2. issue text</font>
interface ParsedResString {
  thinkingProcess: string;    // content inside <think> tags
  receptionType: string;
  suggestion: AuditSuggestion;
  issues: AuditIssue[];
  bodyText: string;           // text outside <think>, for rawOutput display
}

function parseResString(res: string): ParsedResString | null {
  // Must contain <think> or 问题列表 to be recognized as Guo's format
  if (!res.includes('<think>') && !res.includes('问题列表')) return null;

  // Extract <think> content
  let thinkingProcess = '';
  let bodyText = res;
  const thinkMatch = res.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    thinkingProcess = thinkMatch[1].trim();
    bodyText = res.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  }

  // Extract reception type from body
  const typeMatch = bodyText.match(/(?:招待|接待)类型[：:]\s*(.+?)(?:\n|$)/);
  const receptionType = typeMatch ? typeMatch[1].trim() : '公务接待';

  // Extract suggestion from body
  const suggestionMatch = bodyText.match(/审核建议[：:]\s*(.+?)(?:\n|$)/);
  const suggestion = suggestionMatch
    ? normalizeSuggestion(suggestionMatch[1].trim())
    : extractSuggestion(bodyText);

  // Extract issues after "问题列表：" — each line may have <font> tags
  const issues: AuditIssue[] = [];
  const issuesSectionMatch = bodyText.match(/问题列表[：:]\s*\n?([\s\S]*?)$/);
  if (issuesSectionMatch) {
    const section = issuesSectionMatch[1];
    // Match numbered items: "1. ..." or "<font ...>1. ...</font>"
    const lines = section.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      const cleaned = stripHtmlTags(line).replace(/^\s*\d+[.、．]\s*/, '').trim();
      if (cleaned.length < 5) continue;
      issues.push({
        severity: classifyIssueSeverity(cleaned),
        message: cleaned,
      });
    }
  }

  return { thinkingProcess, receptionType, suggestion, issues, bodyText };
}

function findRawOutput(outputs: Record<string, unknown>): unknown {
  // Try 'res' key first (Guo's Dify workflow format)
  if (typeof outputs.res === 'string' && outputs.res.length > 0) {
    return outputs.res;
  }
  // Try known keys
  for (const key of ['text', 'result', 'output', 'answer']) {
    if (outputs[key] !== undefined && outputs[key] !== null && outputs[key] !== '') {
      return outputs[key];
    }
  }
  // Fallback: find the longest string value in all output keys
  let best = '';
  for (const [, val] of Object.entries(outputs)) {
    if (typeof val === 'string' && val.length > best.length) {
      best = val;
    }
    // Also check nested objects (some Dify workflows wrap output in an object)
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      return val;
    }
  }
  return best || '';
}

function parseDifyOutput(outputs: Record<string, unknown>): AuditResult {
  // Debug: log raw outputs for troubleshooting
  console.log('[dify-direct] workflow outputs keys:', Object.keys(outputs));
  console.log('[dify-direct] workflow outputs:', JSON.stringify(outputs).slice(0, 500));

  const raw = findRawOutput(outputs);

  // Try Guo's <think>+问题列表 format first (highest priority)
  if (typeof raw === 'string') {
    const parsed = parseResString(raw);
    if (parsed) {
      console.log('[dify-direct] parsed res string format: %d issues, thinking=%d chars',
        parsed.issues.length, parsed.thinkingProcess.length);
      return enrichResult({
        receptionType: parsed.receptionType,
        suggestion: parsed.suggestion,
        issues: parsed.issues,
        rawOutput: parsed.thinkingProcess || undefined,
        totalDuration: 0,
      });
    }
  }

  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (obj.suggestion || obj.receptionType || obj.issues) {
      const rawText = typeof obj.rawOutput === 'string' ? obj.rawOutput :
                      typeof obj.text === 'string' ? obj.text : undefined;
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
        rawOutput: rawText,
        totalDuration: 0,
      });
    }
  }

  const text = String(raw);
  try {
    const jsonParsed = JSON.parse(text);
    if (jsonParsed && typeof jsonParsed === 'object') {
      // Check if the JSON object itself contains a 'res' string (e.g. {"res": "<think>..."})
      if (typeof jsonParsed.res === 'string') {
        const resParsed = parseResString(jsonParsed.res);
        if (resParsed) {
          return enrichResult({
            receptionType: resParsed.receptionType,
            suggestion: resParsed.suggestion,
            issues: resParsed.issues,
            rawOutput: resParsed.thinkingProcess || undefined,
            totalDuration: 0,
          });
        }
      }
      return enrichResult({
        receptionType: String(jsonParsed.receptionType || jsonParsed.reception_type || '公务接待'),
        suggestion: normalizeSuggestion(jsonParsed.suggestion || jsonParsed.result),
        issues: normalizeIssues(jsonParsed.issues || jsonParsed.problems || []),
        subDocuments: normalizeSubDocuments(jsonParsed.subDocuments || jsonParsed.sub_documents || jsonParsed.documents),
        amount: typeof jsonParsed.amount === 'number' ? jsonParsed.amount : undefined,
        pageCount: typeof jsonParsed.pageCount === 'number' ? jsonParsed.pageCount : undefined,
        aiSummary: typeof jsonParsed.aiSummary === 'string' ? jsonParsed.aiSummary :
                   typeof jsonParsed.summary === 'string' ? jsonParsed.summary :
                   typeof jsonParsed.ai_summary === 'string' ? jsonParsed.ai_summary : undefined,
        rawOutput: text,
        totalDuration: 0,
      });
    }
  } catch {
    // Not JSON — treat as plain text audit report
  }

  // Plain text output from Dify (most common case for this workflow)
  return enrichResult({
    receptionType: extractReceptionType(text),
    suggestion: extractSuggestion(text),
    issues: extractIssuesFromText(text),
    rawOutput: text.length > 10 ? text : undefined,
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

function extractReceptionType(text: string): string {
  if (text.includes('商务接待')) return '商务接待';
  if (text.includes('公务接待')) return '公务接待';
  // Try to extract from "招待类型：XXX" pattern
  const match = text.match(/(?:招待|接待)类型[：:]\s*(.+?)(?:\n|$)/);
  if (match) return match[1].trim();
  return '公务接待';
}

function extractSuggestion(text: string): AuditSuggestion {
  // Look for explicit verdict patterns
  const verdictMatch = text.match(/(?:整体)?审核(?:结果|建议)[：:]\s*(.+?)(?:\n|$)/);
  if (verdictMatch) {
    const verdict = verdictMatch[1].trim();
    if (verdict.includes('不通过') || verdict.includes('拒绝')) return '不通过';
    if (verdict.includes('通过') && !verdict.includes('不') && !verdict.includes('复核')) return '通过';
    if (verdict.includes('人工复核') || verdict.includes('复核')) return '人工复核';
  }
  if (text.includes('不通过') || text.includes('拒绝')) return '不通过';
  if (text.includes('人工复核') || text.includes('复核')) return '人工复核';
  if (text.includes('通过')) return '通过';
  return '人工复核';
}

function extractIssuesFromText(text: string): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Strategy 1: Extract numbered items from "问题列表" / "问题详情" section
  const problemSectionMatch = text.match(/(?:问题(?:列表|详情|汇总)|审核发现)[：:]*\n([\s\S]*?)(?:\n\n|$)/);
  if (problemSectionMatch) {
    const section = problemSectionMatch[1];
    const numberedItems = section.match(/(?:^|\n)\s*\d+[.、．]\s*(.+)/g);
    if (numberedItems) {
      for (const item of numberedItems) {
        const cleaned = item.replace(/^\s*\d+[.、．]\s*/, '').trim();
        if (cleaned.length < 5 || cleaned.length > 500) continue;
        const severity = classifyIssueSeverity(cleaned);
        issues.push({ severity, message: cleaned });
      }
    }
  }

  // Strategy 2: Extract bullet items (• or - prefixed)
  const bulletItems = text.match(/(?:^|\n)\s*[•\-*]\s+(.+)/g);
  if (bulletItems) {
    for (const item of bulletItems) {
      const cleaned = item.replace(/^\s*[•\-*]\s+/, '').trim();
      if (cleaned.length < 8 || cleaned.length > 500) continue;
      // Skip if already captured
      if (issues.some(i => i.message.includes(cleaned.slice(0, 20)))) continue;
      // Only add items that look like issues (contain action words)
      if (/未|缺|不[符规一]|超[期标]|矛盾|违反|错误|偏差|异常|不规范/.test(cleaned)) {
        issues.push({ severity: classifyIssueSeverity(cleaned), message: cleaned });
      }
    }
  }

  // Strategy 3: Fallback — split on sentence boundaries, pick issue-like sentences
  if (issues.length === 0) {
    const lines = text.split(/\n/).filter(l => l.trim().length > 8);
    for (const line of lines) {
      const trimmed = line.replace(/^[-*•\d.、]+\s*/, '').trim();
      if (trimmed.length < 8 || trimmed.length > 500) continue;
      if (/未|缺|不[符规一]|超[期标]|矛盾|违反|错误|偏差|异常|不规范|不一致/.test(trimmed)) {
        issues.push({ severity: classifyIssueSeverity(trimmed), message: trimmed });
      }
    }
  }

  return issues.length > 0 ? issues : [{ severity: 'info', message: text.slice(0, 300) }];
}

function classifyIssueSeverity(text: string): AuditIssue['severity'] {
  if (/缺失|不符|错误|超[期标]|违反|矛盾|超过.*限|不一致/.test(text)) return 'error';
  if (/注意|建议|偏[低高]|接近|不规范|未填写|未包含/.test(text)) return 'warning';
  return 'info';
}
