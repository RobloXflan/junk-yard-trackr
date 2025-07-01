
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Car, Plus, Edit, RefreshCw, Calendar } from "lucide-react";
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
import { VehicleIntakeDialog } from "@/components/VehicleIntakeDialog";
import { SoldDialog } from "@/components/forms/SoldDialog";
import { Vehicle } from "@/stores/vehicleStore";
import { toast } from "sonner";

interface VehicleInventoryProps {
  onNavigate: (page: string) => void;
}

export function VehicleInventory({ onNavigate }: VehicleInventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isIntakeDialogOpen, setIsIntakeDialogOpen] = useState(false);
  const [isSoldDialogOpen, setIsSoldDialogOpen] = useState(false);
  const [vehicleToSell, setVehicleToSell] = useState<Vehicle | null>(null);
  const [statusFilter, setStatusFilter] = useState<Vehicle['status'] | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState("");
  const { vehicles, updateVehicleStatus, refreshVehicles, isLoading } = useVehicleStore();

  const filteredVehicles = vehicles.filter((vehicle) => {
    // Apply status filter first
    if (statusFilter !== 'all' && vehicle.status !== statusFilter) {
      return false;
    }

    // Apply month filter
    if (monthFilter.trim()) {
      const vehicleDate = new Date(vehicle.createdAt);
      const filterDate = new Date(monthFilter);
      
      // Check if year and month match
      if (vehicleDate.getFullYear() !== filterDate.getFullYear() || 
          vehicleDate.getMonth() !== filterDate.getMonth()) {
        return false;
      }
    }

    // Then apply search filter
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

  const statusCounts = {
    all: vehicles.length,
    yard: vehicles.filter(v => v.status === 'yard').length,
    sold: vehicles.filter(v => v.status === 'sold').length,
    'pick-your-part': vehicles.filter(v => v.status === 'pick-your-part').length,
    'sa-recycling': vehicles.filter(v => v.status === 'sa-recycling').length,
  };

  const handleAddVehicle = () => {
    setIsIntakeDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleSellVehicle = (vehicle: Vehicle) => {
    setVehicleToSell(vehicle);
    setIsSoldDialogOpen(true);
  };

  const handleStatusUpdate = async (vehicleId: string, newStatus: Vehicle['status'], soldData?: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  }) => {
    try {
      await updateVehicleStatus(vehicleId, newStatus, soldData);
      toast.success("Vehicle status updated successfully");
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error("Failed to update vehicle status");
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshVehicles();
      toast.success("Vehicles refreshed successfully");
    } catch (error) {
      console.error('Error refreshing vehicles:', error);
      toast.error("Failed to refresh vehicles");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedVehicle(null);
  };

  const handleIntakeSuccess = () => {
    setIsIntakeDialogOpen(false);
    refreshVehicles();
  };

  const handleSoldConfirm = async (soldData: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
    buyerAddress?: string;
    buyerCity?: string;
    buyerState?: string;
    buyerZip?: string;
  }) => {
    if (vehicleToSell) {
      await handleStatusUpdate(vehicleToSell.id, 'sold', soldData);
      setIsSoldDialogOpen(false);
      setVehicleToSell(null);
    }
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="gradient-primary" onClick={handleAddVehicle}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by make, model, year, Vehicle ID, or license plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative min-w-48">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="month"
                placeholder="Filter by month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          {(searchTerm || monthFilter) && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} 
              {searchTerm && ` matching "${searchTerm}"`}
              {monthFilter && ` from ${new Date(monthFilter + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Filter Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className="flex items-center gap-2"
            >
              All Vehicles
              <Badge variant="secondary" className="ml-1">
                {statusCounts.all}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'yard' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('yard')}
              className="flex items-center gap-2"
            >
              In Yard
              <Badge variant="secondary" className="ml-1">
                {statusCounts.yard}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'sold' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('sold')}
              className="flex items-center gap-2"
            >
              Sold
              <Badge variant="secondary" className="ml-1">
                {statusCounts.sold}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'pick-your-part' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pick-your-part')}
              className="flex items-center gap-2"
            >
              Pick Your Part
              <Badge variant="secondary" className="ml-1">
                {statusCounts['pick-your-part']}
              </Badge>
            </Button>
            <Button
              variant={statusFilter === 'sa-recycling' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('sa-recycling')}
              className="flex items-center gap-2"
            >
              SA Recycling
              <Badge variant="secondary" className="ml-1">
                {statusCounts['sa-recycling']}
              </Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Vehicles ({statusFilter === 'all' ? 
              (searchTerm || monthFilter ? `${filteredVehicles.length} of ${vehicles.length}` : vehicles.length) :
              `${filteredVehicles.length} ${statusFilter === 'yard' ? 'In Yard' : 
                statusFilter === 'sold' ? 'Sold' :
                statusFilter === 'pick-your-part' ? 'Pick Your Part' :
                'SA Recycling'} vehicles`
            })
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
                {statusFilter !== 'all' ? 
                  `No vehicles with status "${statusFilter === 'yard' ? 'In Yard' : 
                    statusFilter === 'sold' ? 'Sold' :
                    statusFilter === 'pick-your-part' ? 'Pick Your Part' :
                    'SA Recycling'}" found.` :
                  'No vehicles match your search criteria. Try adjusting your search terms.'
                }
              </p>
              <div className="flex gap-2 justify-center">
                {statusFilter !== 'all' && (
                  <Button variant="outline" onClick={() => setStatusFilter('all')}>
                    Show All Vehicles
                  </Button>
                )}
                {(searchTerm || monthFilter) && (
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("");
                    setMonthFilter("");
                  }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Vehicle ID</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Sold To</TableHead>
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
                      {vehicle.purchaseDate || '-'}
                    </TableCell>
                    <TableCell>
                      {vehicle.purchasePrice ? `$${parseFloat(vehicle.purchasePrice).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {vehicle.salePrice ? `$${parseFloat(vehicle.salePrice).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      -
                    </TableCell>
                    <TableCell>
                      {vehicle.status === 'sold' && vehicle.buyerFirstName && vehicle.buyerLastName ? (
                        <div className="text-sm">
                          <div>{vehicle.buyerFirstName} {vehicle.buyerLastName}</div>
                          {vehicle.saleDate && (
                            <div className="text-muted-foreground">{vehicle.saleDate}</div>
                          )}
                        </div>
                      ) : '-'}
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
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditVehicle(vehicle)}
                          disabled={isLoading}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        {vehicle.status !== 'sold' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSellVehicle(vehicle)}
                            disabled={isLoading}
                          >
                            Sell
                          </Button>
                        )}
                      </div>
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
        onStatusUpdate={handleStatusUpdate}
        refreshVehicles={refreshVehicles}
      />

      <VehicleIntakeDialog
        isOpen={isIntakeDialogOpen}
        onClose={() => setIsIntakeDialogOpen(false)}
        onSuccess={handleIntakeSuccess}
      />

      <SoldDialog
        open={isSoldDialogOpen}
        onOpenChange={setIsSoldDialogOpen}
        vehicle={vehicleToSell}
        onConfirm={handleSoldConfirm}
      />
    </div>
  );
}
