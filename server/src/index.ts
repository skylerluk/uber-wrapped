import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { AggregatePayloadSchema, looksLikeLeak } from './validate.ts';
import { generateRoasts } from './gemini.ts';

const app = express();
app.set('trust proxy', 1); // Railway sits behind a proxy

// --- CORS: only the configured frontend origin(s) + localhost in dev ---
const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const isDevOrigin = (origin: string) => /^https?:\/\/localhost(:\d+)?$/.test(origin);
// This project's Vercel deploys (production + previews), e.g.
// uber-wrapped.vercel.app, uber-wrapped-git-main-*.vercel.app, uber-wrapped-<hash>-*.vercel.app
const isProjectVercel = (origin: string) =>
  /^https:\/\/uber-wrapped[a-z0-9-]*\.vercel\.app$/.test(origin);

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl (no Origin header) and approved origins.
      if (!origin || isDevOrigin(origin) || isProjectVercel(origin) || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
  }),
);

app.use(express.json({ limit: '32kb' }));

// --- Rate limit: protect the key/quota ---
const limiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/insights', limiter, async (req, res) => {
  const started = Date.now();

  // Validate shape strictly. Unknown keys (addresses/coords) => 400.
  const parsed = AggregatePayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ roasts: [], status: 'invalid' });
  }
  if (looksLikeLeak(parsed.data)) {
    return res.status(400).json({ roasts: [], status: 'invalid' });
  }

  const alreadyUsed = parsed.data.comparisons.map((c) => c.label);

  try {
    const roasts = await generateRoasts(parsed.data, alreadyUsed);
    // Coarse metrics only — never log payload contents or the key.
    console.log(
      `[insights] roasts=${roasts.length} latency=${Date.now() - started}ms rides=${parsed.data.totalRides}`,
    );
    if (roasts.length === 0) {
      return res.json({ roasts: [], status: 'fallback' });
    }
    return res.json({ roasts, status: 'ok' });
  } catch {
    return res.json({ roasts: [], status: 'fallback' });
  }
});

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`uber-wrapped server listening on :${PORT}`);
});
