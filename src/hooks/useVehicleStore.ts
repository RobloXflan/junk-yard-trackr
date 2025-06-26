

import { useState, useEffect } from 'react';
import { vehicleStore, Vehicle, CarImage } from '@/stores/vehicleStore';

export function useVehicleStore() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const updateVehicles = () => {
      setVehicles(vehicleStore.getVehicles());
    };

    // Initial load
    updateVehicles();

    // Subscribe to changes
    const unsubscribe = vehicleStore.subscribe(updateVehicles);

    return unsubscribe;
  }, []);

  return {
    vehicles,
    isLoading,
    addVehicle: async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'status'>) => {
      setIsLoading(true);
      try {
        await vehicleStore.addVehicle(vehicleData);
      } catch (error) {
        console.error('Error adding vehicle:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    updateVehicleStatus: async (vehicleId: string, newStatus: Vehicle['status'], soldData?: {
      buyerFirstName: string;
      buyerLastName: string;
      salePrice: string;
      saleDate: string;
    }) => {
      setIsLoading(true);
      try {
        await vehicleStore.updateVehicleStatus(vehicleId, newStatus, soldData);
      } catch (error) {
        console.error('Error updating vehicle status:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    markVehicleAsReleased: async (vehicleId: string) => {
      setIsLoading(true);
      try {
        await vehicleStore.markVehicleAsReleased(vehicleId);
      } catch (error) {
        console.error('Error marking vehicle as released:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    unmarkVehicleAsReleased: async (vehicleId: string) => {
      setIsLoading(true);
      try {
        await vehicleStore.unmarkVehicleAsReleased(vehicleId);
      } catch (error) {
        console.error('Error unmarking vehicle as released:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    updateVehicleDetails: async (vehicleId: string, updateData: Partial<Vehicle>) => {
      setIsLoading(true);
      try {
        await vehicleStore.updateVehicleDetails(vehicleId, updateData);
      } catch (error) {
        console.error('Error updating vehicle details:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    updateVehicleCarImages: async (vehicleId: string, carImages: CarImage[]) => {
      setIsLoading(true);
      try {
        await vehicleStore.updateVehicleCarImages(vehicleId, carImages);
      } catch (error) {
        console.error('Error updating car images:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    refreshVehicles: async () => {
      setIsLoading(true);
      try {
        await vehicleStore.refreshVehicles();
      } catch (error) {
        console.error('Error refreshing vehicles:', error);
      } finally {
        setIsLoading(false);
      }
    },
    getTotalVehicles: vehicleStore.getTotalVehicles.bind(vehicleStore),
    getTotalRevenue: vehicleStore.getTotalRevenue.bind(vehicleStore),
    getPendingDMV: vehicleStore.getPendingDMV.bind(vehicleStore),
    getAverageProfit: vehicleStore.getAverageProfit.bind(vehicleStore),
    getVehiclesAddedToday: vehicleStore.getVehiclesAddedToday.bind(vehicleStore),
  };
}

