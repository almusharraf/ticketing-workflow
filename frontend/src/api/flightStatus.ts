export interface FlightStatusPoint {
  airport: string;
  scheduled: string;
  estimated?: string;
  actual?: string;
  delayMinutes?: number;
  terminal?: string;
  gate?: string;
}

export interface FlightStatusInfo {
  flightStatus: string;
  departure: FlightStatusPoint;
  arrival: FlightStatusPoint;
}

export interface FlightStatusResult {
  status: FlightStatusInfo | null;
  message?: string;
}

export async function getFlightStatus(requestId: string): Promise<FlightStatusResult> {
  const res = await fetch(`/api/travel-requests/${requestId}/flight-status`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || 'Could not check flight status');
  }
  return res.json();
}
