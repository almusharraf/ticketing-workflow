import { useEffect, useState } from 'react';
import { listEmployees, DirectoryEmployee } from './api/employees';
import {
  approveTravelRequest,
  createAutoTravelRequest,
  rejectTravelRequest,
  TravelRequestRecord,
} from './api/travelRequests';
import { AutoBookingTrigger } from './components/AutoBookingTrigger';
import { RequestStatus } from './components/RequestStatus';
import { ErpLayout } from './components/layout/ErpLayout';

type Step = 'auto' | 'status';

export default function App() {
  const [step, setStep] = useState<Step>('auto');

  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [submittedRequest, setSubmittedRequest] = useState<TravelRequestRecord | null>(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    listEmployees()
      .then((list) => {
        setEmployees(list);
        if (list.length) setSelectedEmployeeId(list[0].employeeId);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load employee directory'))
      .finally(() => setLoadingEmployees(false));
  }, []);

  async function handleAutoSubmit() {
    if (!selectedEmployeeId) return;
    setSubmitting(true);
    setError(null);
    try {
      const record = await createAutoTravelRequest(selectedEmployeeId);
      setSubmittedRequest(record);
      setStep('status');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit request for approval');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove() {
    if (!submittedRequest) return;
    setDeciding(true);
    try {
      const updated = await approveTravelRequest(submittedRequest.id);
      setSubmittedRequest(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setDeciding(false);
    }
  }

  async function handleReject() {
    if (!submittedRequest) return;
    setDeciding(true);
    try {
      const updated = await rejectTravelRequest(submittedRequest.id, 'Declined by manager');
      setSubmittedRequest(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setDeciding(false);
    }
  }

  function handleStartOver() {
    setSubmittedRequest(null);
    setStep('auto');
    setError(null);
  }

  return (
    <ErpLayout step={step}>
      {error && step !== 'status' && <div className="error-banner">{error}</div>}

      {step === 'auto' && (
        <AutoBookingTrigger
          employees={employees}
          loadingEmployees={loadingEmployees}
          selectedEmployeeId={selectedEmployeeId}
          onSelectEmployee={setSelectedEmployeeId}
          onSubmit={handleAutoSubmit}
          submitting={submitting}
        />
      )}

      {step === 'status' && submittedRequest && (
        <RequestStatus
          request={submittedRequest}
          onApprove={handleApprove}
          onReject={handleReject}
          onStartOver={handleStartOver}
          deciding={deciding}
        />
      )}
    </ErpLayout>
  );
}
