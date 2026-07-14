export interface PlaceSuggestion {
  id: string;
  iataCode: string;
  name: string;
  cityName?: string;
  countryName?: string;
  type: 'airport' | 'city';
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const res = await fetch(`/api/places/suggestions?query=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.places;
}
