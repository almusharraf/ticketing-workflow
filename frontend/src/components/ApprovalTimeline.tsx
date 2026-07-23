import { TravelRequestStatus } from '../api/travelRequests';

interface Step {
  id: string;
  label: string;
}

const STEPS: Step[] = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'approved', label: 'Manager Approved' },
  { id: 'booking', label: 'Booking Ticket' },
  { id: 'issued', label: 'Ticket Issued' },
];

function getActiveIndex(status: TravelRequestStatus): number {
  switch (status) {
    case 'pending_approval':
      return 0;
    case 'approved':
      return 1;
    case 'booking':
      return 2;
    case 'booked':
      return 3;
    case 'booking_failed':
      return 2;
    case 'rejected':
      return 1;
    default:
      return 0;
  }
}

function getStepState(
  index: number,
  activeIndex: number,
  status: TravelRequestStatus
): 'done' | 'active' | 'pending' | 'failed' {
  if (status === 'rejected' && index === 1) return 'failed';
  if (status === 'booking_failed' && index === 2) return 'failed';
  if (status === 'booked') return index <= 3 ? 'done' : 'pending';
  if (index < activeIndex) return 'done';
  if (index === activeIndex) return 'active';
  return 'pending';
}

interface Props {
  status: TravelRequestStatus;
}

export function ApprovalTimeline({ status }: Props) {
  const activeIndex = getActiveIndex(status);

  return (
    <div className="approval-timeline">
      {STEPS.map((step, i) => {
        const resolvedState = getStepState(i, activeIndex, status);

        return (
          <div key={step.id} className={`approval-timeline__step approval-timeline__step--${resolvedState}`}>
            <div className="approval-timeline__marker">
              <span className="approval-timeline__dot" />
              {i < STEPS.length - 1 && <span className="approval-timeline__line" />}
            </div>
            <div className="approval-timeline__content">
              <span className="approval-timeline__label">{step.label}</span>
              {resolvedState === 'active' && <span className="approval-timeline__status">In progress</span>}
              {resolvedState === 'failed' && <span className="approval-timeline__status">Failed</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
