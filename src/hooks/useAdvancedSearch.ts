
import { useState, useEffect, useMemo } from 'react';
import { Vehicle } from '@/stores/vehicleStore';

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

export function useAdvancedSearch(vehicles: Vehicle[]) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    status: 'all',
    paperwork: 'all',
    priceRange: { min: '', max: '' },
    dateRange: { startDate: '', endDate: '' },
    hasImages: null,
    hasDocuments: null,
  });

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const searchableText = [
          vehicle.make,
          vehicle.model,
          vehicle.year,
          vehicle.vehicleId,
          vehicle.licensePlate,
          vehicle.buyerFirstName,
          vehicle.buyerLastName,
          vehicle.sellerName,
          `${vehicle.buyerFirstName} ${vehicle.buyerLastName}`.trim()
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (filters.status !== 'all' && vehicle.status !== filters.status) {
        return false;
      }

      // Paperwork filter
      if (filters.paperwork !== 'all') {
        if (filters.paperwork === 'no-title' && vehicle.titlePresent) {
          return false;
        }
        if (filters.paperwork !== 'no-title' && vehicle.paperwork !== filters.paperwork) {
          return false;
        }
      }

      // Price range filter
      if (filters.priceRange.min || filters.priceRange.max) {
        const price = parseFloat(vehicle.salePrice || vehicle.purchasePrice || '0');
        const minPrice = filters.priceRange.min ? parseFloat(filters.priceRange.min) : 0;
        const maxPrice = filters.priceRange.max ? parseFloat(filters.priceRange.max) : Infinity;
        
        if (price < minPrice || price > maxPrice) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange.startDate || filters.dateRange.endDate) {
        const vehicleDate = new Date(vehicle.createdAt);
        const startDate = filters.dateRange.startDate ? new Date(filters.dateRange.startDate) : null;
        const endDate = filters.dateRange.endDate ? new Date(filters.dateRange.endDate + 'T23:59:59') : null;
        
        if (startDate && vehicleDate < startDate) {
          return false;
        }
        if (endDate && vehicleDate > endDate) {
          return false;
        }
      }

      // Images filter
      if (filters.hasImages !== null) {
        const hasImages = vehicle.carImages && vehicle.carImages.length > 0;
        if (filters.hasImages !== hasImages) {
          return false;
        }
      }

      // Documents filter
      if (filters.hasDocuments !== null) {
        const hasDocuments = vehicle.documents && vehicle.documents.length > 0;
        if (filters.hasDocuments !== hasDocuments) {
          return false;
        }
      }

      return true;
    });
  }, [vehicles, filters]);

  return {
    filters,
    setFilters,
    filteredVehicles,
    totalResults: filteredVehicles.length
  };
}
