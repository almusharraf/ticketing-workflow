import { DirectoryEmployee } from '../api/employees';
import { Button } from './ui/Button';

interface Props {
  employees: DirectoryEmployee[];
  loadingEmployees: boolean;
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function AutoBookingTrigger({
  employees,
  loadingEmployees,
  selectedEmployeeId,
  onSelectEmployee,
  onSubmit,
  submitting,
}: Props) {
  const selected = employees.find((e) => e.employeeId === selectedEmployeeId) ?? null;

  return (
    <div className="travel-request-card animate-fade-in">
      <div className="card-section">
        <div className="card-section__header">
          <span className="eyebrow">Automated travel request</span>
          <h2 className="card-section__title">Pulled from the ERP</h2>
        </div>

        <label className="field">
          <span className="field-label">Employee</span>
          {loadingEmployees ? (
            <div className="skeleton" style={{ height: 38 }} />
          ) : (
            <select
              className="field-input"
              value={selectedEmployeeId ?? ''}
              onChange={(e) => onSelectEmployee(e.target.value)}
            >
              <option value="" disabled>
                Select an employee…
              </option>
              {employees.map((e) => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.givenName} {e.familyName} ({e.employeeId})
                </option>
              ))}
            </select>
          )}
        </label>
      </div>

      {selected && (
        <div className="card-section">
          <div className="card-section__header">
            <span className="eyebrow">Already on file — nothing to fill in</span>
          </div>
          <div className="request-status__summary card-surface">
            <div className="request-status__row">
              <span>Passenger</span>
              <span>
                {selected.givenName} {selected.familyName}
              </span>
            </div>
            <div className="request-status__row">
              <span>Passport</span>
              <span>{selected.passportNumberMasked}</span>
            </div>
            <div className="request-status__row">
              <span>Route</span>
              <span>
                {selected.trip.originLocationCode} → {selected.trip.destinationLocationCode}
                {selected.trip.returnDate ? ' · Round trip' : ''}
              </span>
            </div>
            <div className="request-status__row">
              <span>Dates</span>
              <span>
                {selected.trip.departureDate}
                {selected.trip.returnDate ? ` – ${selected.trip.returnDate}` : ''}
              </span>
            </div>
            <div className="request-status__row">
              <span>Cabin</span>
              <span>{selected.trip.cabinClass === 'BUSINESS' ? 'Business' : 'Economy'}</span>
            </div>
            <div className="request-status__row">
              <span>Reason</span>
              <span>{selected.trip.reason ?? '—'}</span>
            </div>
            <div className="request-status__row">
              <span>Approving manager</span>
              <span>{selected.managerName}</span>
            </div>
          </div>
        </div>
      )}

      <Button type="button" fullWidth size="lg" disabled={!selected || submitting} onClick={onSubmit}>
        {submitting ? 'Finding cheapest fare…' : 'Find cheapest fare & submit for approval'}
      </Button>
    </div>
  );
}
