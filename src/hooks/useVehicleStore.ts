
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
    addVehicle: vehicleStore.addVehicle.bind(vehicleStore),
    updateVehicleStatus: (vehicleId: string, newStatus: Vehicle['status'], soldData?: {
      buyerFirstName: string;
      buyerLastName: string;
      salePrice: string;
      saleDate: string;
    }) => vehicleStore.updateVehicleStatus(vehicleId, newStatus, soldData),
    getTotalVehicles: vehicleStore.getTotalVehicles.bind(vehicleStore),
    getTotalRevenue: vehicleStore.getTotalRevenue.bind(vehicleStore),
    getPendingDMV: vehicleStore.getPendingDMV.bind(vehicleStore),
    getAverageProfit: vehicleStore.getAverageProfit.bind(vehicleStore),
  };
}
