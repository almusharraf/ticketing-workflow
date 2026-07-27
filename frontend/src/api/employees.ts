export interface DirectoryEmployee {
  employeeId: string;
  givenName: string;
  familyName: string;
  passportNumberMasked: string;
  trip: {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string;
    returnDate?: string;
    cabinClass: 'ECONOMY' | 'BUSINESS';
    checkedBags?: number;
    reason?: string;
  };
  managerName: string;
}

export async function listEmployees(): Promise<DirectoryEmployee[]> {
  const res = await fetch('/api/employees');
  if (!res.ok) {
    throw new Error('Could not load employee directory');
  }
  const body = await res.json();
  return body.employees;
}
