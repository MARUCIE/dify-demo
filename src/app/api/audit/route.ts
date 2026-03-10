import { NextResponse } from "next/server";

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

// POST /api/audit - Placeholder for Dify workflow API integration
export async function POST(request: Request) {
  // H8: Rate limit check
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    // TODO: Integrate with Dify API at DIFY_API_URL
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      message: "Audit API placeholder - integration pending",
      receivedFields: Object.keys(body),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
