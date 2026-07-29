export interface PriceCheckResult {
  originalPrice: { total: string; currency: string };
  currentPrice: { total: string; currency: string };
  deltaPercent: number;
  significant: boolean;
}

export async function getPriceCheck(requestId: string): Promise<PriceCheckResult> {
  const res = await fetch(`/api/travel-requests/${requestId}/price-check`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || 'Price check failed');
  }
  return res.json();
}
