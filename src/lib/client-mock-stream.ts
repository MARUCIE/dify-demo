import type { AuditResult } from './types';
import { MOCK_BATCH_RESULTS, MOCK_STEP_DELAYS } from './mock-data';
import { deriveSubDocumentsFromIssues, generatePerFileSummary } from './sub-doc-analysis';

// Client-safe version of enrichResult (avoids server-only dify-client imports)
function enrichResult(result: AuditResult): AuditResult {
  if ((!result.subDocuments || result.subDocuments.length === 0) && result.issues.length > 0) {
    result.subDocuments = deriveSubDocumentsFromIssues(result.issues);
  }
  if (!result.aiSummary) {
    result.aiSummary = generatePerFileSummary(result);
  }
  return result;
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export interface MockSSEEvent {
  event: string;
  data: Record<string, unknown>;
}

/**
 * Client-side mock SSE stream for DEMO_MODE.
 * Generates step_start/step_done/result/done events with realistic delays,
 * identical to the server-side mockStream() in the API route.
 */
export async function* clientMockStream(fileIndex: number): AsyncGenerator<MockSSEEvent> {
  for (let stepId = 1; stepId <= 10; stepId++) {
    yield { event: 'step_start', data: { stepId } };
    const baseDelay = MOCK_STEP_DELAYS[stepId - 1];
    const jitter = 0.6 + Math.random() * 0.8;
    await delay(baseDelay * jitter);
    yield { event: 'step_done', data: { stepId } };
    await delay(60);
  }

  const mockResult = enrichResult({ ...MOCK_BATCH_RESULTS[fileIndex % MOCK_BATCH_RESULTS.length] });
  yield { event: 'result', data: mockResult as unknown as Record<string, unknown> };
  yield { event: 'done', data: {} };
}
