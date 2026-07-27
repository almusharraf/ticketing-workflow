import { config } from '../config';
import { FlightStatusInfo } from '../types/travel';

// Post-booking flight status/delay tracking - a schedule/status API, not a
// fares API, so this never feeds into flight search (see flightSearch.ts).
// https://aviationstack.com/documentation
const BASE_URL = 'https://api.aviationstack.com/v1';

interface AviationStackFlightPoint {
  airport: string;
  iata: string;
  terminal?: string | null;
  gate?: string | null;
  delay?: number | null;
  scheduled: string;
  estimated?: string | null;
  actual?: string | null;
}

interface AviationStackFlight {
  flight_date: string;
  flight_status: string;
  departure: AviationStackFlightPoint;
  arrival: AviationStackFlightPoint;
}

interface AviationStackResponse {
  data: AviationStackFlight[];
}

// The `flight_date` query param is gated behind a higher subscription tier
// (a bare/basic key gets a 403 function_access_restricted if it's included)
// - so this always fetches unfiltered by flight_iata and matches the date
// client-side instead. That means coverage is whatever this plan's /flights
// call actually returns (real-time plus the last day or so in practice) - a
// leave-travel booking made months out will simply have no match yet. That's
// a normal "not found" case here, not an error.
export async function getFlightStatus(
  carrierCode: string,
  flightNumber: string,
  departureDate: string
): Promise<FlightStatusInfo | null> {
  if (!config.aviationstack.apiKey) return null;

  const params = new URLSearchParams({
    access_key: config.aviationstack.apiKey,
    flight_iata: `${carrierCode}${flightNumber}`,
  });

  try {
    const res = await fetch(`${BASE_URL}/flights?${params.toString()}`);
    if (!res.ok) {
      console.warn(`[aviationstack] status lookup failed (${res.status})`);
      return null;
    }

    const body = (await res.json()) as AviationStackResponse;
    const flight = body.data?.find((f) => f.flight_date === departureDate);
    if (!flight) return null;

    return {
      flightStatus: flight.flight_status,
      departure: toPoint(flight.departure),
      arrival: toPoint(flight.arrival),
    };
  } catch (err) {
    console.warn('[aviationstack] status lookup errored', err);
    return null;
  }
}

function toPoint(point: AviationStackFlightPoint): FlightStatusInfo['departure'] {
  return {
    airport: point.airport,
    scheduled: point.scheduled,
    estimated: point.estimated ?? undefined,
    actual: point.actual ?? undefined,
    delayMinutes: point.delay ?? undefined,
    terminal: point.terminal ?? undefined,
    gate: point.gate ?? undefined,
  };
}
