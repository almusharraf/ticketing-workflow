import { Router } from 'express';
import { employeeDirectory } from '../data/employeeDirectory';

export const employeesRouter = Router();

function maskPassport(passportNumber: string): string {
  return `••••${passportNumber.slice(-3)}`;
}

employeesRouter.get('/', (_req, res) => {
  const employees = employeeDirectory.map((entry) => ({
    employeeId: entry.employeeId,
    givenName: entry.profile.givenName,
    familyName: entry.profile.familyName,
    passportNumberMasked: maskPassport(entry.profile.passportNumber),
    trip: entry.pendingTrip,
    managerName: entry.managerName,
  }));
  res.json({ employees });
});
