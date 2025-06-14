
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle } from '@/stores/vehicleStore';

interface PaginatedVehicleData {
  vehicles: Vehicle[];
  totalCount: number;
  hasMore: boolean;
}

export function useVehicleStorePaginated() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const ITEMS_PER_PAGE = 50;

  const loadVehicles = async (page: number = 1, search: string = "", append: boolean = false) => {
    setIsLoading(true);
    try {
      // When searching, load all results without pagination
      const isSearching = search.trim().length > 0;
      const offset = isSearching ? 0 : (page - 1) * ITEMS_PER_PAGE;
      const limit = isSearching ? 1000 : ITEMS_PER_PAGE; // Use a high limit for search results
      
      console.log('Loading vehicles with search term:', search, 'isSearching:', isSearching);
      
      // Build the query
      let query = supabase
        .from('vehicles')
        .select(`
          id,
          year,
          make,
          model,
          vehicle_id,
          license_plate,
          seller_name,
          purchase_date,
          purchase_price,
          title_present,
          bill_of_sale,
          destination,
          buyer_name,
          buyer_first_name,
          buyer_last_name,
          sale_date,
          sale_price,
          notes,
          paperwork,
          paperwork_other,
          status,
          created_at,
          updated_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter if provided
      if (isSearching) {
        const searchPattern = `%${search.toLowerCase()}%`;
        console.log('Applying search pattern:', searchPattern);
        
        // Fix the search query to use proper single-line syntax
        query = query.or(`make.ilike.${searchPattern},model.ilike.${searchPattern},year.ilike.${searchPattern},vehicle_id.ilike.${searchPattern},license_plate.ilike.${searchPattern}`);
      }

      // Apply pagination only when not searching
      if (!isSearching) {
        query = query.range(offset, offset + ITEMS_PER_PAGE - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error loading vehicles:', error);
        throw error;
      }

      console.log('Search results:', data?.length, 'vehicles found');

      // Transform data to match Vehicle interface (excluding documents for performance)
      const transformedVehicles: Vehicle[] = (data || []).map(vehicle => ({
        id: vehicle.id,
        year: vehicle.year || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        vehicleId: vehicle.vehicle_id || '',
        licensePlate: vehicle.license_plate || undefined,
        sellerName: vehicle.seller_name || undefined,
        purchaseDate: vehicle.purchase_date || undefined,
        purchasePrice: vehicle.purchase_price || undefined,
        titlePresent: Boolean(vehicle.title_present),
        billOfSale: Boolean(vehicle.bill_of_sale),
        destination: vehicle.destination || undefined,
        buyerName: vehicle.buyer_name || undefined,
        buyerFirstName: vehicle.buyer_first_name || undefined,
        buyerLastName: vehicle.buyer_last_name || undefined,
        saleDate: vehicle.sale_date || undefined,
        salePrice: vehicle.sale_price || undefined,
        notes: vehicle.notes || undefined,
        paperwork: vehicle.paperwork || undefined,
        paperworkOther: vehicle.paperwork_other || undefined,
        status: (vehicle.status as Vehicle['status']) || 'yard',
        createdAt: vehicle.created_at,
        documents: [] // Load documents separately when needed
      }));

      if (append && !isSearching) {
        setVehicles(prev => [...prev, ...transformedVehicles]);
      } else {
        setVehicles(transformedVehicles);
      }
      
      setTotalCount(count || 0);
      
      // Update hasMore logic - when searching, we load all results so no more to load
      if (isSearching) {
        setHasMore(false);
      } else {
        setHasMore(transformedVehicles.length === ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      if (!append) {
        setVehicles([]);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load documents for a specific vehicle when needed
  const loadVehicleDocuments = async (vehicleId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('documents')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      
      // Safely handle the documents field - it could be null, string, or array
      const documents = data?.documents;
      if (Array.isArray(documents)) {
        return documents;
      } else if (typeof documents === 'string') {
        try {
          return JSON.parse(documents);
        } catch {
          return [];
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading vehicle documents:', error);
      return [];
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadVehicles(1, searchTerm, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    loadVehicles(1, '', false);
  }, []);

  const loadMore = () => {
    // Only allow load more when not searching and there are more items
    if (!isLoading && hasMore && !searchTerm.trim()) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadVehicles(nextPage, searchTerm, true);
    }
  };

  const updateVehicleStatus = async (vehicleId: string, newStatus: Vehicle['status'], soldData?: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  }) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'sold' && soldData) {
        updateData.buyer_first_name = soldData.buyerFirstName;
        updateData.buyer_last_name = soldData.buyerLastName;
        updateData.buyer_name = `${soldData.buyerFirstName} ${soldData.buyerLastName}`;
        updateData.sale_price = soldData.salePrice;
        updateData.sale_date = soldData.saleDate;
      } else if (newStatus !== 'sold') {
        updateData.buyer_first_name = null;
        updateData.buyer_last_name = null;
        updateData.buyer_name = null;
        updateData.sale_price = null;
        updateData.sale_date = null;
      }

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) throw error;

      // Update local state
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === vehicleId 
          ? { 
              ...vehicle, 
              status: newStatus,
              ...(soldData && {
                buyerFirstName: soldData.buyerFirstName,
                buyerLastName: soldData.buyerLastName,
                salePrice: soldData.salePrice,
                saleDate: soldData.saleDate
              })
            }
          : vehicle
      ));

    } catch (error) {
      console.error('Failed to update vehicle status:', error);
      throw error;
    }
  };

  const refreshVehicles = async () => {
    setCurrentPage(1);
    await loadVehicles(1, searchTerm, false);
  };

  return {
    vehicles,
    totalCount,
    isLoading,
    hasMore,
    searchTerm,
    setSearchTerm,
    loadMore,
    updateVehicleStatus,
    refreshVehicles,
    loadVehicleDocuments
  };
}
