import { Router } from 'express';
import { createTravelRequest, getTravelRequest, updateTravelRequest } from '../store/travelRequests';
import { bookOffer } from '../services/booking';
import { TravelRequestInput, FlightOfferSummary } from '../types/travel';

export const travelRequestsRouter = Router();

interface CreateBody {
  employee: TravelRequestInput['employee'];
  trip: TravelRequestInput['trip'];
  selectedOffer: FlightOfferSummary;
}

travelRequestsRouter.post('/', (req, res) => {
  const body = req.body as CreateBody;

  if (!body?.employee || !body?.trip || !body?.selectedOffer) {
    res.status(400).json({ error: 'employee, trip and selectedOffer are required' });
    return;
  }

  const record = createTravelRequest({
    employee: body.employee,
    trip: body.trip,
    selectedOffer: body.selectedOffer,
  });

  res.status(201).json({ request: record });
});

travelRequestsRouter.get('/:id', (req, res) => {
  const record = getTravelRequest(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Travel request not found' });
    return;
  }
  res.json({ request: record });
});

travelRequestsRouter.post('/:id/approve', async (req, res) => {
  const record = getTravelRequest(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Travel request not found' });
    return;
  }
  if (record.status !== 'pending_approval') {
    res.status(409).json({ error: `Request is already ${record.status}` });
    return;
  }

  updateTravelRequest(record.id, { status: 'booking', decidedAt: new Date().toISOString() });

  try {
    const { orderId, pnr, chargedAmount, chargedCurrency } = await bookOffer(
      record.trip,
      record.selectedOffer,
      record.employee
    );
    const updated = updateTravelRequest(record.id, {
      status: 'booked',
      booking: {
        orderId,
        pnr,
        bookedAt: new Date().toISOString(),
        fareRules: record.selectedOffer.fareFamily
          ? `${record.selectedOffer.fareFamily} — ${record.selectedOffer.refundability?.replace(/_/g, ' ') ?? 'see airline conditions'}`
          : undefined,
        chargedAmount,
        chargedCurrency,
      },
    });
    res.json({ request: updated });
  } catch (err: any) {
    console.error('[travelRequests.approve] booking failed', err);
    const updated = updateTravelRequest(record.id, {
      status: 'booking_failed',
      failureReason: err?.message ?? 'Unknown booking error',
    });
    res.status(502).json({ request: updated, error: 'Booking failed', detail: err?.message });
  }
});

travelRequestsRouter.post('/:id/reject', (req, res) => {
  const record = getTravelRequest(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Travel request not found' });
    return;
  }
  if (record.status !== 'pending_approval') {
    res.status(409).json({ error: `Request is already ${record.status}` });
    return;
  }

  const updated = updateTravelRequest(record.id, {
    status: 'rejected',
    decidedAt: new Date().toISOString(),
    rejectionReason: req.body?.reason,
  });
  res.json({ request: updated });
});
