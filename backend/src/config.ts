import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 4000,
  duffel: {
    apiKey: process.env.DUFFEL_API_KEY ?? '',
    apiVersion: process.env.DUFFEL_API_VERSION || 'v2',
  },
  // Comparison-only sources - Duffel remains the only provider actually
  // booked against (see flightSearch.findBookableOffer). Any of these left
  // unset simply drops out of the comparison silently.
  kiwi: {
    apiKey: process.env.KIWI_API_KEY ?? '',
  },
  skyscanner: {
    apiKey: process.env.SKYSCANNER_API_KEY ?? '',
    market: process.env.SKYSCANNER_MARKET || 'UK',
    locale: process.env.SKYSCANNER_LOCALE || 'en-GB',
    currency: process.env.SKYSCANNER_CURRENCY || 'GBP',
  },
  travelpayouts: {
    token: process.env.TRAVELPAYOUTS_TOKEN ?? '',
    marker: process.env.TRAVELPAYOUTS_MARKER ?? '',
  },
  amadeus: {
    clientId: process.env.AMADEUS_CLIENT_ID ?? '',
    clientSecret: process.env.AMADEUS_CLIENT_SECRET ?? '',
  },
};
