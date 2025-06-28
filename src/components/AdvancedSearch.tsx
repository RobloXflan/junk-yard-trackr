
import { useState } from "react"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Calendar, DollarSign } from "lucide-react";
import { Vehicle } from "@/stores/vehicleStore";
import { SavedSearches } from "@/components/SavedSearches";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchFilters {
  searchTerm: string;
  status: Vehicle['status'] | 'all';
  paperwork: string;
  priceRange: {
    min: string;
    max: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
  hasImages: boolean | null;
  hasDocuments: boolean | null;
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  totalResults: number;
}

export function AdvancedSearch({ onFiltersChange, totalResults }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    status: 'all',
    paperwork: 'all',
    priceRange: { min: '', max: '' },
    dateRange: { startDate: '', endDate: '' },
    hasImages: null,
    hasDocuments: null,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: SearchFilters = {
      searchTerm: '',
      status: 'all',
      paperwork: 'all',
      priceRange: { min: '', max: '' },
      dateRange: { startDate: '', endDate: '' },
      hasImages: null,
      hasDocuments: null,
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const loadSavedSearch = (savedFilters: SearchFilters) => {
    setFilters(savedFilters);
    onFiltersChange(savedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.paperwork !== 'all') count++;
    if (filters.priceRange.min || filters.priceRange.max) count++;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    if (filters.hasImages !== null) count++;
    if (filters.hasDocuments !== null) count++;
    return count;
  };

  const quickFilters = [
    { label: 'No Title', filter: () => updateFilters({ paperwork: 'no-title' }) },
    { label: 'Missing Paperwork', filter: () => updateFilters({ paperwork: 'no-paperwork' }) },
    { label: 'Recently Added', filter: () => {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      updateFilters({ dateRange: { startDate: weekAgo.toISOString().split('T')[0], endDate: '' } });
    }},
    { label: 'High Value ($5k+)', filter: () => updateFilters({ priceRange: { min: '5000', max: '' } }) },
    { label: 'No Images', filter: () => updateFilters({ hasImages: false }) },
    { label: 'Pending Releases', filter: () => updateFilters({ status: 'sold' }) },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search
            {totalResults > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalResults} results
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Saved Searches */}
        <SavedSearches
          currentFilters={filters}
          onLoadSearch={loadSavedSearch}
        />

        {/* Main Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by make, model, year, Vehicle ID, license plate, or buyer name..."
            value={filters.searchTerm}
            onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((quickFilter, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={quickFilter.filter}
              className="h-8"
            >
              {quickFilter.label}
            </Button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => updateFilters({ status: value as Vehicle['status'] | 'all' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="yard">In Yard</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="pick-your-part">Pick Your Part</SelectItem>
                    <SelectItem value="sa-recycling">SA Recycling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Paperwork Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Paperwork</label>
                <Select
                  value={filters.paperwork}
                  onValueChange={(value) => updateFilters({ paperwork: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Paperwork</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="registered-owner">Registered Owner</SelectItem>
                    <SelectItem value="lien-sale">Lien Sale</SelectItem>
                    <SelectItem value="no-paperwork">No Paperwork</SelectItem>
                    <SelectItem value="no-title">No Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Price Range
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.priceRange.min}
                    onChange={(e) => updateFilters({ 
                      priceRange: { ...filters.priceRange, min: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.priceRange.max}
                    onChange={(e) => updateFilters({ 
                      priceRange: { ...filters.priceRange, max: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Date Added
                </label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.dateRange.startDate}
                    onChange={(e) => updateFilters({ 
                      dateRange: { ...filters.dateRange, startDate: e.target.value }
                    })}
                  />
                  <Input
                    type="date"
                    value={filters.dateRange.endDate}
                    onChange={(e) => updateFilters({ 
                      dateRange: { ...filters.dateRange, endDate: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Media Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Media</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant={filters.hasImages === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ hasImages: filters.hasImages === true ? null : true })}
                    >
                      Has Images
                    </Button>
                    <Button
                      variant={filters.hasImages === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ hasImages: filters.hasImages === false ? null : false })}
                    >
                      No Images
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filters.hasDocuments === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ hasDocuments: filters.hasDocuments === true ? null : true })}
                    >
                      Has Documents
                    </Button>
                    <Button
                      variant={filters.hasDocuments === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateFilters({ hasDocuments: filters.hasDocuments === false ? null : false })}
                    >
                      No Documents
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {getActiveFiltersCount() > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
