
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
  saleDate: string;
  salePrice: string;
  notes: string;
  documents: Array<{
    id: string;
    file: File;
    url: string;
  }>;
  status: 'yard' | 'sold' | 'pick-your-part' | 'sa-recycling' | 'available';
  createdAt: string;
}

class VehicleStore {
  private vehicles: Vehicle[] = [];
  private listeners: Array<() => void> = [];

  addVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'status'>) {
    const vehicle: Vehicle = {
      ...vehicleData,
      id: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: this.getStatusFromDestination(vehicleData.destination)
    };
    
    this.vehicles.push(vehicle);
    this.notifyListeners();
    console.log('Vehicle added to store:', vehicle);
  }

  private getStatusFromDestination(destination: string): Vehicle['status'] {
    switch (destination) {
      case 'buyer':
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
