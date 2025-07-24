
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Car, Plus, Edit, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { toast } from "sonner";

interface VehicleInventoryProps {
  onNavigate: (page: string) => void;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function VehicleInventory({ onNavigate }: VehicleInventoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Vehicle['status'] | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const { vehicles, updateVehicleStatus, refreshVehicles, isLoading } = useVehicleStore();

  // Calculate month counts from vehicle creation dates
  const monthCounts = vehicles.reduce((acc, vehicle) => {
    if (vehicle.createdAt) {
      const month = vehicle.createdAt.substring(5, 7); // Extract MM from YYYY-MM-DD
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const filteredVehicles = vehicles.filter((vehicle) => {
    // Apply status filter first
    if (statusFilter !== 'all' && vehicle.status !== statusFilter) {
      return false;
    }

    // Apply month filter
    if (monthFilter !== 'all') {
      if (!vehicle.createdAt) return false;
      const vehicleMonth = vehicle.createdAt.substring(5, 7); // Extract MM from YYYY-MM-DD
      if (vehicleMonth !== monthFilter) return false;
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
    onNavigate('intake');
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDialogOpen(true);
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
            <div className="w-48">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months ({vehicles.length})</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthNum = String(i + 1).padStart(2, '0');
                    const count = monthCounts[monthNum] || 0;
                    const monthName = monthNames[i];
                    return (
                      <SelectItem key={monthNum} value={monthNum}>
                        {monthNum} ({monthName}) - {count} vehicles
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
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
              (searchTerm || monthFilter !== 'all' ? `${filteredVehicles.length} of ${vehicles.length}` : vehicles.length) :
              `${filteredVehicles.length} ${statusFilter === 'yard' ? 'In Yard' : 
                statusFilter === 'sold' ? 'Sold' :
                statusFilter === 'pick-your-part' ? 'Pick Your Part' :
                'SA Recycling'} vehicles`
            })
            {monthFilter !== 'all' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - {monthNames[parseInt(monthFilter) - 1]} {new Date().getFullYear()}
              </span>
            )}
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
                  monthFilter !== 'all' ?
                    `No vehicles found for ${monthNames[parseInt(monthFilter) - 1]}.` :
                    'No vehicles match your search criteria. Try adjusting your search terms.'
                }
              </p>
              <div className="flex gap-2 justify-center">
                {statusFilter !== 'all' && (
                  <Button variant="outline" onClick={() => setStatusFilter('all')}>
                    Show All Vehicles
                  </Button>
                )}
                {monthFilter !== 'all' && (
                  <Button variant="outline" onClick={() => setMonthFilter('all')}>
                    Show All Months
                  </Button>
                )}
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
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
                  <TableHead>Sold/Sent to</TableHead>
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
                      ) : vehicle.status === 'sa-recycling' ? (
                        <div className="text-sm">
                          <div>SA Recycling</div>
                          {vehicle.saRecyclingDate && (
                            <div className="text-muted-foreground">{vehicle.saRecyclingDate}</div>
                          )}
                        </div>
                      ) : vehicle.status === 'pick-your-part' ? (
                        <div className="text-sm">
                          <div>Pick Your Part</div>
                          {vehicle.pickYourPartDate && (
                            <div className="text-muted-foreground">{vehicle.pickYourPartDate}</div>
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditVehicle(vehicle)}
                        disabled={isLoading}
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
        onStatusUpdate={handleStatusUpdate}
        refreshVehicles={refreshVehicles}
      />
    </div>
  );
}
