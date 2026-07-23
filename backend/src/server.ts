import express from 'express';
import cors from 'cors';
import { config } from './config';
import { flightsRouter } from './routes/flights';
import { placesRouter } from './routes/places';
import { travelRequestsRouter } from './routes/travelRequests';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/flights', flightsRouter);
app.use('/api/places', placesRouter);
app.use('/api/travel-requests', travelRequestsRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
  console.log(`Travel module API listening on :${config.port}`);
});
