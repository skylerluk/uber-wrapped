import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

// CORS is open during scaffold; Phase 4 locks this to the frontend origin.
app.use(cors());
app.use(express.json({ limit: '64kb' }));

// Health check (used by Railway and the frontend to confirm the API is up).
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// TODO(Phase 4): POST /api/roast — receives anonymized aggregate stats only,
// returns Gemini-generated flavor text. No raw trip data ever reaches here.

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
  console.log(`uber-wrapped server listening on :${PORT}`);
});
