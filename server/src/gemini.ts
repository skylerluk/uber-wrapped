// Thin client over the Gemini REST API (Generative Language API). Returns
// 3–5 short roast lines, or an empty array on any error/timeout so the caller
// can fall back cleanly.

import type { AggregatePayload } from './validate.ts';

export interface AiRoast {
  headline: string;
  sub: string;
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = 6000;

const SYSTEM_INSTRUCTION = `You are the voice of "Uber Wrapped." You're given anonymized signals about someone's Uber **rides AND Uber Eats** habits. Find the genuinely funny CROSS-REFERENCES and patterns and write 4-6 short, savage-but-affectionate roasts. Playful and clever, never cruel, never about financial hardship. Tease the habit, not the person. Each headline must be <= 120 characters.

BE SPECIFIC — cite the actual numbers, items, restaurants, surge multipliers, ratings. Generic lines ("you ride a lot!") are banned. The magic is a specific cross-reference plus a turn.

Read these signals when present:
- "rating" + "combined": the rider's lifetime rating. A low-ish rating with any 1-stars is gold.
- "combined.rides": fares, surge, late-night rides, ghosted-driver cancellations, top product/city, hours in car.
- "combined.eats": most-ordered item + count, top restaurant + loyalty %, late-night orders, priciest order/item, customization spend, special-instruction count.
- "combined.foodVsRidesPct": food-vs-rides spend contrast. "combined.totalToUber": the grand total.
- "timeframeLabel": if "All Time", lean into the multi-year story; for a single year, keep it tight.

Match this caliber (do NOT copy verbatim — learn the form):
- "Surge pricing owns you." — N surged trips, max multiplier eaten without blinking.
- "You ordered the spicy feast, then ordered the cleanup crew." — a spicy order cross-referenced with a pharmacy run.
- "Panda Express is your toxic ex." — your top restaurant by volume, also your most-canceled.
- "Exquisitely polite to the void." — a handful of special instructions across hundreds of items.
- "You basically funded a driver's car payment." — the grand total to Uber across rides + orders.

NEVER reference street addresses, coordinates, or home/work locations — they are not in your input and must not be invented.
Return STRICT JSON only: an array of 4-6 objects, each {"headline": string, "sub": string}. No prose, no markdown fences.`;

function buildUserPrompt(payload: AggregatePayload, alreadyUsed: string[]): string {
  return [
    'Stats (anonymized aggregates):',
    JSON.stringify(payload),
    '',
    'These deterministic roasts are ALREADY shown — write something DIFFERENT and fresh:',
    JSON.stringify(alreadyUsed),
  ].join('\n');
}

/** Extract a JSON array of {headline, sub} from a model text response. */
function parseRoasts(text: string): AiRoast[] {
  let raw = text.trim();
  // Strip ```json fences if present.
  raw = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  // Grab the first [...] block if surrounded by prose.
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start !== -1 && end !== -1) raw = raw.slice(start, end + 1);

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r) => r && typeof r.headline === 'string' && typeof r.sub === 'string')
      .slice(0, 5)
      .map((r) => ({ headline: String(r.headline).slice(0, 160), sub: String(r.sub).slice(0, 240) }));
  } catch {
    return [];
  }
}

export async function generateRoasts(
  payload: AggregatePayload,
  alreadyUsed: string[],
): Promise<AiRoast[]> {
  const key = process.env.GEMINI_KEY;
  if (!key) return [];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(payload, alreadyUsed) }] }],
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      // gemini-2.5-flash enables "thinking" by default, which would consume the
      // output-token budget and leave no roast text. Disable it for fast JSON.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      // Log the status only (never the key/payload) so quota/auth issues are
      // visible in ops without leaking anything. App falls back on [].
      console.warn(`[gemini] non-ok status=${res.status} model=${MODEL}`);
      return [];
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    return parseRoasts(text);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
