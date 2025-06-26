import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, CarImage } from '@/stores/vehicleStore';

interface PaginatedVehicleData {
  vehicles: Vehicle[];
  totalCount: number;
  hasMore: boolean;
}

// Vehicle IDs that view-only users are allowed to see (specific vehicles from screenshot)
const ALLOWED_VEHICLE_IDS_FOR_VIEW_ONLY = [
  '10905', '83002', '14202', '56957', '34536', '03762', '22964', '63753', '79967'
];

// Cutoff date - vehicles created after this date will be shown to view-only users
// This represents when the new policy started (vehicles added by America Main going forward)
const VIEW_ONLY_CUTOFF_DATE = '2025-06-17T00:00:00Z'; // Today's date as the cutoff

export function useVehicleStorePaginated(isViewOnly: boolean = false, username: string = '') {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const ITEMS_PER_PAGE = 50;

  // Helper function to check if a vehicle should be visible to view-only users
  const isVehicleAllowedForViewOnly = (vehicleId: string, createdAt: string): boolean => {
    // If it's one of the specific allowed vehicle IDs, always show it
    if (ALLOWED_VEHICLE_IDS_FOR_VIEW_ONLY.includes(vehicleId)) {
      return true;
    }
    
    // For new vehicles, check if they were created after the cutoff date
    const vehicleCreatedAt = new Date(createdAt);
    const cutoffDate = new Date(VIEW_ONLY_CUTOFF_DATE);
    
    return vehicleCreatedAt >= cutoffDate;
  };

  // Helper function to properly deserialize car images from database
  const deserializeCarImages = (carImagesData: any): CarImage[] => {
    if (!carImagesData || !Array.isArray(carImagesData)) {
      return [];
    }
    
    return carImagesData.map(img => ({
      id: img.id || `img_${Date.now()}`,
      name: img.name || 'Untitled Image',
      size: img.size || 0,
      url: img.url || '',
      uploadedAt: img.uploadedAt || new Date().toISOString()
    }));
  };

  const loadVehicles = async (page: number = 1, search: string = "", append: boolean = false) => {
    setIsLoading(true);
    try {
      const isSearching = search.trim().length > 0;
      const offset = isSearching ? 0 : (page - 1) * ITEMS_PER_PAGE;
      const limit = isSearching ? 1000 : ITEMS_PER_PAGE;
      
      console.log('Loading vehicles with search term:', search, 'isSearching:', isSearching);
      
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
          buyer_address,
          buyer_city,
          buyer_state,
          buyer_zip,
          sale_date,
          sale_price,
          notes,
          paperwork,
          paperwork_other,
          status,
          is_released,
          car_images,
          created_at,
          updated_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (isSearching) {
        const searchPattern = `%${search.toLowerCase()}%`;
        console.log('Applying search pattern:', searchPattern);
        
        query = query.or(`make.ilike.${searchPattern},model.ilike.${searchPattern},year.ilike.${searchPattern},vehicle_id.ilike.${searchPattern},license_plate.ilike.${searchPattern}`);
      }

      if (!isSearching) {
        query = query.range(offset, offset + ITEMS_PER_PAGE - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error loading vehicles:', error);
        throw error;
      }

      console.log('Search results:', data?.length, 'vehicles found');

      let transformedVehicles: Vehicle[] = (data || []).map(vehicle => ({
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
        buyerAddress: vehicle.buyer_address || undefined,
        buyerCity: vehicle.buyer_city || undefined,
        buyerState: vehicle.buyer_state || undefined,
        buyerZip: vehicle.buyer_zip || undefined,
        saleDate: vehicle.sale_date || undefined,
        salePrice: vehicle.sale_price || undefined,
        notes: vehicle.notes || undefined,
        paperwork: vehicle.paperwork || undefined,
        paperworkOther: vehicle.paperwork_other || undefined,
        status: (vehicle.status as Vehicle['status']) || 'yard',
        isReleased: Boolean(vehicle.is_released),
        carImages: deserializeCarImages(vehicle.car_images),
        createdAt: vehicle.created_at,
        documents: []
      }));

      // Apply filtering for view-only users (not America Main)
      if (isViewOnly && username !== 'America Main') {
        console.log('Applying view-only filtering for user:', username);
        console.log('Filtering with allowed IDs:', ALLOWED_VEHICLE_IDS_FOR_VIEW_ONLY);
        console.log('Cutoff date:', VIEW_ONLY_CUTOFF_DATE);
        
        transformedVehicles = transformedVehicles.filter(vehicle => {
          const isAllowed = isVehicleAllowedForViewOnly(vehicle.vehicleId, vehicle.createdAt);
          if (isAllowed) {
            console.log('Vehicle allowed:', vehicle.vehicleId, 'created:', vehicle.createdAt);
          }
          return isAllowed;
        });
        
        console.log('Filtered vehicles count:', transformedVehicles.length);
      }

      if (append && !isSearching) {
        setVehicles(prev => [...prev, ...transformedVehicles]);
      } else {
        setVehicles(transformedVehicles);
      }
      
      // For view-only users, adjust the total count based on filtering
      if (isViewOnly && username !== 'America Main') {
        setTotalCount(transformedVehicles.length);
      } else {
        setTotalCount(count || 0);
      }
      
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

  const loadVehicleDocuments = async (vehicleId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('documents')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      
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

  const updateVehiclePaperwork = async (vehicleId: string, newPaperwork: string) => {
    try {
      const updateData: any = {
        paperwork: newPaperwork,
        updated_at: new Date().toISOString()
      };

      if (newPaperwork !== 'other') {
        updateData.paperwork_other = null;
      }

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) throw error;

      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === vehicleId 
          ? { 
              ...vehicle, 
              paperwork: newPaperwork,
              paperworkOther: newPaperwork !== 'other' ? undefined : vehicle.paperworkOther
            }
          : vehicle
      ));

    } catch (error) {
      console.error('Failed to update vehicle paperwork:', error);
      throw error;
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadVehicles(1, searchTerm, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, isViewOnly, username]);

  // Initial load
  useEffect(() => {
    loadVehicles(1, '', false);
  }, [isViewOnly, username]);

  const loadMore = () => {
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
    buyerAddress?: string;
    buyerCity?: string;
    buyerState?: string;
    buyerZip?: string;
  }) => {
    console.log('updateVehicleStatus called with:', { vehicleId, newStatus, soldData });
    
    // Optimistic update - update UI immediately
    setVehicles(prevVehicles => {
      return prevVehicles.map(vehicle => {
        if (vehicle.id === vehicleId) {
          const updatedVehicle = { ...vehicle, status: newStatus };
          
          if (newStatus === 'sold' && soldData) {
            updatedVehicle.buyerFirstName = soldData.buyerFirstName;
            updatedVehicle.buyerLastName = soldData.buyerLastName;
            updatedVehicle.buyerName = `${soldData.buyerFirstName} ${soldData.buyerLastName}`;
            updatedVehicle.salePrice = soldData.salePrice;
            updatedVehicle.saleDate = soldData.saleDate;
            updatedVehicle.buyerAddress = soldData.buyerAddress;
            updatedVehicle.buyerCity = soldData.buyerCity;
            updatedVehicle.buyerState = soldData.buyerState;
            updatedVehicle.buyerZip = soldData.buyerZip;
          } else if (newStatus !== 'sold') {
            // Clear sold data if status is not sold
            updatedVehicle.buyerFirstName = undefined;
            updatedVehicle.buyerLastName = undefined;
            updatedVehicle.buyerName = undefined;
            updatedVehicle.salePrice = undefined;
            updatedVehicle.saleDate = undefined;
            updatedVehicle.buyerAddress = undefined;
            updatedVehicle.buyerCity = undefined;
            updatedVehicle.buyerState = undefined;
            updatedVehicle.buyerZip = undefined;
          }
          
          return updatedVehicle;
        }
        return vehicle;
      });
    });

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
        
        // Include buyer address information
        if (soldData.buyerAddress) updateData.buyer_address = soldData.buyerAddress;
        if (soldData.buyerCity) updateData.buyer_city = soldData.buyerCity;
        if (soldData.buyerState) updateData.buyer_state = soldData.buyerState;
        if (soldData.buyerZip) updateData.buyer_zip = soldData.buyerZip;
      } else if (newStatus !== 'sold') {
        updateData.buyer_first_name = null;
        updateData.buyer_last_name = null;
        updateData.buyer_name = null;
        updateData.sale_price = null;
        updateData.sale_date = null;
        updateData.buyer_address = null;
        updateData.buyer_city = null;
        updateData.buyer_state = null;
        updateData.buyer_zip = null;
      }

      console.log('Updating database with:', updateData);

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Database update failed:', error);
        // Revert optimistic update on failure
        await refreshVehicles();
        throw error;
      }

      console.log('Database update successful');
      
      // Force refresh to ensure UI is in sync with database
      await refreshVehicles();

    } catch (error) {
      console.error('Failed to update vehicle status:', error);
      throw error;
    }
  };

  const refreshVehicles = async () => {
    console.log('Refreshing vehicles data...');
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
    loadVehicleDocuments,
    updateVehiclePaperwork
  };
}
