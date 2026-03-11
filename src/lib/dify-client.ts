import type { AuditResult, AuditIssue, AuditSuggestion, SubDocument } from './types';
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

// Parse Dify workflow outputs into AuditResult
export function parseDifyOutput(outputs: Record<string, unknown>): AuditResult {
  const raw = outputs.text ?? outputs.result ?? outputs.output ?? outputs.answer ?? '';

  // If output is already an AuditResult-shaped object
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (obj.suggestion || obj.receptionType || obj.issues) {
      return {
        receptionType: String(obj.receptionType || obj.reception_type || '公务接待'),
        suggestion: normalizeSuggestion(obj.suggestion),
        issues: normalizeIssues(obj.issues),
        subDocuments: normalizeSubDocuments(obj.subDocuments || obj.sub_documents || obj.documents),
        amount: typeof obj.amount === 'number' ? obj.amount : undefined,
        pageCount: typeof obj.pageCount === 'number' ? obj.pageCount : undefined,
        totalDuration: 0,
      };
    }
  }

  // Try JSON string
  const text = String(raw);
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      return {
        receptionType: String(parsed.receptionType || parsed.reception_type || '公务接待'),
        suggestion: normalizeSuggestion(parsed.suggestion || parsed.result),
        issues: normalizeIssues(parsed.issues || parsed.problems || []),
        subDocuments: normalizeSubDocuments(parsed.subDocuments || parsed.sub_documents || parsed.documents),
        amount: typeof parsed.amount === 'number' ? parsed.amount : undefined,
        pageCount: typeof parsed.pageCount === 'number' ? parsed.pageCount : undefined,
        totalDuration: 0,
      };
    }
  } catch {
    // Not JSON — fall through to text extraction
  }

  // Fallback: extract from plain text
  return {
    receptionType: text.includes('商务接待') ? '商务接待' : '公务接待',
    suggestion: extractSuggestion(text),
    issues: extractIssuesFromText(text),
    totalDuration: 0,
  };
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
