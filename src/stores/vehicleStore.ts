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

interface SerializedDocument {
  id: string;
  fileData: string; // base64 encoded file data
  url: string;
  name: string;
  size: number;
  type: string; // MIME type
}

interface SerializedVehicle extends Omit<Vehicle, 'documents'> {
  documents: SerializedDocument[];
}

class VehicleStore {
  private vehicles: Vehicle[] = [];
  private listeners: Array<() => void> = [];
  private readonly STORAGE_KEY = 'vehicle_inventory_data';

  constructor() {
    this.loadFromStorage();
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private base64ToFile(base64: string, name: string, type: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || type;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], name, { type: mime });
  }

  private async serializeVehicles(): Promise<SerializedVehicle[]> {
    const serializedVehicles: SerializedVehicle[] = [];
    
    for (const vehicle of this.vehicles) {
      const serializedDocuments: SerializedDocument[] = [];
      
      for (const doc of vehicle.documents) {
        try {
          const fileData = await this.fileToBase64(doc.file);
          serializedDocuments.push({
            id: doc.id,
            fileData,
            url: doc.url,
            name: doc.name,
            size: doc.size,
            type: doc.file.type
          });
        } catch (error) {
          console.error('Error serializing document:', error);
          // Skip this document if serialization fails
        }
      }
      
      serializedVehicles.push({
        ...vehicle,
        documents: serializedDocuments
      });
    }
    
    return serializedVehicles;
  }

  private deserializeVehicles(serializedVehicles: SerializedVehicle[]): Vehicle[] {
    return serializedVehicles.map(vehicle => {
      const documents = vehicle.documents.map(doc => {
        const file = this.base64ToFile(doc.fileData, doc.name, doc.type);
        return {
          id: doc.id,
          file,
          url: doc.url,
          name: doc.name,
          size: doc.size
        };
      });
      
      return {
        ...vehicle,
        documents
      };
    });
  }

  private async saveToStorage(): Promise<void> {
    try {
      console.log('Starting save to localStorage...');
      const serializedVehicles = await this.serializeVehicles();
      
      // Check if data is too large for localStorage
      const dataSize = JSON.stringify(serializedVehicles).length;
      console.log('Data size to save:', dataSize, 'characters');
      
      if (dataSize > 5000000) { // 5MB limit
        console.warn('Data size exceeds recommended localStorage limit');
        // Save without documents if too large
        const vehiclesWithoutDocs = serializedVehicles.map(v => ({
          ...v,
          documents: []
        }));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(vehiclesWithoutDocs));
        console.log('Vehicles saved to localStorage without documents due to size:', vehiclesWithoutDocs.length);
      } else {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializedVehicles));
        console.log('Vehicles successfully saved to localStorage:', serializedVehicles.length);
      }
    } catch (error) {
      console.error('Error saving vehicles to localStorage:', error);
      if (error instanceof DOMException && error.code === 22) {
        console.error('localStorage quota exceeded');
      }
    }
  }

  private loadFromStorage(): void {
    try {
      console.log('Loading vehicles from localStorage...');
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const serializedVehicles: SerializedVehicle[] = JSON.parse(stored);
        this.vehicles = this.deserializeVehicles(serializedVehicles);
        console.log('Vehicles successfully loaded from localStorage:', this.vehicles.length);
      } else {
        console.log('No vehicles found in localStorage');
      }
    } catch (error) {
      console.error('Error loading vehicles from localStorage:', error);
      this.vehicles = [];
    }
  }

  async addVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'status'>) {
    const vehicle: Vehicle = {
      ...vehicleData,
      id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: this.getStatusFromDestination(vehicleData.destination)
    };
    
    console.log('Adding vehicle to store:', vehicle.id);
    this.vehicles.push(vehicle);
    
    // Await the save operation
    await this.saveToStorage();
    this.notifyListeners();
    console.log('Vehicle added and saved successfully:', vehicle.id);
  }

  async updateVehicleStatus(vehicleId: string, newStatus: Vehicle['status'], soldData?: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  }) {
    const vehicleIndex = this.vehicles.findIndex(v => v.id === vehicleId);
    if (vehicleIndex !== -1) {
      console.log('Updating vehicle status:', vehicleId, newStatus);
      this.vehicles[vehicleIndex] = {
        ...this.vehicles[vehicleIndex],
        status: newStatus,
        ...(soldData && {
          buyerFirstName: soldData.buyerFirstName,
          buyerLastName: soldData.buyerLastName,
          salePrice: soldData.salePrice,
          saleDate: soldData.saleDate,
          buyerName: `${soldData.buyerFirstName} ${soldData.buyerLastName}`
        })
      };
      
      // Await the save operation
      await this.saveToStorage();
      this.notifyListeners();
      console.log('Vehicle status updated and saved successfully:', vehicleId, newStatus);
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
