import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    county?: string;
  };
}

// Southern California counties and major cities for filtering
const SOUTHERN_CALIFORNIA_COUNTIES = [
  'Los Angeles County',
  'Orange County', 
  'Riverside County',
  'San Bernardino County',
  'Ventura County',
  'Imperial County',
  'Kern County',
  'Santa Barbara County',
  'Tulare County',
  'Fresno County',
  'Kings County',
  'Inyo County',
  'Mono County',
  // County variations
  'Los Angeles',
  'Orange',
  'Riverside',
  'San Bernardino',
  'Ventura',
  'Imperial',
  'Kern',
  'Santa Barbara',
  'Tulare',
  'Fresno',
  'Kings',
  'Inyo',
  'Mono'
];

// Major Southern California cities as backup
const SOUTHERN_CALIFORNIA_CITIES = [
  'Los Angeles', 'San Diego', 'Anaheim', 'Santa Ana', 'Long Beach',
  'Riverside', 'San Bernardino', 'Oxnard', 'Huntington Beach', 'Glendale',
  'Pasadena', 'Burbank', 'Irvine', 'Costa Mesa', 'Newport Beach',
  'Santa Monica', 'Beverly Hills', 'Torrance', 'Fullerton', 'Pomona',
  'Palm Springs', 'Ventura', 'Santa Barbara', 'Bakersfield', 'Fresno'
];

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [searchTerm, setSearchTerm] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      // Enhance query to prioritize California if not already included
      let enhancedQuery = query;
      if (!query.toLowerCase().includes('california') && !query.toLowerCase().includes(' ca')) {
        enhancedQuery = `${query}, California`;
      }

      const params = new URLSearchParams({
        q: enhancedQuery,
        format: 'json',
        addressdetails: '1',
        limit: '10', // Get more results to have better filtering options
        countrycodes: 'us',
        // Add bounding box for Southern California (rough coordinates)
        viewbox: '-121.0,32.5,-114.0,36.0', // West, South, East, North
        bounded: '1'
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            'User-Agent': 'AppointmentNotepad/1.0 (contact@yourapp.com)',
          },
        }
      );

      if (response.ok) {
        const results: NominatimResult[] = await response.json();
        
        // Enhanced filtering: Check county, city, and state
        const socCalResults = results.filter(result => {
          const county = result.address?.county;
          const city = result.address?.city;
          const state = result.address?.state;
          
          // Must be in California
          if (state !== 'California') return false;
          
          // Check if county matches (with or without "County" suffix)
          if (county && SOUTHERN_CALIFORNIA_COUNTIES.includes(county)) {
            return true;
          }
          
          // Fallback: Check if city is a major SoCal city
          if (city && SOUTHERN_CALIFORNIA_CITIES.includes(city)) {
            return true;
          }
          
          return false;
        });

        console.log(`Filtered ${results.length} results to ${socCalResults.length} Southern California addresses`);
        
        // If no SoCal results found, try fallback with just California filtering
        const finalResults = socCalResults.length > 0 ? socCalResults : 
          results.filter(result => result.address?.state === 'California').slice(0, 5);
        
        setSuggestions(finalResults);
        setIsOpen(finalResults.length > 0);
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);

    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  const handleSuggestionSelect = (suggestion: NominatimResult) => {
    const formattedAddress = formatAddress(suggestion);
    setSearchTerm(formattedAddress);
    onChange(formattedAddress);
    setIsOpen(false);
    setSuggestions([]);
  };

  const formatAddress = (result: NominatimResult): string => {
    const addr = result.address;
    const parts: string[] = [];

    if (addr.house_number && addr.road) {
      parts.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
      parts.push(addr.road);
    }

    if (addr.city) {
      parts.push(addr.city);
    }

    if (addr.state) {
      parts.push(addr.state);
    }

    if (addr.postcode) {
      parts.push(addr.postcode);
    }

    return parts.join(', ') || result.display_name;
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn("pr-8", className)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none transition-colors"
            >
              <div className="font-medium text-sm">
                {formatAddress(suggestion)}
              </div>
              {suggestion.address.city && suggestion.address.state && (
                <div className="text-xs text-muted-foreground mt-1">
                  {suggestion.address.city}, {suggestion.address.state}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}