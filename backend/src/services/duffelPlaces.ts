import { duffelRequest } from './duffelClient';

export interface PlaceSuggestion {
  id: string;
  iataCode: string;
  name: string;
  cityName?: string;
  countryName?: string;
  type: 'airport' | 'city';
}

interface DuffelPlace {
  id: string;
  iata_code: string | null;
  name: string;
  city_name?: string;
  iata_country_code?: string;
  type: 'airport' | 'city';
  city?: { name: string };
}

interface DuffelPlacesResponse {
  data: DuffelPlace[];
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const response = await duffelRequest<DuffelPlacesResponse>(
    `/places/suggestions?query=${encodeURIComponent(query)}`
  );

  return response.data
    .filter((place) => place.iata_code)
    .map((place) => ({
      id: place.id,
      iataCode: place.iata_code as string,
      name: place.name,
      cityName: place.city?.name ?? place.city_name,
      countryName: place.iata_country_code,
      type: place.type,
    }));
}
