import { useEffect, useState } from 'react';
import { getPriceCheck, PriceCheckResult } from '../api/priceCheck';
import { formatMoney } from '../utils/travel';
import { StatusBadge } from './ui/StatusBadge';

interface Props {
  requestId: string;
  // Shown while the live check is loading, or if it fails - best-effort,
  // never blocks the approval screen from rendering.
  fallbackPrice: { total: string; currency: string };
}

export function PriceDriftCheck({ requestId, fallbackPrice }: Props) {
  const [check, setCheck] = useState<PriceCheckResult | null>(null);
  // The live check re-searches Duffel for real (findBookableOffer), which
  // routinely takes several seconds - measured 2.3s-6s in testing. Without
  // this, the row shows only the stale fallback price with no indication a
  // check is even happening.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPriceCheck(requestId)
      .then((result) => {
        if (!cancelled) setCheck(result);
      })
      .catch(() => {
        // Best-effort - if the live check fails, the fallback price below
        // is still shown, so the approval screen never breaks over this.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  if (loading) {
    return (
      <div className="request-status__row">
        <span>Fare</span>
        <span>Checking latest price…</span>
      </div>
    );
  }

  if (!check) {
    return (
      <div className="request-status__row">
        <span>Fare</span>
        <span>{formatMoney(fallbackPrice.currency, fallbackPrice.total)}</span>
      </div>
    );
  }

  if (!check.significant) {
    return (
      <div className="request-status__row">
        <span>Fare (checked today)</span>
        <span>{formatMoney(check.currentPrice.currency, check.currentPrice.total)}</span>
      </div>
    );
  }

  const sign = check.deltaPercent > 0 ? '+' : '';
  return (
    <div className="request-status__row">
      <span>Fare</span>
      <span>
        <StatusBadge variant="warning">
          Originally {formatMoney(check.originalPrice.currency, check.originalPrice.total)} → Now{' '}
          {formatMoney(check.currentPrice.currency, check.currentPrice.total)} ({sign}
          {check.deltaPercent.toFixed(0)}%)
        </StatusBadge>
      </span>
    </div>
  );
}
