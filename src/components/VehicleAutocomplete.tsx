import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleOption {
  id: number;
  name: string;
}

interface VehicleAutocompleteProps {
  id: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type: 'make' | 'model';
  makeId?: number;
  year?: string;
  required?: boolean;
  className?: string;
}

export function VehicleAutocomplete({
  id,
  placeholder,
  value,
  onChange,
  type,
  makeId,
  year,
  required = false,
  className
}: VehicleAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<VehicleOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchVehicleData = async (searchQuery: string = '') => {
    if (type === 'model' && !makeId) return;
    
    setIsLoading(true);
    
    try {
      const params = new URLSearchParams({
        endpoint: type === 'make' ? 'makes' : 'models',
        query: searchQuery
      });
      
      if (makeId) params.append('makeId', makeId.toString());
      if (year) params.append('year', year);

      const { data, error } = await supabase.functions.invoke('vehicle-data', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (error) throw error;
      
      setOptions(data?.data || []);
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (type === 'make' || (type === 'model' && makeId)) {
      fetchVehicleData();
    }
  }, [type, makeId, year]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (inputValue && inputValue.length > 0) {
        fetchVehicleData(inputValue);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, type, makeId]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
    
    if (newValue.length > 0 && !open) {
      setOpen(true);
    }
  };

  const handleSelect = (option: VehicleOption) => {
    setInputValue(option.name);
    onChange(option.name);
    setOpen(false);
  };

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            id={id}
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (filteredOptions.length > 0) setOpen(true);
            }}
            required={required}
            className={cn("pr-8", className)}
          />
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : filteredOptions.length === 0 ? (
              <CommandEmpty>No {type}s found</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={option.name}
                    onSelect={() => handleSelect(option)}
                    className="flex items-center justify-between"
                  >
                    <span>{option.name}</span>
                    {inputValue === option.name && (
                      <Check className="h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}