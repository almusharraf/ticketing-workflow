import { TravelRequestStatus } from './travelRequests';

export interface TravelRequestSummary {
  id: string;
  employeeName: string;
  route: string;
  departureDate: string;
  returnDate?: string;
  status: TravelRequestStatus;
  fare: { total: string; currency: string };
  pnr?: string;
  bookedAt?: string;
  cancelledAt?: string;
}

export async function listTravelRequests(): Promise<TravelRequestSummary[]> {
  const res = await fetch('/api/travel-requests');
  if (!res.ok) {
    throw new Error('Could not load travel request history');
  }
  const body = await res.json();
  return body.requests;
}
