
import { supabase } from '@/integrations/supabase/client';

export interface UploadedDocument {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
}

export interface Vehicle {
  id: string;
  year: string;
  make: string;
  model: string;
  vehicleId: string;
  licensePlate?: string;
  sellerName?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  titlePresent: boolean;
  billOfSale: boolean;
  destination?: string;
  buyerName?: string;
  buyerFirstName?: string;
  buyerLastName?: string;
  saleDate?: string;
  salePrice?: string;
  notes?: string;
  status: 'yard' | 'sold' | 'pick-your-part' | 'sa-recycling';
  createdAt: string;
  documents?: UploadedDocument[];
}

class VehicleStore {
  private subscribers: (() => void)[] = [];
  private vehicles: Vehicle[] = [];
  private isLoaded = false;

  constructor() {
    this.loadVehicles();
  }

  subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach(callback => callback());
  }

  // Helper function to convert documents for storage
  private serializeDocuments(documents: UploadedDocument[]) {
    return documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      size: doc.size,
      url: doc.url,
      // Don't store the File object, just the essential data
    }));
  }

  // Helper function to convert documents back from storage
  private deserializeDocuments(documentsData: any[]): UploadedDocument[] {
    if (!documentsData || !Array.isArray(documentsData)) return [];
    
    return documentsData.map(doc => ({
      id: doc.id,
      name: doc.name,
      size: doc.size,
      url: doc.url,
      // Create a placeholder File object since we can't serialize the original
      file: new File([], doc.name, { type: this.getFileTypeFromName(doc.name) })
    }));
  }

  private getFileTypeFromName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      default: return 'application/octet-stream';
    }
  }

  async loadVehicles() {
    if (this.isLoaded) return;

    try {
      console.log('Loading vehicles from Supabase...');
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading vehicles:', error);
        throw error;
      }

      this.vehicles = (data || []).map(vehicle => ({
        id: vehicle.id,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vehicleId: vehicle.vehicle_id,
        licensePlate: vehicle.license_plate,
        sellerName: vehicle.seller_name,
        purchaseDate: vehicle.purchase_date,
        purchasePrice: vehicle.purchase_price,
        titlePresent: vehicle.title_present || false,
        billOfSale: vehicle.bill_of_sale || false,
        destination: vehicle.destination,
        buyerName: vehicle.buyer_name,
        buyerFirstName: vehicle.buyer_first_name,
        buyerLastName: vehicle.buyer_last_name,
        saleDate: vehicle.sale_date,
        salePrice: vehicle.sale_price,
        notes: vehicle.notes,
        status: vehicle.status as Vehicle['status'],
        createdAt: vehicle.created_at,
        documents: this.deserializeDocuments(vehicle.documents)
      }));

      this.isLoaded = true;
      console.log('Vehicles successfully loaded from Supabase:', this.vehicles.length);
      this.notify();
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      this.vehicles = [];
      this.isLoaded = true;
      this.notify();
    }
  }

  async addVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'status'>) {
    try {
      const newVehicle = {
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        vehicle_id: vehicleData.vehicleId,
        license_plate: vehicleData.licensePlate,
        seller_name: vehicleData.sellerName,
        purchase_date: vehicleData.purchaseDate,
        purchase_price: vehicleData.purchasePrice,
        title_present: vehicleData.titlePresent,
        bill_of_sale: vehicleData.billOfSale,
        destination: vehicleData.destination,
        buyer_name: vehicleData.buyerName,
        buyer_first_name: vehicleData.buyerFirstName,
        buyer_last_name: vehicleData.buyerLastName,
        sale_date: vehicleData.saleDate,
        sale_price: vehicleData.salePrice,
        notes: vehicleData.notes,
        status: vehicleData.destination === 'sold' || vehicleData.destination === 'buyer' ? 'sold' : 'yard',
        documents: vehicleData.documents ? this.serializeDocuments(vehicleData.documents) : []
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert([newVehicle])
        .select()
        .single();

      if (error) {
        console.error('Error adding vehicle:', error);
        throw error;
      }

      const addedVehicle: Vehicle = {
        id: data.id,
        year: data.year,
        make: data.make,
        model: data.model,
        vehicleId: data.vehicle_id,
        licensePlate: data.license_plate,
        sellerName: data.seller_name,
        purchaseDate: data.purchase_date,
        purchasePrice: data.purchase_price,
        titlePresent: data.title_present || false,
        billOfSale: data.bill_of_sale || false,
        destination: data.destination,
        buyerName: data.buyer_name,
        buyerFirstName: data.buyer_first_name,
        buyerLastName: data.buyer_last_name,
        saleDate: data.sale_date,
        salePrice: data.sale_price,
        notes: data.notes,
        status: data.status as Vehicle['status'],
        createdAt: data.created_at,
        documents: this.deserializeDocuments(data.documents)
      };

      this.vehicles.unshift(addedVehicle);
      this.notify();
    } catch (error) {
      console.error('Failed to add vehicle:', error);
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
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (soldData) {
        updateData.buyer_first_name = soldData.buyerFirstName;
        updateData.buyer_last_name = soldData.buyerLastName;
        updateData.buyer_name = `${soldData.buyerFirstName} ${soldData.buyerLastName}`;
        updateData.sale_price = soldData.salePrice;
        updateData.sale_date = soldData.saleDate;
      }

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Error updating vehicle status:', error);
        throw error;
      }

      // Update local state
      this.vehicles = this.vehicles.map(vehicle => {
        if (vehicle.id === vehicleId) {
          const updatedVehicle = { ...vehicle, status: newStatus };
          if (soldData) {
            updatedVehicle.buyerFirstName = soldData.buyerFirstName;
            updatedVehicle.buyerLastName = soldData.buyerLastName;
            updatedVehicle.buyerName = `${soldData.buyerFirstName} ${soldData.buyerLastName}`;
            updatedVehicle.salePrice = soldData.salePrice;
            updatedVehicle.saleDate = soldData.saleDate;
          }
          return updatedVehicle;
        }
        return vehicle;
      });

      this.notify();
    } catch (error) {
      console.error('Failed to update vehicle status:', error);
      throw error;
    }
  }

  getVehicles(): Vehicle[] {
    return this.vehicles;
  }

  getTotalVehicles(): number {
    return this.vehicles.length;
  }

  getTotalRevenue(): number {
    return this.vehicles
      .filter(v => v.salePrice)
      .reduce((sum, v) => sum + parseFloat(v.salePrice || '0'), 0);
  }

  getPendingDMV(): number {
    return this.vehicles.filter(v => !v.titlePresent && v.status === 'yard').length;
  }

  getAverageProfit(): number {
    const soldVehicles = this.vehicles.filter(v => v.status === 'sold' && v.salePrice && v.purchasePrice);
    if (soldVehicles.length === 0) return 0;
    
    const totalProfit = soldVehicles.reduce((sum, v) => {
      const salePrice = parseFloat(v.salePrice || '0');
      const purchasePrice = parseFloat(v.purchasePrice || '0');
      return sum + (salePrice - purchasePrice);
    }, 0);
    
    return totalProfit / soldVehicles.length;
  }
}

export const vehicleStore = new VehicleStore();
