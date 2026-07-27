import { EmployeeProfile, FlightOfferSummary, TravelRequestInput } from './flights';

export type TravelRequestStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'booking'
  | 'booked'
  | 'booking_failed'
  | 'cancelled';

export interface TravelRequestRecord {
  id: string;
  employeeId?: string;
  employee: EmployeeProfile;
  trip: TravelRequestInput['trip'];
  selectedOffer: FlightOfferSummary;
  status: TravelRequestStatus;
  createdAt: string;
  decidedAt?: string;
  rejectionReason?: string;
  managerName?: string;
  managerEmail?: string;
  booking?: {
    pnr: string;
    orderId: string;
    bookedAt: string;
    fareRules?: string;
    chargedAmount: string;
    chargedCurrency: string;
  };
  cancellation?: {
    cancellationId: string;
    refundAmount: string;
    refundCurrency: string;
    cancelledAt: string;
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

export async function createAutoTravelRequest(employeeId: string): Promise<TravelRequestRecord> {
  const res = await fetch('/api/travel-requests/auto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
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

export async function cancelTravelRequest(id: string): Promise<TravelRequestRecord> {
  const res = await fetch(`/api/travel-requests/${id}/cancel`, { method: 'POST' });
  return unwrap(res);
}

export async function getTravelRequest(id: string): Promise<TravelRequestRecord> {
  const res = await fetch(`/api/travel-requests/${id}`);
  return unwrap(res);
}
