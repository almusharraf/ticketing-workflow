import { duffelRequest } from './duffelClient';

// Duffel cancellation is two-step: create a cancellation quote (refund
// amount, may be $0 depending on fare rules), then confirm it to actually
// execute the cancellation and refund. If the fare's conditions don't allow
// cancellation, or the deadline has passed, Duffel's /air/order_cancellations
// call itself fails with a descriptive error - duffelRequest already surfaces
// that message unmodified (see duffelClient.ts), so callers get Duffel's
// actual reason rather than a generic failure.

interface CancellationQuoteResponse {
  data: {
    id: string;
    refund_amount: string;
    refund_currency: string;
    expires_at: string;
  };
}

interface CancellationConfirmResponse {
  data: {
    id: string;
    confirmed_at: string;
    refund_amount: string;
    refund_currency: string;
  };
}

export interface CancellationResult {
  cancellationId: string;
  refundAmount: string;
  refundCurrency: string;
  cancelledAt: string;
}

export async function cancelOrder(orderId: string): Promise<CancellationResult> {
  const quote = await duffelRequest<CancellationQuoteResponse>('/air/order_cancellations', {
    method: 'POST',
    body: JSON.stringify({ data: { order_id: orderId } }),
  });

  const confirmed = await duffelRequest<CancellationConfirmResponse>(
    `/air/order_cancellations/${quote.data.id}/actions/confirm`,
    { method: 'POST' }
  );

  return {
    cancellationId: confirmed.data.id,
    refundAmount: confirmed.data.refund_amount,
    refundCurrency: confirmed.data.refund_currency,
    cancelledAt: confirmed.data.confirmed_at,
  };
}
