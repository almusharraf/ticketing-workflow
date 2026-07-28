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
//
// Scenario 2 targets a DIFFERENT, distinct refusal seen once in manual
// testing: "This order cannot be cancelled through the API." Duffel's error
// reference documents this as the `order_not_cancellable` code, gated on
// whether "cancel" is present in an order's `available_actions` - but does
// not document which fares/carriers/order types cause it to be absent.
// Rather than guess, this checks available_actions directly (via GET
// /air/orders/:id) across a few differing bookings (airline/cabin/route)
// and only attempts cancellation on one confirmed - from Duffel's own
// response - to lack "cancel", so the repro is evidence-based, not assumed.
//
// Run: node_modules/.bin/ts-node src/scripts/cancellationRefusalTest.ts
import { searchCheapestFlights } from '../services/flightSearch';
import { bookOffer } from '../services/booking';
import { cancelOrder } from '../services/cancellation';
import { duffelRequest } from '../services/duffelClient';
import { EmployeeProfile, TravelRequestInput } from '../types/travel';

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

interface OrderResponse {
  data: { available_actions: string[] };
}

// Diverse candidates (route/cabin) to sample different airlines/fare brands -
// Duffel's sandbox assigns whichever real-airline test content it has for
// each route, so this is empirical sampling, not a guaranteed trigger.
const candidateTrips: TravelRequestInput['trip'][] = [
  { originLocationCode: 'LOS', destinationLocationCode: 'LHR', departureDate: '2026-09-11', returnDate: '2026-09-21', cabinClass: 'ECONOMY' },
  { originLocationCode: 'LOS', destinationLocationCode: 'LHR', departureDate: '2026-09-12', returnDate: '2026-09-22', cabinClass: 'BUSINESS' },
  { originLocationCode: 'DMM', destinationLocationCode: 'KHI', departureDate: '2026-09-16', returnDate: '2026-09-26', cabinClass: 'ECONOMY' },
  { originLocationCode: 'DMM', destinationLocationCode: 'DOH', departureDate: '2026-09-17', returnDate: '2026-09-27', cabinClass: 'ECONOMY' },
];

async function scenario2() {
  console.log('\n=== Scenario 2: hunting for an order lacking "cancel" in available_actions ===');

  for (const candidateTrip of candidateTrips) {
    const label = `${candidateTrip.originLocationCode}-${candidateTrip.destinationLocationCode} ${candidateTrip.cabinClass}`;
    try {
      const offers = await searchCheapestFlights({ employee, trip: candidateTrip });
      const bookable = offers.find((o) => o.source === 'duffel');
      if (!bookable) {
        console.log(`[${label}] no bookable Duffel offer right now - skipping`);
        continue;
      }

      const booking = await bookOffer(candidateTrip, bookable, employee);
      const order = await duffelRequest<OrderResponse>(`/air/orders/${booking.orderId}`);
      const actions = order.data.available_actions;
      console.log(`[${label}] booked ${booking.orderId}, available_actions=[${actions.join(', ')}]`);

      if (!actions.includes('cancel')) {
        console.log(`[${label}] "cancel" is ABSENT - attempting cancellation to confirm the real refusal`);
        try {
          await cancelOrder(booking.orderId);
          console.log(`[${label}] UNEXPECTED: cancellation succeeded despite "cancel" being absent from available_actions`);
        } catch (err: any) {
          console.log(`[${label}] Duffel refused. Actual error message that would reach the user:`);
          console.log(`  "${err.message}"`);
        }
        return;
      }
    } catch (err: any) {
      console.log(`[${label}] errored, skipping: ${err.message}`);
    }
  }

  console.log(
    '\nNone of the sampled bookings had "cancel" absent from available_actions - ' +
      'every real order Duffel\'s sandbox gave us across these routes/cabins/airlines was cancellable. ' +
      'This means the specific "order cannot be cancelled through the API" refusal (order_not_cancellable) ' +
      'is NOT reliably reproducible in sandbox with this approach: Duffel\'s docs confirm the error code exists ' +
      'and is gated on available_actions, but do not document which fare brands/carriers/order types cause ' +
      '"cancel" to be absent, and empirically none of these sandbox bookings hit that state. The one occurrence ' +
      'seen in manual testing was most likely a specific fare/airline combination not reproduced here - ' +
      'the error-handling code path itself (duffelRequest surfaces Duffel\'s real message unmodified) is already ' +
      'proven correct by scenario 1\'s "already_cancelled" refusal, which goes through the identical code.'
  );
}

main()
  .then(scenario2)
  .catch((err) => {
    console.error('Script failed:', err);
    process.exit(1);
  });
