
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
  buyerAddress?: string;
  buyerCity?: string;
  buyerState?: string;
  buyerZip?: string;
  saleDate?: string;
  salePrice?: string;
  notes?: string;
  paperwork?: string;
  paperworkOther?: string;
  status: 'yard' | 'sold' | 'pick-your-part' | 'sa-recycling';
  createdAt: string;
  documents?: UploadedDocument[];
}

class VehicleStore {
  private subscribers: (() => void)[] = [];
  private vehicles: Vehicle[] = [];
  private isLoaded = false;
  private updateInProgress = new Set<string>(); // Track which vehicles are being updated

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
  private deserializeDocuments(documentsData: any): UploadedDocument[] {
    if (!documentsData || !Array.isArray(documentsData)) {
      console.log('No documents data or not an array:', documentsData);
      return [];
    }
    
    console.log('Deserializing documents:', documentsData);
    
    return documentsData.map(doc => {
      console.log('Processing document:', doc);
      return {
        id: doc.id,
        name: doc.name,
        size: doc.size,
        url: doc.url,
        // Create a placeholder File object since we can't serialize the original
        file: new File([], doc.name, { type: this.getFileTypeFromName(doc.name) })
      };
    });
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

      // Create completely new vehicle objects to prevent any reference sharing
      this.vehicles = (data || []).map(vehicle => {
        console.log('Processing vehicle:', vehicle.id, 'documents:', vehicle.documents);
        
        const processedVehicle = {
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
          documents: this.deserializeDocuments(vehicle.documents)
        };
        
        console.log('Processed vehicle documents:', processedVehicle.documents);
        return processedVehicle;
      });

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
      console.log('Adding vehicle with documents:', vehicleData.documents);
      
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
        paperwork: vehicleData.paperwork,
        paperwork_other: vehicleData.paperworkOther,
        status: vehicleData.destination === 'sold' || vehicleData.destination === 'buyer' ? 'sold' : 'yard',
        documents: vehicleData.documents ? this.serializeDocuments(vehicleData.documents) : []
      };

      console.log('Serialized documents for storage:', newVehicle.documents);

      const { data, error } = await supabase
        .from('vehicles')
        .insert([newVehicle])
        .select()
        .single();

      if (error) {
        console.error('Error adding vehicle:', error);
        throw error;
      }

      console.log('Vehicle added to database:', data);

      // Reload all vehicles from database to ensure consistency
      await this.loadVehicles();
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
    // Prevent concurrent updates to the same vehicle
    if (this.updateInProgress.has(vehicleId)) {
      console.log('Update already in progress for vehicle:', vehicleId);
      return;
    }

    this.updateInProgress.add(vehicleId);

    try {
      console.log('Updating vehicle status for ID:', vehicleId, 'to status:', newStatus, 'with data:', soldData);
      
      // Create the update object with only the specific fields for this vehicle
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Handle sold status specifically
      if (newStatus === 'sold' && soldData) {
        updateData.buyer_first_name = soldData.buyerFirstName;
        updateData.buyer_last_name = soldData.buyerLastName;
        updateData.buyer_name = `${soldData.buyerFirstName} ${soldData.buyerLastName}`;
        updateData.sale_price = soldData.salePrice;
        updateData.sale_date = soldData.saleDate;
      } else if (newStatus !== 'sold') {
        // Clear sold data if status is not sold
        updateData.buyer_first_name = null;
        updateData.buyer_last_name = null;
        updateData.buyer_name = null;
        updateData.sale_price = null;
        updateData.sale_date = null;
      }

      console.log('Sending update to Supabase for vehicle ID:', vehicleId, updateData);

      // Update only this specific vehicle by ID
      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Error updating vehicle status:', error);
        throw error;
      }

      console.log('Vehicle status updated successfully in database for ID:', vehicleId);

      // Reload vehicles to get the latest state from database
      await this.loadVehicles();
      
      console.log('Vehicles reloaded after status update');
    } catch (error) {
      console.error('Failed to update vehicle status:', error);
      throw error;
    } finally {
      // Always remove from update progress set
      this.updateInProgress.delete(vehicleId);
    }
  }

  // Force refresh from database - useful for manual sync
  async refreshVehicles() {
    console.log('Manually refreshing vehicles from database...');
    await this.loadVehicles();
  }

  getVehicles(): Vehicle[] {
    // Return a deep copy to prevent external modifications
    return this.vehicles.map(vehicle => ({
      ...vehicle,
      documents: vehicle.documents ? [...vehicle.documents] : []
    }));
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

  getVehiclesAddedToday(): number {
    const today = new Date().toDateString();
    return this.vehicles.filter(vehicle => {
      const vehicleDate = new Date(vehicle.createdAt).toDateString();
      return vehicleDate === today;
    }).length;
  }
}

export const vehicleStore = new VehicleStore();
