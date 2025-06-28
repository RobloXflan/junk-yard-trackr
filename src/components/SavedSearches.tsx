
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Star, StarOff, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface SavedSearch {
  id: string;
  name: string;
  filters: any;
  createdAt: string;
}

interface SavedSearchesProps {
  currentFilters: any;
  onLoadSearch: (filters: any) => void;
}

export function SavedSearches({ currentFilters, onLoadSearch }: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [searchName, setSearchName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('junkcar-saved-searches');
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved searches:', error);
      }
    }
  }, []);

  // Save searches to localStorage
  const saveSavedSearches = (searches: SavedSearch[]) => {
    localStorage.setItem('junkcar-saved-searches', JSON.stringify(searches));
    setSavedSearches(searches);
  };

  const saveCurrentSearch = () => {
    if (!searchName.trim()) {
      toast.error("Please enter a name for the search");
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    };

    const updatedSearches = [...savedSearches, newSearch];
    saveSavedSearches(updatedSearches);
    setSearchName("");
    setIsDialogOpen(false);
    toast.success("Search saved successfully");
  };

  const deleteSearch = (searchId: string) => {
    const updatedSearches = savedSearches.filter(search => search.id !== searchId);
    saveSavedSearches(updatedSearches);
    toast.success("Search deleted");
  };

  const loadSearch = (search: SavedSearch) => {
    onLoadSearch(search.filters);
    toast.success(`Loaded search: ${search.name}`);
  };

  const hasActiveFilters = () => {
    return (
      currentFilters.searchTerm ||
      currentFilters.status !== 'all' ||
      currentFilters.paperwork !== 'all' ||
      currentFilters.priceRange.min ||
      currentFilters.priceRange.max ||
      currentFilters.dateRange.startDate ||
      currentFilters.dateRange.endDate ||
      currentFilters.hasImages !== null ||
      currentFilters.hasDocuments !== null
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Saved Searches */}
      {savedSearches.map((search) => (
        <div key={search.id} className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSearch(search)}
            className="h-7 text-xs"
          >
            <Star className="w-3 h-3 mr-1 fill-current" />
            {search.name}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteSearch(search.id)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ))}

      {/* Save Current Search */}
      {hasActiveFilters() && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Save Search
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Current Search</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Search Name</label>
                <Input
                  placeholder="e.g., High Value Vehicles"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveCurrentSearch()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveCurrentSearch}>
                  Save Search
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
