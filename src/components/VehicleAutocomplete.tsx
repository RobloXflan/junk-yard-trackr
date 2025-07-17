import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface VehicleAutocompleteProps {
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  type: 'make' | 'model';
  year?: string;
  make?: string;
}

export function VehicleAutocomplete({
  id,
  placeholder,
  value,
  onChange,
  required = false,
  className,
  type,
  year,
  make
}: VehicleAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      let url = `https://lvqvoigbdqhruudmfcou.supabase.co/functions/v1/vehicle-data?action=${type}&query=${encodeURIComponent(query)}`;
      
      if (type === 'model' && make && year) {
        url += `&make=${encodeURIComponent(make)}&year=${year}`;
      }

      const { data, error } = await supabase.functions.invoke('vehicle-data', {
        body: null,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (error) throw error;

      const response = await fetch(url);
      const result = await response.json();
      
      if (type === 'make' && result.makes) {
        setSuggestions(result.makes);
      } else if (type === 'model' && result.models) {
        setSuggestions(result.models);
      }
    } catch (error) {
      console.error('Error fetching vehicle suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, type, make, year]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding to allow click events on suggestions
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Prevent suggestions for model field if make is not selected
  const shouldShowSuggestions = type === 'make' || (type === 'model' && make && year);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        required={required}
        className={className}
        autoComplete="off"
      />
      
      {isOpen && shouldShowSuggestions && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              className={cn(
                "w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none",
                index === selectedIndex && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      
      {isLoading && shouldShowSuggestions && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}