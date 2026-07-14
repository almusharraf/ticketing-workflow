import { useEffect, useRef, useState } from 'react';
import { PlaceSuggestion, searchPlaces } from '../api/places';

interface Props {
  label: string;
  placeholder: string;
  value: string;
  onChange: (iataCode: string, label?: string) => void;
}

export function AirportAutocomplete({ label, placeholder, value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [displayLabel, setDisplayLabel] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.length < 2 || query === value) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchPlaces(query);
        setSuggestions(results);
        setOpen(results.length > 0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function select(place: PlaceSuggestion) {
    const text = place.cityName ? `${place.cityName} (${place.name})` : place.name;
    onChange(place.iataCode, text);
    setQuery(place.iataCode);
    setDisplayLabel(text);
    setOpen(false);
  }

  return (
    <div className="airport-autocomplete" ref={containerRef}>
      <label className="field-label">{label}</label>
      <div className="airport-autocomplete__input-wrap">
        {value && (
          <span className="airport-autocomplete__code">{value}</span>
        )}
        <input
          className="field-input airport-autocomplete__input"
          value={open ? query : displayLabel || query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setDisplayLabel('');
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && <span className="airport-autocomplete__spinner" />}
      </div>
      {open && (
        <div className="airport-autocomplete__dropdown animate-fade-in">
          {suggestions.map((place) => (
            <button
              type="button"
              key={place.id}
              className="airport-autocomplete__option"
              onClick={() => select(place)}
            >
              <span className="airport-autocomplete__option-code">{place.iataCode}</span>
              <span className="airport-autocomplete__option-meta">
                <span className="airport-autocomplete__option-name">{place.name}</span>
                {place.cityName && (
                  <span className="airport-autocomplete__option-city">{place.cityName}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
