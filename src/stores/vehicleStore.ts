import { supabase } from '@/integrations/supabase/client';

export interface UploadedDocument {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
}

export interface CarImage {
  id: string;
  url: string;
  name: string;
  size: number;
  uploadedAt: string;
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
  saRecyclingDate?: string;
  pickYourPartDate?: string;
  notes?: string;
  paperwork?: string;
  paperworkOther?: string;
  status: 'yard' | 'sold' | 'pick-your-part' | 'sa-recycling';
  isReleased?: boolean; // New field to track if a sold vehicle has been released
  createdAt: string;
  documents?: UploadedDocument[];
  carImages?: CarImage[];
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

  // Helper function to convert car images for storage
  private serializeCarImages(carImages: CarImage[]) {
    return carImages.map(img => ({
      id: img.id,
      name: img.name,
      size: img.size,
      url: img.url,
      uploadedAt: img.uploadedAt
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

  // Helper function to convert car images back from storage
  private deserializeCarImages(carImagesData: any): CarImage[] {
    if (!carImagesData || !Array.isArray(carImagesData)) {
      console.log('No car images data or not an array:', carImagesData);
      return [];
    }
    
    console.log('Deserializing car images:', carImagesData);
    
    return carImagesData.map(img => {
      console.log('Processing car image:', img);
      return {
        id: img.id,
        name: img.name,
        size: img.size,
        url: img.url,
        uploadedAt: img.uploadedAt
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
        console.log('Processing vehicle:', vehicle.id, 'documents:', vehicle.documents, 'car_images:', vehicle.car_images);
        
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
          buyerAddress: vehicle.buyer_address || undefined,
          buyerCity: vehicle.buyer_city || undefined,
          buyerState: vehicle.buyer_state || undefined,
          buyerZip: vehicle.buyer_zip || undefined,
          saleDate: vehicle.sale_date || undefined,
          salePrice: vehicle.sale_price || undefined,
          saRecyclingDate: vehicle.sa_recycling_date || undefined,
          pickYourPartDate: vehicle.pick_your_part_date || undefined,
          notes: vehicle.notes || undefined,
          paperwork: vehicle.paperwork || undefined,
          paperworkOther: vehicle.paperwork_other || undefined,
          status: (vehicle.status as Vehicle['status']) || 'yard',
          isReleased: Boolean(vehicle.is_released), // Now properly accessing the database column
          createdAt: vehicle.created_at,
          documents: this.deserializeDocuments(vehicle.documents),
          carImages: this.deserializeCarImages(vehicle.car_images)
        };
        
        console.log('Processed vehicle documents:', processedVehicle.documents);
        console.log('Processed vehicle car images:', processedVehicle.carImages);
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
      console.log('Adding vehicle with documents:', vehicleData.documents, 'and car images:', vehicleData.carImages);
      
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
        buyer_address: vehicleData.buyerAddress,
        buyer_city: vehicleData.buyerCity,
        buyer_state: vehicleData.buyerState,
        buyer_zip: vehicleData.buyerZip,
        sale_date: vehicleData.saleDate,
        sale_price: vehicleData.salePrice,
        notes: vehicleData.notes,
        paperwork: vehicleData.paperwork,
        paperwork_other: vehicleData.paperworkOther,
        status: vehicleData.destination === 'sold' || vehicleData.destination === 'buyer' ? 'sold' : 'yard',
        is_released: false, // Default new vehicles to not released
        documents: vehicleData.documents ? this.serializeDocuments(vehicleData.documents) : [],
        car_images: vehicleData.carImages ? this.serializeCarImages(vehicleData.carImages) : []
      };

      console.log('Serialized documents for storage:', newVehicle.documents);
      console.log('Serialized car images for storage:', newVehicle.car_images);

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

  async updateVehicleCarImages(vehicleId: string, carImages: CarImage[]) {
    try {
      console.log('Updating car images for vehicle:', vehicleId, carImages);
      
      const updateData = {
        car_images: this.serializeCarImages(carImages),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Error updating car images:', error);
        throw error;
      }

      console.log('Car images updated successfully');
      await this.loadVehicles();
    } catch (error) {
      console.error('Failed to update car images:', error);
      throw error;
    }
  }

  async updateVehicleStatus(vehicleId: string, newStatus: Vehicle['status'], additionalData?: {
    // For sold status
    buyerFirstName?: string;
    buyerLastName?: string;
    salePrice?: string;
    saleDate?: string;
    // For recycling status
    saRecyclingDate?: string;
    pickYourPartDate?: string;
  }) {
    // Prevent concurrent updates to the same vehicle
    if (this.updateInProgress.has(vehicleId)) {
      console.log('Update already in progress for vehicle:', vehicleId);
      return;
    }

    this.updateInProgress.add(vehicleId);

    try {
      console.log('Updating vehicle status for ID:', vehicleId, 'to status:', newStatus, 'with data:', additionalData);
      
      // Create the update object with only the specific fields for this vehicle
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Handle sold status specifically
      if (newStatus === 'sold' && additionalData) {
        updateData.buyer_first_name = additionalData.buyerFirstName;
        updateData.buyer_last_name = additionalData.buyerLastName;
        updateData.buyer_name = `${additionalData.buyerFirstName} ${additionalData.buyerLastName}`;
        updateData.sale_price = additionalData.salePrice;
        updateData.sale_date = additionalData.saleDate;
      } else if (newStatus !== 'sold') {
        // Clear sold data if status is not sold
        updateData.buyer_first_name = null;
        updateData.buyer_last_name = null;
        updateData.buyer_name = null;
        updateData.sale_price = null;
        updateData.sale_date = null;
      }

      // Handle recycling status dates
      if (newStatus === 'sa-recycling') {
        // Use provided date or current date if none provided
        if (additionalData?.saRecyclingDate) {
          updateData.sa_recycling_date = additionalData.saRecyclingDate;
        } else {
          // Only set the date if it's not already set (first time changing to this status)
          const currentVehicle = this.vehicles.find(v => v.id === vehicleId);
          if (!currentVehicle?.saRecyclingDate) {
            updateData.sa_recycling_date = new Date().toISOString();
          }
        }
        // Clear pick your part date when switching to SA recycling
        updateData.pick_your_part_date = null;
      } else if (newStatus === 'pick-your-part') {
        // Use provided date or current date if none provided
        if (additionalData?.pickYourPartDate) {
          updateData.pick_your_part_date = additionalData.pickYourPartDate;
        } else {
          // Only set the date if it's not already set (first time changing to this status)
          const currentVehicle = this.vehicles.find(v => v.id === vehicleId);
          if (!currentVehicle?.pickYourPartDate) {
            updateData.pick_your_part_date = new Date().toISOString();
          }
        }
        // Clear SA recycling date when switching to pick your part
        updateData.sa_recycling_date = null;
      } else {
        // Clear both recycling dates if status changes to yard or sold
        updateData.sa_recycling_date = null;
        updateData.pick_your_part_date = null;
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

  async markVehicleAsReleased(vehicleId: string) {
    // Prevent concurrent updates to the same vehicle
    if (this.updateInProgress.has(vehicleId)) {
      console.log('Update already in progress for vehicle:', vehicleId);
      return;
    }

    this.updateInProgress.add(vehicleId);

    try {
      console.log('Marking vehicle as released for ID:', vehicleId);
      
      const updateData = {
        is_released: true,
        updated_at: new Date().toISOString()
      };

      console.log('Sending release update to Supabase for vehicle ID:', vehicleId, updateData);

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Error marking vehicle as released:', error);
        throw error;
      }

      console.log('Vehicle marked as released successfully in database for ID:', vehicleId);

      // Reload vehicles to get the latest state from database
      await this.loadVehicles();
      
      console.log('Vehicles reloaded after release update');
    } catch (error) {
      console.error('Failed to mark vehicle as released:', error);
      throw error;
    } finally {
      // Always remove from update progress set
      this.updateInProgress.delete(vehicleId);
    }
  }

  async unmarkVehicleAsReleased(vehicleId: string) {
    // Prevent concurrent updates to the same vehicle
    if (this.updateInProgress.has(vehicleId)) {
      console.log('Update already in progress for vehicle:', vehicleId);
      return;
    }

    this.updateInProgress.add(vehicleId);

    try {
      console.log('Unmarking vehicle as released for ID:', vehicleId);
      
      const updateData = {
        is_released: false,
        updated_at: new Date().toISOString()
      };

      console.log('Sending unrelease update to Supabase for vehicle ID:', vehicleId, updateData);

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Error unmarking vehicle as released:', error);
        throw error;
      }

      console.log('Vehicle unmarked as released successfully in database for ID:', vehicleId);

      // Reload vehicles to get the latest state from database
      await this.loadVehicles();
      
      console.log('Vehicles reloaded after unrelease update');
    } catch (error) {
      console.error('Failed to unmark vehicle as released:', error);
      throw error;
    } finally {
      // Always remove from update progress set
      this.updateInProgress.delete(vehicleId);
    }
  }

  async updateVehicleDetails(vehicleId: string, updateData: Partial<Vehicle>) {
    // Prevent concurrent updates to the same vehicle
    if (this.updateInProgress.has(vehicleId)) {
      console.log('Update already in progress for vehicle:', vehicleId);
      return;
    }

    this.updateInProgress.add(vehicleId);

    try {
      console.log('Updating vehicle details for ID:', vehicleId, 'with data:', updateData);
      
      // Map the update data to database column names
      const dbUpdateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updateData.vehicleId !== undefined) dbUpdateData.vehicle_id = updateData.vehicleId;
      if (updateData.licensePlate !== undefined) dbUpdateData.license_plate = updateData.licensePlate;
      if (updateData.year !== undefined) dbUpdateData.year = updateData.year;
      if (updateData.make !== undefined) dbUpdateData.make = updateData.make;
      if (updateData.model !== undefined) dbUpdateData.model = updateData.model;
      if (updateData.sellerName !== undefined) dbUpdateData.seller_name = updateData.sellerName;
      if (updateData.purchaseDate !== undefined) dbUpdateData.purchase_date = updateData.purchaseDate;
      if (updateData.purchasePrice !== undefined) dbUpdateData.purchase_price = updateData.purchasePrice;
      if (updateData.salePrice !== undefined) dbUpdateData.sale_price = updateData.salePrice;
      if (updateData.saleDate !== undefined) dbUpdateData.sale_date = updateData.saleDate;
      if (updateData.buyerFirstName !== undefined) dbUpdateData.buyer_first_name = updateData.buyerFirstName;
      if (updateData.buyerLastName !== undefined) dbUpdateData.buyer_last_name = updateData.buyerLastName;
      if (updateData.notes !== undefined) dbUpdateData.notes = updateData.notes;

      console.log('Sending update to Supabase for vehicle ID:', vehicleId, dbUpdateData);

      // Update only this specific vehicle by ID
      const { error } = await supabase
        .from('vehicles')
        .update(dbUpdateData)
        .eq('id', vehicleId);

      if (error) {
        console.error('Error updating vehicle details:', error);
        throw error;
      }

      console.log('Vehicle details updated successfully in database for ID:', vehicleId);

      // Reload vehicles to get the latest state from database
      await this.loadVehicles();
      
      console.log('Vehicles reloaded after details update');
    } catch (error) {
      console.error('Failed to update vehicle details:', error);
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
      documents: vehicle.documents ? [...vehicle.documents] : [],
      carImages: vehicle.carImages ? [...vehicle.carImages] : []
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
