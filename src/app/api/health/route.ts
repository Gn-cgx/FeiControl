/**
 * Health check endpoint
 * GET /api/health
 *
 * Public (unauthenticated): returns only overall status + uptime.
 * Authenticated (mc_auth cookie): returns full per-service breakdown.
 * Internal URLs, ports, and paths are never returned to unauthenticated callers.
 */
import { NextRequest, NextResponse } from 'next/server';

interface ServiceCheck {
  name: string;
  status: 'up' | 'down' | 'degraded' | 'unknown';
  latency?: number;
  details?: string;
  url?: string;
}

async function checkUrl(url: string, timeoutMs = 5000): Promise<{ status: 'up' | 'down'; latency: number; httpCode?: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const latency = Date.now() - start;
    return { status: res.ok || res.status < 500 ? 'up' : 'down', latency, httpCode: res.status };
  } catch {
    return { status: 'down', latency: Date.now() - start };
  }
}

function isAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get("mc_auth");
  return !!(authCookie && authCookie.value === process.env.AUTH_SECRET);
}

export async function GET(request: NextRequest) {
  const gatewayPort = process.env.OPENCLAW_GATEWAY_PORT || '18789';
  const gatewayUrl = process.env.GATEWAY_URL || `http://127.0.0.1:${gatewayPort}`;
  const clawteamUrl = process.env.CLAWTEAM_API_URL || 'http://127.0.0.1:8080';
  const publicUrl = process.env.MISSION_CONTROL_PUBLIC_URL || process.env.NEXT_PUBLIC_BASE_URL;

  const checks: ServiceCheck[] = [
    { name: 'Mission Control', status: 'up', details: `running (pid ${process.pid})` },
  ];

  const [gatewayCheck, clawteamCheck, anthropicCheck, publicCheck] = await Promise.all([
    checkUrl(`${gatewayUrl}/health`, 3000),
    checkUrl(`${clawteamUrl}/api/overview`, 3000),
    checkUrl('https://api.anthropic.com', 3000),
    publicUrl ? checkUrl(publicUrl, 3000) : Promise.resolve(null),
  ]);

  checks.push({
    name: 'OpenClaw Gateway',
    status: gatewayCheck.status,
    latency: gatewayCheck.latency,
    // URL intentionally omitted — included only for authenticated callers below
  });

  checks.push({
    name: 'Agent Board API',
    status: clawteamCheck.status === 'down' ? 'degraded' : clawteamCheck.status,
    latency: clawteamCheck.latency,
    details: clawteamCheck.status === 'down'
      ? 'board API unreachable; filesystem fallback still supports Office 3D'
      : undefined,
  });

  if (publicUrl && publicCheck) {
    checks.push({
      name: 'Mission Control Public URL',
      status: publicCheck.status,
      latency: publicCheck.latency,
    });
  }

  checks.push({
    name: 'Anthropic API',
    status: anthropicCheck.status === 'up' || anthropicCheck.httpCode === 401 ? 'up' : anthropicCheck.status,
    latency: anthropicCheck.latency,
    details: anthropicCheck.status === 'up' || anthropicCheck.httpCode === 401 ? 'reachable' : 'unreachable',
  });

  // Overall status
  const actionableChecks = checks.filter((c) => c.status !== 'unknown');
  const downCount = actionableChecks.filter((c) => c.status === 'down').length;
  const overallStatus = actionableChecks.length === 0
    ? 'unknown'
    : downCount === 0
      ? 'healthy'
      : downCount < actionableChecks.length / 2
        ? 'degraded'
        : 'critical';

  // Unauthenticated callers only get the overall verdict — no internal details
  if (!isAuthenticated(request)) {
    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  // Authenticated callers get per-service details, including internal URLs
  const detailedChecks = checks.map((c) => {
    if (c.name === 'OpenClaw Gateway') return { ...c, url: gatewayUrl, details: `port ${gatewayPort}` };
    if (c.name === 'Agent Board API') return { ...c, url: `${clawteamUrl}/api/overview` };
    if (c.name === 'Mission Control Public URL' && publicUrl) return { ...c, url: publicUrl };
    if (c.name === 'Anthropic API') return { ...c, url: 'https://api.anthropic.com' };
    return c;
  });

  return NextResponse.json({
    status: overallStatus,
    checks: detailedChecks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
