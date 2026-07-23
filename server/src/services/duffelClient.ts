import { config } from '../config';

const BASE_URL = 'https://api.duffel.com';

if (!config.duffel.apiKey) {
  console.warn('[duffel] Missing DUFFEL_API_KEY - requests will fail until set in .env');
}

export async function duffelRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.duffel.apiKey}`,
      'Duffel-Version': config.duffel.apiVersion,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    const message = body?.errors?.[0]?.message ?? res.statusText;
    throw new Error(`Duffel API error (${res.status}): ${message}`);
  }

  return body as T;
}
