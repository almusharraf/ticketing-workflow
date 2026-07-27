// Pure validation helpers for the auto-create step. No existing validation
// module exists yet in this codebase - this is the first one, kept as a
// sibling directory so future checks (visa, etc.) have a natural home
// without growing the route file itself.

const MIN_MONTHS_AFTER_TRIP_END = 6;

export interface PassportValidationResult {
  valid: boolean;
  message?: string;
}

export function validatePassportExpiry(
  passportExpiry: string,
  departureDate: string,
  returnDate: string | undefined
): PassportValidationResult {
  const tripEndDate = returnDate ?? departureDate;
  const cutoff = new Date(tripEndDate);
  cutoff.setMonth(cutoff.getMonth() + MIN_MONTHS_AFTER_TRIP_END);

  const expiry = new Date(passportExpiry);

  if (expiry < cutoff) {
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return {
      valid: false,
      message:
        `Passport expires ${passportExpiry}, which is before the required cutoff of ${cutoffStr} ` +
        `(${MIN_MONTHS_AFTER_TRIP_END} months after the trip's return date). ` +
        `Renew the passport before this trip can be booked.`,
    };
  }

  return { valid: true };
}
