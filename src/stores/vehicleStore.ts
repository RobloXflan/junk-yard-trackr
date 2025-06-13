
import { supabase } from '@/integrations/supabase/client';

interface Vehicle {
  id: string;
  year: string;
  make: string;
  model: string;
  vehicleId: string;
  licensePlate: string;
  sellerName: string;
  purchaseDate: string;
  purchasePrice: string;
  titlePresent: boolean;
  billOfSale: boolean;
  destination: string;
  buyerName: string;
  buyerFirstName: string;
  buyerLastName: string;
  saleDate: string;
  salePrice: string;
  notes: string;
  documents: Array<{
    id: string;
    file: File;
    url: string;
    name: string;
    size: number;
  }>;
  status: 'yard' | 'sold' | 'pick-your-part' | 'sa-recycling' | 'available';
  createdAt: string;
}

class VehicleStore {
  private vehicles: Vehicle[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromSupabase();
  }

  private async loadFromSupabase(): Promise<void> {
    try {
      console.log('Loading vehicles from Supabase...');
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading vehicles from Supabase:', error);
        return;
      }

      // Convert Supabase data to local Vehicle format
      this.vehicles = (data || []).map(vehicle => ({
        id: vehicle.id,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vehicleId: vehicle.vehicle_id,
        licensePlate: vehicle.license_plate || '',
        sellerName: vehicle.seller_name || '',
        purchaseDate: vehicle.purchase_date || '',
        purchasePrice: vehicle.purchase_price || '',
        titlePresent: vehicle.title_present || false,
        billOfSale: vehicle.bill_of_sale || false,
        destination: vehicle.destination || '',
        buyerName: vehicle.buyer_name || '',
        buyerFirstName: vehicle.buyer_first_name || '',
        buyerLastName: vehicle.buyer_last_name || '',
        saleDate: vehicle.sale_date || '',
        salePrice: vehicle.sale_price || '',
        notes: vehicle.notes || '',
        documents: [], // Documents will be handled separately
        status: vehicle.status as Vehicle['status'] || 'yard',
        createdAt: vehicle.created_at,
      }));

      console.log('Vehicles successfully loaded from Supabase:', this.vehicles.length);
      this.notifyListeners();
    } catch (error) {
      console.error('Error loading vehicles from Supabase:', error);
    }
  }

  async addVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'status'>) {
    try {
      console.log('Adding vehicle to Supabase...');
      
      const vehicleToInsert = {
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        vehicle_id: vehicleData.vehicleId,
        license_plate: vehicleData.licensePlate || null,
        seller_name: vehicleData.sellerName || null,
        purchase_date: vehicleData.purchaseDate || null,
        purchase_price: vehicleData.purchasePrice || null,
        title_present: vehicleData.titlePresent,
        bill_of_sale: vehicleData.billOfSale,
        destination: vehicleData.destination || null,
        buyer_name: vehicleData.buyerName || null,
        buyer_first_name: vehicleData.buyerFirstName || null,
        buyer_last_name: vehicleData.buyerLastName || null,
        sale_date: vehicleData.saleDate || null,
        sale_price: vehicleData.salePrice || null,
        notes: vehicleData.notes || null,
        status: this.getStatusFromDestination(vehicleData.destination)
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleToInsert])
        .select()
        .single();

      if (error) {
        console.error('Error adding vehicle to Supabase:', error);
        throw error;
      }

      console.log('Vehicle added to Supabase successfully:', data.id);
      
      // Reload from Supabase to get the updated list
      await this.loadFromSupabase();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  }

  async updateVehicleStatus(vehicleId: string, newStatus: Vehicle['status'], soldData?: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  }) {
    try {
      console.log('Updating vehicle status in Supabase:', vehicleId, newStatus);
      
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (soldData) {
        updateData.buyer_first_name = soldData.buyerFirstName;
        updateData.buyer_last_name = soldData.buyerLastName;
        updateData.sale_price = soldData.salePrice;
        updateData.sale_date = soldData.saleDate;
        updateData.buyer_name = `${soldData.buyerFirstName} ${soldData.buyerLastName}`;
      }

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Error updating vehicle status in Supabase:', error);
        throw error;
      }

      console.log('Vehicle status updated in Supabase successfully:', vehicleId, newStatus);
      
      // Reload from Supabase to get the updated data
      await this.loadFromSupabase();
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw error;
    }
  }

  private getStatusFromDestination(destination: string): Vehicle['status'] {
    switch (destination) {
      case 'buyer':
      case 'sold':
        return 'sold';
      case 'pick-your-part':
        return 'pick-your-part';
      case 'sa-recycling':
        return 'sa-recycling';
      case 'yard':
      default:
        return 'yard';
    }
  }

  getVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  getTotalVehicles(): number {
    return this.vehicles.length;
  }

  getTotalRevenue(): number {
    return this.vehicles
      .filter(v => v.status === 'sold' && v.salePrice)
      .reduce((total, v) => total + parseFloat(v.salePrice), 0);
  }

  getPendingDMV(): number {
    return this.vehicles.filter(v => v.status === 'sold' && !v.titlePresent).length;
  }

  getAverageProfit(): number {
    const soldVehicles = this.vehicles.filter(v => v.status === 'sold' && v.salePrice && v.purchasePrice);
    if (soldVehicles.length === 0) return 0;
    
    const totalProfit = soldVehicles.reduce((total, v) => {
      const profit = parseFloat(v.salePrice) - parseFloat(v.purchasePrice);
      return total + profit;
    }, 0);
    
    return totalProfit / soldVehicles.length;
  }
}

export const vehicleStore = new VehicleStore();
export type { Vehicle };
