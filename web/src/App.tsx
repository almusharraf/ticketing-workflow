import { useMemo, useState } from 'react';
import { searchFlights, FlightOfferSummary, TravelRequestInput } from './api/flights';
import {
  approveTravelRequest,
  createTravelRequest,
  rejectTravelRequest,
  TravelRequestRecord,
} from './api/travelRequests';
import { sampleEmployeeRequest } from './sampleEmployee';
import { TravelRequestForm } from './components/TravelRequestForm';
import { FlightResults } from './components/FlightResults';
import { RequestStatus } from './components/RequestStatus';
import { BookingSummary } from './components/BookingSummary';
import { ErpLayout } from './components/layout/ErpLayout';
import { SearchRetryState } from './components/SearchRetryState';

type Step = 'request' | 'results' | 'review' | 'status';

export default function App() {
  const [step, setStep] = useState<Step>('request');
  const [request, setRequest] = useState<TravelRequestInput>(sampleEmployeeRequest);
  const [offers, setOffers] = useState<FlightOfferSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [submittedRequest, setSubmittedRequest] = useState<TravelRequestRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deciding, setDeciding] = useState(false);

  const selectedOffer = useMemo(
    () => offers?.find((o) => o.id === selectedId) ?? null,
    [offers, selectedId]
  );

  async function handleSearch() {
    setLoading(true);
    setSearchError(null);
    setOffers(null);
    setSelectedId(null);
    try {
      const results = await searchFlights(request);
      setOffers(results);
      setStep('results');
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectFlight(id: string) {
    setSelectedId(id);
    setStep('review');
  }

  async function handleSendForApproval() {
    if (!selectedOffer) return;
    setSubmitting(true);
    setSearchError(null);
    try {
      const record = await createTravelRequest(request.employee, request.trip, selectedOffer);
      setSubmittedRequest(record);
      setStep('status');
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Could not submit request for approval');
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
      const msg = err instanceof Error ? err.message : 'Approval failed';
      setSearchError(msg);
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
      setSearchError(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setDeciding(false);
    }
  }

  function handleStartOver() {
    setSubmittedRequest(null);
    setOffers(null);
    setSelectedId(null);
    setStep('request');
    setSearchError(null);
  }

  function handleBack() {
    if (step === 'review') {
      setStep('results');
    } else if (step === 'results') {
      setStep('request');
    }
  }

  const showSidebar = step === 'results' || step === 'review';

  return (
    <ErpLayout
      step={step}
      onBack={handleBack}
      sidebar={
        showSidebar ? (
          <BookingSummary
            request={request}
            offer={selectedOffer}
            showSubmit={step === 'review' && !!selectedOffer}
            onSubmit={handleSendForApproval}
            submitting={submitting}
          />
        ) : undefined
      }
    >
      {searchError && step !== 'status' && (
        step === 'request' && !offers ? (
          <SearchRetryState message={searchError} onRetry={handleSearch} />
        ) : (
          <div className="error-banner">{searchError}</div>
        )
      )}

      {step === 'request' && (
        <TravelRequestForm
          value={request}
          onChange={setRequest}
          onSubmit={handleSearch}
          loading={loading}
        />
      )}

      {step === 'results' && (
        <FlightResults
          offers={offers ?? []}
          selectedId={selectedId}
          onSelect={handleSelectFlight}
          preferredAirlines={request.trip.preferredAirlines}
          loading={loading}
        />
      )}

      {step === 'review' && selectedOffer && (
        <div className="review-panel animate-slide-up">
          <FlightResults
            offers={offers ?? []}
            selectedId={selectedId}
            onSelect={handleSelectFlight}
            preferredAirlines={request.trip.preferredAirlines}
          />
        </div>
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
