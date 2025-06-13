
import { useState, useEffect } from 'react';
import { vehicleStore, Vehicle } from '@/stores/vehicleStore';

export function useVehicleStore() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

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
    addVehicle: async (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'status'>) => {
      try {
        await vehicleStore.addVehicle(vehicleData);
      } catch (error) {
        console.error('Error adding vehicle:', error);
        throw error;
      }
    },
    updateVehicleStatus: async (vehicleId: string, newStatus: Vehicle['status'], soldData?: {
      buyerFirstName: string;
      buyerLastName: string;
      salePrice: string;
      saleDate: string;
    }) => {
      try {
        await vehicleStore.updateVehicleStatus(vehicleId, newStatus, soldData);
      } catch (error) {
        console.error('Error updating vehicle status:', error);
        throw error;
      }
    },
    getTotalVehicles: vehicleStore.getTotalVehicles.bind(vehicleStore),
    getTotalRevenue: vehicleStore.getTotalRevenue.bind(vehicleStore),
    getPendingDMV: vehicleStore.getPendingDMV.bind(vehicleStore),
    getAverageProfit: vehicleStore.getAverageProfit.bind(vehicleStore),
  };
}
