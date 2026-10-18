import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Hospital, Search, Loader2, X, Compass, ChevronRight } from 'lucide-react';

export interface PlaceSuggestion {
  id: string;
  text: string;
  mainText: string;
  secondaryText?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  source?: 'google_places' | 'google_client' | 'photon_osm' | 'preset';
}

export interface PlaceSelection {
  lat: number;
  lng: number;
  displayName: string;
  address?: string;
}

interface PlaceAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectPlace?: (place: PlaceSelection) => void;
  placeholder?: string;
  icon?: 'pin' | 'hospital' | 'search';
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
}

const POPULAR_EMERGENCY_PRESETS: PlaceSuggestion[] = [
  {
    id: 'preset-manipal-blr',
    text: 'Manipal Hospital, Old Airport Road, Bengaluru',
    mainText: 'Manipal Hospital',
    secondaryText: 'Old Airport Road, Kodihalli, Bengaluru',
    lat: 12.9580,
    lng: 77.6585,
    source: 'preset',
  },
  {
    id: 'preset-indiranagar-blr',
    text: 'Indiranagar 100ft Road, Bengaluru',
    mainText: 'Indiranagar 100ft Road',
    secondaryText: 'Indiranagar, Bengaluru, Karnataka',
    lat: 12.9719,
    lng: 77.6412,
    source: 'preset',
  },
  {
    id: 'preset-command-hosp-blr',
    text: 'Command Hospital Air Force, Domlur, Bengaluru',
    mainText: 'Command Hospital Air Force',
    secondaryText: 'Halasuru, Domlur, Bengaluru',
    lat: 12.9634,
    lng: 77.6358,
    source: 'preset',
  },
  {
    id: 'preset-lilavati-bom',
    text: 'Lilavati Hospital & Research Centre, Bandra West, Mumbai',
    mainText: 'Lilavati Hospital',
    secondaryText: 'Bandra Reclamation, Mumbai, Maharashtra',
    lat: 19.0514,
    lng: 72.8295,
    source: 'preset',
  },
  {
    id: 'preset-sgh-singapore',
    text: 'Singapore General Hospital, Outram Road, Singapore',
    mainText: 'Singapore General Hospital (SGH)',
    secondaryText: 'Outram Road, Bukit Merah, Singapore',
    lat: 1.2795,
    lng: 103.8344,
    source: 'preset',
  },
  {
    id: 'preset-marina-bay-singapore',
    text: 'Marina Bay Sands, Singapore',
    mainText: 'Marina Bay Sands',
    secondaryText: '10 Bayfront Avenue, Singapore',
    lat: 1.2838,
    lng: 103.8591,
    source: 'preset',
  },
];

