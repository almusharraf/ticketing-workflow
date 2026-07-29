import { sendEmail } from './email';
import { TravelRequestRecord } from '../types/travel';

// Content for the three lifecycle notifications this app didn't previously
// send at all (no console-logged stand-ins existed anywhere in this repo -
// these are new trigger points, not a swap-in for prior placeholders).
// Each is fire-and-forget from the caller's perspective - sendEmail() never
// throws, so a failure here never blocks or undoes the real action.

export async function sendApprovalRequestEmail(record: TravelRequestRecord): Promise<void> {
  if (!record.managerEmail) return;
  const { employee, trip, selectedOffer } = record;

  await sendEmail(
    record.managerEmail,
    `Approval needed: ${employee.givenName} ${employee.familyName}'s travel request`,
    [
      `${employee.givenName} ${employee.familyName} has a travel request awaiting your approval.`,
      '',
      `Route: ${trip.originLocationCode} -> ${trip.destinationLocationCode}${trip.returnDate ? ' (round trip)' : ''}`,
      `Departure: ${trip.departureDate}${trip.returnDate ? `, return ${trip.returnDate}` : ''}`,
      `Fare: ${selectedOffer.price.currency} ${selectedOffer.price.total}`,
      '',
      `Request ID: ${record.id}`,
    ].join('\n')
  );
}

export async function sendBookingConfirmationEmail(record: TravelRequestRecord): Promise<void> {
  if (!record.booking) return;
  const { employee, trip, booking } = record;

  await sendEmail(
    employee.email,
    `Booking confirmed - PNR ${booking.pnr}`,
    [
      `Hi ${employee.givenName}, your trip is booked.`,
      '',
      `Route: ${trip.originLocationCode} -> ${trip.destinationLocationCode}${trip.returnDate ? ' (round trip)' : ''}`,
      `Booking reference (PNR): ${booking.pnr}`,
      `Amount charged: ${booking.chargedCurrency} ${booking.chargedAmount}`,
      booking.fareRules ? `Fare rules: ${booking.fareRules}` : undefined,
    ]
      .filter(Boolean)
      .join('\n')
  );
}

export async function sendRejectionEmail(record: TravelRequestRecord): Promise<void> {
  const { employee, trip } = record;

  await sendEmail(
    employee.email,
    'Your travel request was declined',
    [
      `Hi ${employee.givenName}, your travel request has been declined by ${record.managerName ?? 'your manager'}.`,
      '',
      `Route: ${trip.originLocationCode} -> ${trip.destinationLocationCode}${trip.returnDate ? ' (round trip)' : ''}`,
      `Departure: ${trip.departureDate}${trip.returnDate ? `, return ${trip.returnDate}` : ''}`,
      record.rejectionReason ? `Reason: ${record.rejectionReason}` : undefined,
    ]
      .filter(Boolean)
      .join('\n')
  );
}

export async function sendCancellationConfirmationEmail(record: TravelRequestRecord): Promise<void> {
  if (!record.cancellation || !record.booking) return;
  const { employee, booking, cancellation } = record;

  await sendEmail(
    employee.email,
    `Trip cancelled - refund confirmation for PNR ${booking.pnr}`,
    [
      `Hi ${employee.givenName}, your trip (PNR ${booking.pnr}) has been cancelled.`,
      '',
      `Refund amount: ${cancellation.refundCurrency} ${cancellation.refundAmount}`,
      `Cancellation reference: ${cancellation.cancellationId}`,
    ].join('\n')
  );
}
