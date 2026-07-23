import { EmployeeProfile, FlightOfferSummary, TravelRequestInput } from './flights';

export type TravelRequestStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'booking'
  | 'booked'
  | 'booking_failed';

export interface TravelRequestRecord {
  id: string;
  employee: EmployeeProfile;
  trip: TravelRequestInput['trip'];
  selectedOffer: FlightOfferSummary;
  status: TravelRequestStatus;
  createdAt: string;
  decidedAt?: string;
  rejectionReason?: string;
  booking?: {
    pnr: string;
    orderId: string;
    bookedAt: string;
    fareRules?: string;
    chargedAmount: string;
    chargedCurrency: string;
  };
  failureReason?: string;
}

async function unwrap(res: Response): Promise<TravelRequestRecord> {
  const body = await res.json();
  if (!res.ok && !body.request) {
    throw new Error(body.detail || body.error || 'Request failed');
  }
  return body.request as TravelRequestRecord;
}

export async function createTravelRequest(
  employee: EmployeeProfile,
  trip: TravelRequestInput['trip'],
  selectedOffer: FlightOfferSummary
): Promise<TravelRequestRecord> {
  const res = await fetch('/api/travel-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee, trip, selectedOffer }),
  });
  return unwrap(res);
}

export async function approveTravelRequest(id: string): Promise<TravelRequestRecord> {
  const res = await fetch(`/api/travel-requests/${id}/approve`, { method: 'POST' });
  return unwrap(res);
}

export async function rejectTravelRequest(id: string, reason?: string): Promise<TravelRequestRecord> {
  const res = await fetch(`/api/travel-requests/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return unwrap(res);
}

export async function getTravelRequest(id: string): Promise<TravelRequestRecord> {
  const res = await fetch(`/api/travel-requests/${id}`);
  return unwrap(res);
}
