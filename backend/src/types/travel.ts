export type CabinClass = 'ECONOMY' | 'BUSINESS';

export interface EmployeeProfile {
  title: 'mr' | 'ms' | 'mrs';
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  gender: 'm' | 'f';
  email: string;
  phoneNumber: string;
  passportNumber: string;
  passportExpiry: string;
}

export interface TravelRequestInput {
  employee: EmployeeProfile;
  trip: {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate?: string;
    cabinClass: CabinClass;
    checkedBags?: number;
    preferredAirlines?: string[];
    reason?: string;
  };
}

export interface FlightSegmentSummary {
  from: string;
  to: string;
  departure: string;
  arrival: string;
  carrierCode: string;
  carrierName?: string;
  flightNumber: string;
  aircraft?: string;
  terminal?: string;
}

export type OfferSource = 'duffel' | 'kiwi' | 'skyscanner' | 'travelpayouts' | 'amadeus';

export interface FlightOfferSummary {
  id: string;
  source: OfferSource;
  price: {
    total: string;
    currency: string;
    base?: string;
    tax?: string;
  };
  airlines: string[];
  airlineNames: string[];
  airlineLogos: string[];
  cabin: string;
  fareFamily?: string;
  stops: number;
  bookableSeats?: number;
  refundability?: 'fully_refundable' | 'partially_refundable' | 'non_refundable' | 'unknown';
  carryOn?: string;
  checkedBaggage?: string;
  wifi?: boolean;
  powerOutlets?: boolean;
  carbonEmissionsKg?: number;
  itineraries: {
    duration: string;
    segments: FlightSegmentSummary[];
  }[];
  // Only 'duffel' offers are matched + booked as-is (see findBookableOffer) -
  // this is the provider's original payload, kept for debugging/display only.
  raw: unknown;
}

export type TravelRequestStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'booking'
  | 'booked'
  | 'booking_failed';

export interface TravelRequestRecord {
  id: string;
  employee: EmployeeProfile;
  trip: TravelRequestInput['trip'];
  selectedOffer: FlightOfferSummary;
  status: TravelRequestStatus;
  createdAt: string;
  decidedAt?: string;
  rejectionReason?: string;
  booking?: {
    pnr: string;
    orderId: string;
    bookedAt: string;
    fareRules?: string;
    chargedAmount: string;
    chargedCurrency: string;
  };
  failureReason?: string;
}
