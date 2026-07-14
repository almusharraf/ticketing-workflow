import { EmployeeProfile } from '../api/flights';
import { getInitials, isPassportValid } from '../utils/travel';
import { StatusBadge } from './ui/StatusBadge';

interface Props {
  employee: EmployeeProfile;
}

export function PassengerCard({ employee }: Props) {
  const passportOk = isPassportValid(employee.passportExpiry);
  const initials = getInitials(employee.givenName, employee.familyName);

  return (
    <div className="passenger-card">
      <div className="passenger-card__avatar" aria-hidden>
        <span>{initials}</span>
      </div>
      <div className="passenger-card__info">
        <div className="passenger-card__name">
          {employee.givenName} {employee.familyName}
        </div>
        <div className="passenger-card__meta">Passport {employee.passportNumber}</div>
      </div>
      <div className="passenger-card__badges">
        <StatusBadge variant={passportOk ? 'success' : 'warning'}>
          {passportOk ? 'Passport valid' : 'Passport expiring soon'}
        </StatusBadge>
      </div>
    </div>
  );
}