export const PlaceAutocompleteInput: React.FC<PlaceAutocompleteInputProps> = ({
  value,
  onChange,
  onSelectPlace,
  placeholder = 'Search place, hospital, landmark...',
  icon = 'pin',
  className = '',
  inputClassName = '',
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions combining client-side Google Maps AutocompleteService and server-side fallback
  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      // Suggest top emergency destinations when empty
      const filteredPresets = icon === 'hospital'
        ? POPULAR_EMERGENCY_PRESETS.filter((p) => p.text.toLowerCase().includes('hospital'))
        : POPULAR_EMERGENCY_PRESETS;
      setSuggestions(filteredPresets);
      setIsOpen(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 1. Query Server Proxy (/api/places-autocomplete) with Google Places API (New)
    try {
      const res = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            setIsOpen(true);
            setHighlightedIndex(-1);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Autocomplete server fetch failed, checking fallback:', err);
    }

    // 2. Fallback: Local matching against presets
    const localMatches = POPULAR_EMERGENCY_PRESETS.filter(
      (p) =>
        p.mainText.toLowerCase().includes(trimmed.toLowerCase()) ||
        p.text.toLowerCase().includes(trimmed.toLowerCase()) ||
        (p.secondaryText && p.secondaryText.toLowerCase().includes(trimmed.toLowerCase()))
    );

    if (localMatches.length > 0) {
      setSuggestions(localMatches);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
    setIsLoading(false);
  }, [icon]);

  // Handle typing with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      fetchSuggestions(query);
    }, 180);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (!value.trim()) {
      const presets = icon === 'hospital'
        ? POPULAR_EMERGENCY_PRESETS.filter((p) => p.text.toLowerCase().includes('hospital'))
        : POPULAR_EMERGENCY_PRESETS;
      setSuggestions(presets);
      setIsOpen(true);
    } else if (suggestions.length > 0) {
      setIsOpen(true);
    } else {
      fetchSuggestions(value);
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = async (item: PlaceSuggestion) => {
    const selectedName = item.mainText || item.text;
    onChange(selectedName);
    setIsOpen(false);

    // If we already have lat/lng (e.g. presets or OSM/Photon)
    if (item.lat !== undefined && item.lng !== undefined) {
      if (onSelectPlace) {
        onSelectPlace({
          lat: item.lat,
          lng: item.lng,
          displayName: item.text,
          address: item.secondaryText,
        });
      }
      return;
    }

    // Otherwise resolve via server /api/place-details or /api/geocode
    try {
      setIsLoading(true);
      const url = item.placeId
        ? `/api/place-details?placeId=${encodeURIComponent(item.placeId)}&address=${encodeURIComponent(item.text)}`
        : `/api/place-details?address=${encodeURIComponent(item.text)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.lat && data.lng) {
          if (onSelectPlace) {
            onSelectPlace({
              lat: data.lat,
              lng: data.lng,
              displayName: data.displayName || selectedName,
              address: data.address,
            });
          }
          return;
        }
      }

      // Final fallback to geocode endpoint
      const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(item.text)}`);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.lat && geoData.lng && onSelectPlace) {
          onSelectPlace({
            lat: geoData.lat,
            lng: geoData.lng,
            displayName: geoData.displayName || selectedName,
          });
        }
      }
    } catch (e) {
      console.warn('Coordinates resolution failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        fetchSuggestions(value);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`}>
      {/* Input Field Container */}
      <div className="relative flex items-center">
        {/* Left Icon */}
        <div className="absolute left-2.5 text-slate-400 pointer-events-none flex items-center">
          {icon === 'hospital' ? (
            <Hospital className="w-3.5 h-3.5 text-rose-400" />
          ) : icon === 'search' ? (
            <Search className="w-3.5 h-3.5 text-sky-400" />
          ) : (
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
          )}
        </div>

        {/* Text Input */}
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all ${inputClassName}`}
        />

        {/* Right Status / Clear Icon */}
        <div className="absolute right-2 flex items-center gap-1">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
              title="Clear input"
            >
              <X className="w-3 h-3" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Auto-suggest Results Dropdown with high z-index and sleek card design */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 border border-cyan-500/30 rounded-xl shadow-2xl overflow-hidden z-[9999] backdrop-blur-2xl max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1">
            <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Compass className="w-3 h-3" />
                <span>Google Maps Suggestions</span>
              </span>
              <span className="text-[9px] text-slate-400 font-sans">Click or Press Enter</span>
            </div>

            {suggestions.map((item, idx) => {
              const isSelected = idx === highlightedIndex;
              const isHospital =
                item.text.toLowerCase().includes('hospital') ||
                item.text.toLowerCase().includes('clinic') ||
                item.text.toLowerCase().includes('medical');

              return (
                <div
                  key={item.id || idx}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur before selection
                    handleSelectSuggestion(item);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3 py-2 rounded-lg cursor-pointer transition-all flex items-start gap-2.5 ${
                    isSelected ? 'bg-cyan-950/90 text-white border border-cyan-500/40' : 'hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isHospital ? (
                      <Hospital className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                      <span>{item.mainText}</span>
                      {isHospital && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[9px] font-mono shrink-0">
                          Hospital
                        </span>
                      )}
                    </div>
                    {item.secondaryText && (
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.secondaryText}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-3 h-3 text-slate-500 shrink-0 self-center opacity-60" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
