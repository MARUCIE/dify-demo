import {
  matchStepByTitle,
  uploadFileToDify,
  runWorkflowStream,
  parseDifyOutput,
  SKIP_NODE_TYPES,
} from '@/lib/dify-client';
import { MOCK_BATCH_RESULTS, MOCK_STEP_DELAYS } from '@/lib/mock-data';

// H8: Simple in-memory rate limiter (token bucket)
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60_000, // 1 minute
};

const requestLog = new Map<string, number[]>();

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(clientIp) ?? [];
  const recent = timestamps.filter(t => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  requestLog.set(clientIp, recent);
  return recent.length > RATE_LIMIT.maxRequests;
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// Demo mode: generate mock SSE events with realistic delays
async function* mockStream(fileIndex: number): AsyncGenerator<string> {
  for (let stepId = 1; stepId <= 10; stepId++) {
    yield sseEvent('step_start', { stepId });
    const baseDelay = MOCK_STEP_DELAYS[stepId - 1];
    const jitter = 0.6 + Math.random() * 0.8;
    await delay(baseDelay * jitter);
    yield sseEvent('step_done', { stepId });
    await delay(60);
  }

  const mockResult = MOCK_BATCH_RESULTS[fileIndex % MOCK_BATCH_RESULTS.length];
  yield sseEvent('result', mockResult);
  yield sseEvent('done', {});
}

// Real mode: relay Dify workflow SSE events to our simplified format
async function* difyStream(
  file: File,
  auditDate: string,
  apiUrl: string,
  apiKey: string,
): AsyncGenerator<string> {
  // Step 1: Upload file to Dify — emit step 1 immediately
  yield sseEvent('step_start', { stepId: 1, title: '报销资料输入' });
  const uploadFileId = await uploadFileToDify(file, file.name, apiUrl, apiKey);
  yield sseEvent('step_done', { stepId: 1, title: '报销资料输入' });

  // Step 2: Run workflow with streaming
  const res = await runWorkflowStream(uploadFileId, auditDate, apiUrl, apiKey);

  if (!res.body) throw new Error('No response body from Dify');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastAssignedStep = 1;
  const startedSteps = new Set<number>([1]); // step 1 already emitted during upload
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

        // Skip nodes inside iterations (OCR per-page processing)
        // These fire many times and would exhaust step IDs prematurely
        const isInsideIteration = !!payload.data?.iteration_id;

        if (event === 'node_started') {
          const nodeType = payload.data?.node_type || '';
          if (SKIP_NODE_TYPES.has(nodeType)) continue;
          if (isInsideIteration) continue; // skip iteration-internal nodes

          const title = payload.data?.title || '';
          let stepId = matchStepByTitle(title);
          if (!stepId) {
            stepId = Math.min(lastAssignedStep + 1, 10);
          }

          if (!startedSteps.has(stepId)) {
            startedSteps.add(stepId);
            lastAssignedStep = stepId;
            yield sseEvent('step_start', { stepId, title });
          }
        }

        if (event === 'node_finished') {
          const nodeType = payload.data?.node_type || '';
          if (SKIP_NODE_TYPES.has(nodeType)) continue;
          if (isInsideIteration) continue; // skip iteration-internal nodes

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
            yield sseEvent('step_done', { stepId, title });
          }
        }

        // Map iteration_started -> step_start for the iteration's parent step
        if (event === 'iteration_started') {
          // OCR iteration = step 4 (报销单据识别)
          if (!startedSteps.has(4)) {
            startedSteps.add(4);
            lastAssignedStep = 4;
            yield sseEvent('step_start', { stepId: 4, title: '报销单据识别' });
          }
        }

        // Map iteration_completed -> step_done for the iteration's parent step
        if (event === 'iteration_completed' || event === 'iteration_finished') {
          if (!completedSteps.has(4)) {
            completedSteps.add(4);
            yield sseEvent('step_done', { stepId: 4, title: '报销单据识别' });
          }
        }

        if (event === 'workflow_finished') {
          workflowOutputs = payload.data?.outputs || {};
        }

        if (event === 'error' || event === 'workflow_failed') {
          yield sseEvent('error', {
            message: payload.message || payload.data?.error || 'Workflow error',
          });
          return;
        }
      } catch {
        // Skip malformed SSE lines
      }
    }
  }

  // Fast-complete any remaining steps that didn't get events
  for (let i = 1; i <= 10; i++) {
    if (!startedSteps.has(i)) {
      yield sseEvent('step_start', { stepId: i });
      await delay(50);
    }
    if (!completedSteps.has(i)) {
      yield sseEvent('step_done', { stepId: i });
      await delay(30);
    }
  }

  // Emit final result
  if (workflowOutputs) {
    const result = parseDifyOutput(workflowOutputs);
    yield sseEvent('result', result);
  }

  yield sseEvent('done', {});
}

// POST /api/audit — SSE streaming audit endpoint
export async function POST(request: Request) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';

  if (isRateLimited(clientIp)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const auditDate = (formData.get('auditDate') as string) || new Date().toISOString().split('T')[0];
    const fileIndex = parseInt((formData.get('fileIndex') as string) || '0');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiUrl = process.env.DIFY_API_URL || '';
    const apiKey = process.env.DIFY_API_KEY || '';
    const isDemoMode = process.env.DEMO_MODE === 'true' || !apiKey;

    const generator = isDemoMode
      ? mockStream(fileIndex)
      : difyStream(file, auditDate, apiUrl, apiKey);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          controller.enqueue(encoder.encode(sseEvent('error', { message })));
          controller.enqueue(encoder.encode(sseEvent('done', {})));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
