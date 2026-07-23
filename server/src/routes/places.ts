import { Router } from 'express';
import { searchPlaces } from '../services/duffelPlaces';

export const placesRouter = Router();

placesRouter.get('/suggestions', async (req, res) => {
  const query = String(req.query.query ?? '').trim();

  if (query.length < 2) {
    res.json({ places: [] });
    return;
  }

  try {
    const places = await searchPlaces(query);
    res.json({ places });
  } catch (err: any) {
    console.error('[places.suggestions] failed', err);
    res.status(502).json({ error: 'Airport search failed', detail: err?.message });
  }
});
