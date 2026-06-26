// Backend client: optionally fetch extra AI roast flavor from the Express
// backend. The app is fully functional with the backend off — every failure
// path resolves to no extra roasts, never throws, never blocks the UI.

import type { AggregatePayload, Roast } from '../../types/insights';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://uber-wrapped.up.railway.app';
const CLIENT_TIMEOUT_MS = 6500;

interface InsightsResponse {
  roasts: { headline: string; sub: string }[];
  status: 'ok' | 'fallback' | 'invalid';
}

/**
 * POST the anonymized aggregate payload and return AI roasts as Roast objects,
 * styled identically to deterministic ones. Returns [] on any failure.
 */
export async function fetchAiRoasts(payload: AggregatePayload): Promise<Roast[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}/api/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as InsightsResponse;
    if (data.status !== 'ok' || !Array.isArray(data.roasts)) return [];
    return data.roasts.map((r, i) => ({
      id: `ai-${i}`,
      category: 'ai' as const,
      headline: r.headline,
      sub: r.sub,
      severity: 'medium' as const,
      value: 0,
      // Slot AI roasts among the better deterministic ones without dominating.
      funScore: 70 - i,
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
