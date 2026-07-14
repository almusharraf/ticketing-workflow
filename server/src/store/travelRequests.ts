import { randomUUID } from 'crypto';
import { TravelRequestRecord } from '../types/travel';

// In-memory store - fine for a demo of the workflow shape. A real add-on
// persists this in Postgres (see travel_requests / approvals / bookings
// tables) so state survives a restart and is auditable.
const requests = new Map<string, TravelRequestRecord>();

export function createTravelRequest(data: Omit<TravelRequestRecord, 'id' | 'status' | 'createdAt'>): TravelRequestRecord {
  const record: TravelRequestRecord = {
    ...data,
    id: randomUUID(),
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
  };
  requests.set(record.id, record);
  return record;
}

export function getTravelRequest(id: string): TravelRequestRecord | undefined {
  return requests.get(id);
}

export function updateTravelRequest(id: string, patch: Partial<TravelRequestRecord>): TravelRequestRecord | undefined {
  const existing = requests.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  requests.set(id, updated);
  return updated;
}
