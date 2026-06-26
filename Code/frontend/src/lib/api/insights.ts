// Clean seam for Phase 4: optionally fetch extra AI roast flavor from the
// backend. Until then this is a no-op that always "succeeds" with no extra
// roasts, so the app is fully functional with the backend turned off.

import type { AggregatePayload } from '../../types/insights';

export interface AiRoastResult {
  /** Extra narrative lines from Gemini. Empty when backend is off/unreachable. */
  lines: string[];
}

/**
 * Phase 4 will POST the anonymized aggregate payload to /api/roast and return
 * Gemini's flavor text. For now it resolves to no extra lines.
 */
export async function fetchAiRoasts(_payload: AggregatePayload): Promise<AiRoastResult> {
  return { lines: [] };
}
