import type { AuditResult, AuditIssue, AuditSuggestion, SubDocument } from './types';
import { deriveSubDocumentsFromIssues, generatePerFileSummary } from './sub-doc-analysis';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';

// Dify node types to skip (internal/system nodes, not user-visible steps)
export const SKIP_NODE_TYPES = new Set([
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

export function matchStepByTitle(title: string): number | null {
  for (const [stepId, keywords] of STEP_KEYWORDS) {
    if (keywords.some(kw => title.includes(kw))) {
      return stepId;
    }
  }
  return null;
}

export async function uploadFileToDify(
  file: Blob,
  fileName: string,
  apiUrl: string,
  apiKey: string,
): Promise<string> {
  const netIf = process.env.DIFY_NETWORK_INTERFACE;

  // When DIFY_NETWORK_INTERFACE is set, use curl to bypass proxy/TUN issues
  if (netIf) {
    const tmpPath = join(tmpdir(), `dify-upload-${Date.now()}-${fileName}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tmpPath, buffer);

    try {
      const result = await new Promise<string>((resolve, reject) => {
        const proc = spawn('curl', [
          '--interface', netIf,
          '-s', '--connect-timeout', '30', '--max-time', '120',
          '-X', 'POST',
          '-H', `Authorization: Bearer ${apiKey}`,
          '-F', `file=@${tmpPath};filename=${fileName}`,
          '-F', 'user=demo-user',
          `${apiUrl}/v1/files/upload`,
        ]);
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
        proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
        proc.on('close', (code) => {
          if (code !== 0) reject(new Error(`curl upload failed (exit ${code}): ${stderr}`));
          else resolve(stdout);
        });
      });
      const data = JSON.parse(result);
      if (!data.id) throw new Error(`Dify upload response missing id: ${result}`);
      return data.id;
    } finally {
      await unlink(tmpPath).catch(() => {});
    }
  }

  // Default: native fetch
  const form = new FormData();
  form.append('file', file, fileName);
  form.append('user', 'demo-user');

  const res = await fetch(`${apiUrl}/v1/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dify file upload failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.id;
}

export async function runWorkflowStream(
  uploadFileId: string,
  auditDate: string,
  apiUrl: string,
  apiKey: string,
): Promise<Response> {
  const fileInputVar = process.env.DIFY_FILE_INPUT_VAR || 'file';
  const dateInputVar = process.env.DIFY_DATE_INPUT_VAR || 'audit_date';
  const netIf = process.env.DIFY_NETWORK_INTERFACE;

  const payload = JSON.stringify({
    inputs: {
      [fileInputVar]: {
        type: 'document',
        transfer_method: 'local_file',
        upload_file_id: uploadFileId,
      },
      [dateInputVar]: auditDate,
    },
    response_mode: 'streaming',
    user: 'demo-user',
  });

  // When DIFY_NETWORK_INTERFACE is set, use curl for SSE streaming
  if (netIf) {
    const proc = spawn('curl', [
      '--interface', netIf,
      '-s', '-N', '--connect-timeout', '30', '--max-time', '300',
      '-X', 'POST',
      '-H', `Authorization: Bearer ${apiKey}`,
      '-H', 'Content-Type: application/json',
      '-d', payload,
      `${apiUrl}/v1/workflows/run`,
    ]);

    // Convert Node.js Readable stream to Web ReadableStream
    const webStream = Readable.toWeb(proc.stdout) as ReadableStream<Uint8Array>;
    return new Response(webStream, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  // Default: native fetch
  const res = await fetch(`${apiUrl}/v1/workflows/run`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: payload,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dify workflow failed (${res.status}): ${text}`);
  }

  return res;
}

// Ensure result always has subDocuments (derive from issues if Dify API didn't return them)
// and always has an aiSummary.
export function enrichResult(result: AuditResult): AuditResult {
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
function parseResString(res: string): {
  thinkingProcess: string;
  receptionType: string;
  suggestion: AuditSuggestion;
  issues: AuditIssue[];
} | null {
  if (!res.includes('<think>') && !res.includes('问题列表')) return null;

  let thinkingProcess = '';
  let bodyText = res;
  const thinkMatch = res.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    thinkingProcess = thinkMatch[1].trim();
    bodyText = res.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  }

  const typeMatch = bodyText.match(/(?:招待|接待)类型[：:]\s*(.+?)(?:\n|$)/);
  const receptionType = typeMatch ? typeMatch[1].trim() : '公务接待';

  const suggestionMatch = bodyText.match(/审核建议[：:]\s*(.+?)(?:\n|$)/);
  const suggestion = suggestionMatch
    ? normalizeSuggestion(suggestionMatch[1].trim())
    : extractSuggestion(bodyText);

  const issues: AuditIssue[] = [];
  const issuesSectionMatch = bodyText.match(/问题列表[：:]\s*\n?([\s\S]*?)$/);
  if (issuesSectionMatch) {
    const lines = issuesSectionMatch[1].split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      const cleaned = stripHtmlTags(line).replace(/^\s*\d+[.、．]\s*/, '').trim();
      if (cleaned.length < 5) continue;
      const severity = classifyIssueSeverity(cleaned);
      issues.push({ severity, message: cleaned });
    }
  }

  return { thinkingProcess, receptionType, suggestion, issues };
}

function classifyIssueSeverity(text: string): AuditIssue['severity'] {
  if (/缺失|不符|错误|超[期标]|违反|矛盾|超过.*限|不一致/.test(text)) return 'error';
  if (/注意|建议|偏[低高]|接近|不规范|未填写|未包含/.test(text)) return 'warning';
  return 'info';
}

// Parse Dify workflow outputs into AuditResult
export function parseDifyOutput(outputs: Record<string, unknown>): AuditResult {
  // Try 'res' key first (Guo's Dify workflow format)
  const raw = outputs.res ?? outputs.text ?? outputs.result ?? outputs.output ?? outputs.answer ?? '';

  // Try Guo's <think>+问题列表 format first
  if (typeof raw === 'string') {
    const parsed = parseResString(raw);
    if (parsed) {
      return enrichResult({
        receptionType: parsed.receptionType,
        suggestion: parsed.suggestion,
        issues: parsed.issues,
        rawOutput: parsed.thinkingProcess || undefined,
        totalDuration: 0,
      });
    }
  }

  // If output is already an AuditResult-shaped object
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

  // Try JSON string
  const text = String(raw);
  try {
    const jsonParsed = JSON.parse(text);
    if (jsonParsed && typeof jsonParsed === 'object') {
      // Check nested 'res' key
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
        totalDuration: 0,
      });
    }
  } catch {
    // Not JSON — fall through to text extraction
  }

  // Fallback: extract from plain text
  return enrichResult({
    receptionType: text.includes('商务接待') ? '商务接待' : '公务接待',
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
    if (typeof item === 'string') {
      return { type: item, found: true };
    }
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
    if (typeof item === 'string') {
      return { severity: 'warning' as const, message: item };
    }
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
