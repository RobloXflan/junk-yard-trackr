import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Car, Plus, Edit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { VehicleDetailsDialog } from "@/components/VehicleDetailsDialog";
import { Vehicle } from "@/stores/vehicleStore";

interface VehicleInventoryProps {
  onNavigate: (page: string) => void;
}

export function VehicleInventory({ onNavigate }: VehicleInventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { vehicles, updateVehicleStatus } = useVehicleStore();

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!searchTerm.trim()) return true;
    
    const search = searchTerm.toLowerCase().trim();
    
    // Check make (handle undefined/null)
    const make = vehicle.make?.toLowerCase() || '';
    if (make.includes(search)) return true;
    
    // Check model (handle undefined/null)
    const model = vehicle.model?.toLowerCase() || '';
    if (model.includes(search)) return true;
    
    // Check year (handle undefined/null and convert to string)
    const year = vehicle.year?.toString() || '';
    if (year.includes(search)) return true;
    
    // Check vehicle ID (handle undefined/null)
    const vehicleId = vehicle.vehicleId?.toLowerCase() || '';
    if (vehicleId.includes(search)) return true;
    
    // Check license plate (handle undefined/null)
    const licensePlate = vehicle.licensePlate?.toLowerCase() || '';
    if (licensePlate.includes(search)) return true;
    
    return false;
  });

  const handleAddVehicle = () => {
    onNavigate('intake');
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleSaveVehicle = (vehicleId: string, newStatus: Vehicle['status'], soldData?: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  }) => {
    updateVehicleStatus(vehicleId, newStatus, soldData);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedVehicle(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vehicle Inventory</h2>
          <p className="text-muted-foreground">
            Manage your vehicle inventory and track status
          </p>
        </div>
        <Button className="gradient-primary" onClick={handleAddVehicle}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by make, model, year, Vehicle ID, or license plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Vehicles ({searchTerm ? `${filteredVehicles.length} of ${vehicles.length}` : vehicles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vehicles in inventory</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first vehicle to the inventory.
              </p>
              <Button className="gradient-primary" onClick={handleAddVehicle}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Vehicle
              </Button>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
              <p className="text-muted-foreground mb-4">
                No vehicles match your search criteria. Try adjusting your search terms.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Vehicle ID</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.licensePlate && `Plate: ${vehicle.licensePlate}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {vehicle.vehicleId}
                    </TableCell>
                    <TableCell>
                      {vehicle.purchasePrice ? `$${parseFloat(vehicle.purchasePrice).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {vehicle.salePrice ? `$${parseFloat(vehicle.salePrice).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        vehicle.status === 'sold' ? 'default' :
                        vehicle.status === 'yard' ? 'secondary' :
                        'outline'
                      }>
                        {vehicle.status === 'yard' ? 'In Yard' : 
                         vehicle.status === 'sold' ? 'Sold' :
                         vehicle.status === 'pick-your-part' ? 'Pick Your Part' :
                         vehicle.status === 'sa-recycling' ? 'SA Recycling' :
                         vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditVehicle(vehicle)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <VehicleDetailsDialog
        vehicle={selectedVehicle}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveVehicle}
      />
    </div>
  );
}
