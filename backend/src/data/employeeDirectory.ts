import { EmployeeProfile, TravelRequestInput } from '../types/travel';

// Stand-in for the ERP's employee + HR-approved-leave records. In production
// this data (profile, passport, the already-approved trip, manager) comes
// from the ERP database - nothing here is entered by the employee by hand.
export interface EmployeeDirectoryEntry {
  employeeId: string;
  profile: EmployeeProfile;
  pendingTrip: TravelRequestInput['trip'];
  managerName: string;
  managerEmail: string;
}

export const employeeDirectory: EmployeeDirectoryEntry[] = [
  {
    employeeId: 'EMP-1001',
    profile: {
      title: 'ms',
      givenName: 'Abdullah',
      familyName: 'AlMusharraf',
      dateOfBirth: '1990-04-12',
      gender: 'f',
      email: 'abdullah.musharraf@example.com',
      phoneNumber: '+2348012345678',
      passportNumber: 'A1234567',
      passportExpiry: '2029-03-15',
    },
    pendingTrip: {
      // Temporarily swapped from DMM->DXB to the known-reliable LOS->LHR
      // route so booked/cancel/history can be tested live while Duffel's
      // sandbox is 503ing/rejecting stale offers on DMM routes (see README).
      // Swap back to DMM->DXB once Duffel's sandbox stabilizes.
      originLocationCode: 'LOS',
      destinationLocationCode: 'LHR',
      departureDate: '2026-09-10',
      returnDate: '2026-09-20',
      cabinClass: 'ECONOMY',
      checkedBags: 1,
      reason: 'Annual leave',
    },
    managerName: 'Mark Dela Cruz',
    managerEmail: 'mark.cruz@example.com',
  },
{
  employeeId: 'EMP-1002',
  profile: {
    title: 'mr',
    givenName: 'Farhan',
    familyName: 'Saud',
    dateOfBirth: '1988-11-02',
    gender: 'm',
    email: 'farhan.saud@example.com',
    phoneNumber: '+966551234567',
    passportNumber: 'P7654321',
    passportExpiry: '2028-06-30',
  },
  pendingTrip: {
    originLocationCode: 'DMM',
    destinationLocationCode: 'DXB',
    departureDate: '2026-08-15',
    returnDate: '2026-08-25',
    cabinClass: 'ECONOMY',
    checkedBags: 1,
    reason: 'Annual leave',
  },
  managerName: 'Layla Omar',
  managerEmail: 'layla.omar@example.com',
},
{
  employeeId: 'EMP-1003',
  profile: {
    title: 'mr',
    givenName: 'Ahmed',
    familyName: 'Khalid',
    dateOfBirth: '1998-11-02',
    gender: 'm',
    email: 'ahmed.khalid@example.com',
    phoneNumber: '+966551234567',
    passportNumber: 'P743215',
    passportExpiry: '2029-06-30',
  },
  pendingTrip: {
    originLocationCode: 'DMM',
    destinationLocationCode: 'DOH',
    departureDate: '2026-09-15',
    returnDate: '2026-09-25',
    cabinClass: 'ECONOMY',
    checkedBags: 1,
    reason: 'Annual leave',
  },
  managerName: 'Layla Omar',
  managerEmail: 'layla.omar@example.com',
},
];

export function getEmployeeRecord(employeeId: string): EmployeeDirectoryEntry | undefined {
return employeeDirectory.find((e) => e.employeeId === employeeId);
}
