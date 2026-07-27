import { randomUUID } from 'crypto';
import { db } from './db';
import { TravelRequestRecord } from '../types/travel';

// Whole record stored as one JSON blob per row - the nested shape
// (employee/trip/selectedOffer/booking/cancellation) doesn't need a full
// relational schema for a single-table audit log, and this keeps every
// caller's shape (TravelRequestRecord) unchanged from the in-memory version.
function rowToRecord(row: Record<string, unknown>): TravelRequestRecord {
  return JSON.parse(row.data as string);
}

export function createTravelRequest(data: Omit<TravelRequestRecord, 'id' | 'status' | 'createdAt'>): TravelRequestRecord {
  const record: TravelRequestRecord = {
    ...data,
    id: randomUUID(),
    status: 'pending_approval',
    createdAt: new Date().toISOString(),
  };
  db.prepare('INSERT INTO travel_requests (id, created_at, data) VALUES (?, ?, ?)').run(
    record.id,
    record.createdAt,
    JSON.stringify(record)
  );
  return record;
}

export function getTravelRequest(id: string): TravelRequestRecord | undefined {
  const row = db.prepare('SELECT data FROM travel_requests WHERE id = ?').get(id);
  return row ? rowToRecord(row) : undefined;
}

export function listTravelRequests(): TravelRequestRecord[] {
  const rows = db.prepare('SELECT data FROM travel_requests ORDER BY created_at DESC').all();
  return rows.map(rowToRecord);
}

export function updateTravelRequest(id: string, patch: Partial<TravelRequestRecord>): TravelRequestRecord | undefined {
  const existing = getTravelRequest(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...patch };
  db.prepare('UPDATE travel_requests SET data = ? WHERE id = ?').run(JSON.stringify(updated), id);
  return updated;
}
