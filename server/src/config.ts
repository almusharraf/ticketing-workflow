import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 4000,
  duffel: {
    apiKey: process.env.DUFFEL_API_KEY ?? '',
    apiVersion: process.env.DUFFEL_API_VERSION || 'v2',
  },
};
