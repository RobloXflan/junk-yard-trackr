import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehicleFormData } from '@/stores/vehicleStore';

interface VehicleStore {
  vehicles: Vehicle[];
  isLoading: boolean;
  addVehicle: (vehicle: VehicleFormData) => Promise<void>;
  fetchVehicles: () => Promise<void>;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  markVehicleAsReleased: (vehicleId: string) => Promise<void>;
  unmarkVehicleAsReleased: (vehicleId: string) => Promise<void>;
}

export const useVehicleStore = create<VehicleStore>((set, get) => ({
  vehicles: [],
  isLoading: false,
  addVehicle: async (vehicle: VehicleFormData) => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('vehicles')
        .insert([
          {
            ...vehicle,
            // Convert documents to a format suitable for Supabase
            documents: vehicle.documents ? vehicle.documents.map(doc => ({
              name: doc.name,
              url: doc.url,
              size: doc.size,
              type: doc.file?.type
            })) : [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
        ])
        .select();

      if (error) {
        console.error("Error adding vehicle:", error);
        throw error;
      }

      if (data && data.length > 0) {
        const newVehicle = data[0] as Vehicle;
        set((state) => ({
          vehicles: [...state.vehicles, newVehicle],
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to add vehicle:", error);
      set({ isLoading: false });
      throw error;
    }
  },
  fetchVehicles: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching vehicles:", error);
        set({ isLoading: false });
        return;
      }

      set({ vehicles: data || [], isLoading: false });
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
      set({ isLoading: false });
    }
  },
  updateVehicle: async (id: string, updates: Partial<Vehicle>) => {
    try {
      set({ isLoading: true });
      const { error } = await supabase
        .from('vehicles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error("Error updating vehicle:", error);
        set({ isLoading: false });
        return;
      }

      set((state) => ({
        vehicles: state.vehicles.map((vehicle) =>
          vehicle.id === id ? { ...vehicle, ...updates } : vehicle
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to update vehicle:", error);
      set({ isLoading: false });
    }
  },
  deleteVehicle: async (id: string) => {
    try {
      set({ isLoading: true });
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting vehicle:", error);
        set({ isLoading: false });
        return;
      }

      set((state) => ({
        vehicles: state.vehicles.filter((vehicle) => vehicle.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to delete vehicle:", error);
      set({ isLoading: false });
    }
  },
  markVehicleAsReleased: async (vehicleId: string) => {
    try {
      console.log('Marking vehicle as released:', vehicleId);
      
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          is_released: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) {
        console.error('Error marking vehicle as released:', error);
        throw error;
      }

      // Update local state
      set(state => ({
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === vehicleId
            ? { ...vehicle, isReleased: true }
            : vehicle
        )
      }));

      console.log('Vehicle marked as released successfully');
    } catch (error) {
      console.error('Failed to mark vehicle as released:', error);
      throw error;
    }
  },
  unmarkVehicleAsReleased: async (vehicleId: string) => {
    try {
      console.log('Unmarking vehicle as released:', vehicleId);
      
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          is_released: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) {
        console.error('Error unmarking vehicle as released:', error);
        throw error;
      }

      // Update local state
      set(state => ({
        vehicles: state.vehicles.map(vehicle =>
          vehicle.id === vehicleId
            ? { ...vehicle, isReleased: false }
            : vehicle
        )
      }));

      console.log('Vehicle unmarked as released successfully');
    } catch (error) {
      console.error('Failed to unmark vehicle as released:', error);
      throw error;
    }
  },
}));
