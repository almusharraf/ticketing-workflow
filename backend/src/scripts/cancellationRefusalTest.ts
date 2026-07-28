// Repeatable reproduction of Duffel refusing a cancellation, run outside the
// app's HTTP layer (raw service calls) - same "bypass our own code, hit
// Duffel directly" spirit as a directBookTest-style debug script. No such
// script existed in this repo before (nothing under backend/src/scripts/),
// unlike what an earlier, different version of this project's brief assumed.
//
// The one confirmed-real refusal we've seen came from your own terminal log:
//   "Duffel API error (422): This order cannot be cancelled through the API."
// That happened once, incidentally, and was never deliberately reproduced.
// An order that's already been cancelled is a state we can always recreate
// on demand - cancelling it a second time is guaranteed to be refused by
// Duffel, giving us a genuine, repeatable refusal through the real
// cancelOrder() code path (the same function the API route calls).
//
// Run: node_modules/.bin/ts-node src/scripts/cancellationRefusalTest.ts
import { searchCheapestFlights } from '../services/flightSearch';
import { bookOffer } from '../services/booking';
import { cancelOrder } from '../services/cancellation';
import { EmployeeProfile } from '../types/travel';

const trip = {
  originLocationCode: 'LOS',
  destinationLocationCode: 'LHR',
  departureDate: '2026-09-10',
  returnDate: '2026-09-20',
  cabinClass: 'ECONOMY' as const,
};

const employee: EmployeeProfile = {
  title: 'mr',
  givenName: 'Cancel',
  familyName: 'RefusalTest',
  dateOfBirth: '1992-01-01',
  gender: 'm',
  email: 'cancel.refusal.test@example.com',
  phoneNumber: '+2348012345678',
  passportNumber: 'X7777777',
  passportExpiry: '2030-01-01',
};

async function main() {
  console.log('=== 1. Search + book a fresh real order ===');
  const offers = await searchCheapestFlights({ employee, trip });
  const bookable = offers.find((o) => o.source === 'duffel');
  if (!bookable) throw new Error('No bookable Duffel offer found for LOS-LHR right now');

  const booking = await bookOffer(trip, bookable, employee);
  console.log(`Booked: orderId=${booking.orderId} pnr=${booking.pnr}`);

  console.log('\n=== 2. Cancel it once (expected to succeed) ===');
  const firstCancel = await cancelOrder(booking.orderId);
  console.log(`First cancellation OK: refund=${firstCancel.refundAmount} ${firstCancel.refundCurrency}, cancellationId=${firstCancel.cancellationId}`);

  console.log('\n=== 3. Cancel the SAME already-cancelled order again (deliberately triggers a real refusal) ===');
  try {
    await cancelOrder(booking.orderId);
    console.log('UNEXPECTED: second cancellation succeeded - Duffel did not refuse it');
  } catch (err: any) {
    console.log('Duffel refused, as expected. Actual error message that would reach the user:');
    console.log(`  "${err.message}"`);
  }
}

main().catch((err) => {
  console.error('Script failed before reaching the refusal test:', err);
  process.exit(1);
});
