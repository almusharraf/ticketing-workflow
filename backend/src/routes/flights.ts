import { Router } from 'express';
import { searchCheapestFlights } from '../services/flightSearch';
import { TravelRequestInput } from '../types/travel';

export const flightsRouter = Router();

flightsRouter.post('/search', async (req, res) => {
  const input = req.body as TravelRequestInput;

  if (!input?.trip?.originLocationCode || !input?.trip?.destinationLocationCode || !input?.trip?.departureDate) {
    res.status(400).json({ error: 'originLocationCode, destinationLocationCode and departureDate are required' });
    return;
  }

  try {
    const offers = await searchCheapestFlights(input);
    res.json({ offers });
  } catch (err: any) {
    console.error('[flights.search] failed', err?.response?.result ?? err);
    res.status(502).json({
      error: 'Duffel flight search failed',
      detail: err?.message,
    });
  }
});
