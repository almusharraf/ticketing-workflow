import { Router } from 'express';
import { createTravelRequest, getTravelRequest, updateTravelRequest } from '../store/travelRequests';
import { bookOffer } from '../services/booking';
import { searchCheapestFlights } from '../services/flightSearch';
import { generateTicketPdf } from '../services/ticketPdf';
import { getFlightStatus } from '../services/aviationstackClient';
import { getEmployeeRecord } from '../data/employeeDirectory';
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

// Fully automated intake: pulls the employee's profile + already-decided trip
// from the ERP directory (no manual form), searches, and auto-selects the
// cheapest Duffel-bookable fare - comparison-only sources (Kiwi/Skyscanner/
// Travelpayouts/Amadeus) are excluded here since only Duffel offers can
// actually be booked (see flightSearch.findBookableOffer).
travelRequestsRouter.post('/auto', async (req, res) => {
  const employeeId = req.body?.employeeId as string | undefined;
  if (!employeeId) {
    res.status(400).json({ error: 'employeeId is required' });
    return;
  }

  const directoryEntry = getEmployeeRecord(employeeId);
  if (!directoryEntry) {
    res.status(404).json({ error: `No ERP record found for employee ${employeeId}` });
    return;
  }

  try {
    const offers = await searchCheapestFlights({
      employee: directoryEntry.profile,
      trip: directoryEntry.pendingTrip,
    });
    const cheapestBookable = offers.find((offer) => offer.source === 'duffel');

    if (!cheapestBookable) {
      res.status(502).json({ error: 'No bookable fare found for this route right now' });
      return;
    }

    const record = createTravelRequest({
      employeeId: directoryEntry.employeeId,
      employee: directoryEntry.profile,
      trip: directoryEntry.pendingTrip,
      selectedOffer: cheapestBookable,
      managerName: directoryEntry.managerName,
      managerEmail: directoryEntry.managerEmail,
    });

    res.status(201).json({ request: record });
  } catch (err: any) {
    console.error('[travelRequests.auto] search failed', err);
    res.status(502).json({ error: 'Flight search failed', detail: err?.message });
  }
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

travelRequestsRouter.get('/:id/ticket.pdf', (req, res) => {
  const record = getTravelRequest(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Travel request not found' });
    return;
  }
  if (record.status !== 'booked' || !record.booking) {
    res.status(409).json({ error: 'Ticket is only available once the request is booked' });
    return;
  }

  const doc = generateTicketPdf(record);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ticket-${record.booking.pnr}.pdf"`);
  doc.pipe(res);
  doc.end();
});

travelRequestsRouter.get('/:id/flight-status', async (req, res) => {
  const record = getTravelRequest(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Travel request not found' });
    return;
  }
  if (record.status !== 'booked') {
    res.status(409).json({ error: 'Flight status is only available once the request is booked' });
    return;
  }

  const outboundSegment = record.selectedOffer.itineraries[0]?.segments[0];
  if (!outboundSegment) {
    res.status(200).json({ status: null, message: 'No segment to look up' });
    return;
  }

  const departureDate = outboundSegment.departure.slice(0, 10);
  const status = await getFlightStatus(outboundSegment.carrierCode, outboundSegment.flightNumber, departureDate);

  if (!status) {
    res.json({
      status: null,
      message: 'No live status available yet for this flight (schedules for far-out dates may not be published yet).',
    });
    return;
  }

  res.json({ status });
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
