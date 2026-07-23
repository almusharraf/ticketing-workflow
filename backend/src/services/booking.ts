import { duffelRequest } from './duffelClient';
import { findBookableOffer } from './flightSearch';
import { EmployeeProfile, FlightOfferSummary, TravelRequestInput } from '../types/travel';

interface DuffelOrderResponse {
  data: {
    id: string;
    booking_reference: string;
  };
}

/**
 * Duffel offers are short-lived quotes, and by the time a manager approves a
 * request the original offer has usually expired with no way to refresh it
 * directly. So this re-searches for the same flight (see findBookableOffer)
 * to get a live, bookable offer before creating the order.
 */
export async function bookOffer(
  trip: TravelRequestInput['trip'],
  offer: FlightOfferSummary,
  employee: EmployeeProfile
) {
  const fresh = await findBookableOffer(trip, offer);

  const response = await duffelRequest<DuffelOrderResponse>('/air/orders', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'instant',
        selected_offers: [fresh.offerId],
        payments: [
          {
            type: 'balance',
            amount: fresh.totalAmount,
            currency: fresh.totalCurrency,
          },
        ],
        passengers: [
          {
            id: fresh.passengerId,
            title: employee.title,
            gender: employee.gender,
            given_name: employee.givenName,
            family_name: employee.familyName,
            born_on: employee.dateOfBirth,
            email: employee.email,
            phone_number: employee.phoneNumber,
          },
        ],
      },
    }),
  });

  return {
    orderId: response.data.id,
    pnr: response.data.booking_reference,
    chargedAmount: fresh.totalAmount,
    chargedCurrency: fresh.totalCurrency,
  };
}
