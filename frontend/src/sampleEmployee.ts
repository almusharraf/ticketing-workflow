import { TravelRequestInput } from './api/flights';

// Stand-in for what the ERP would hand this widget when an employee opens
// "New travel request" — in production this comes from the ERP's employee
// record + the form fields, not a hardcoded constant.
export const sampleEmployeeRequest: TravelRequestInput = {
  employee: {
    title: 'ms',
    givenName: 'Amaka',
    familyName: 'Okafor',
    dateOfBirth: '1990-04-12',
    gender: 'f',
    email: 'amaka.okafor@example.com',
    phoneNumber: '+2348012345678',
    passportNumber: 'A1234567',
    passportExpiry: '2029-03-15',
  },
  trip: {
    originLocationCode: 'LOS',
    destinationLocationCode: 'LHR',
    departureDate: '2026-09-10',
    returnDate: '2026-09-20',
    cabinClass: 'ECONOMY',
    checkedBags: 1,
    preferredAirlines: ['BA', 'VS'],
    reason: 'Annual leave',
  },
};
