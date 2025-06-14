
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Car, Plus, Edit, RefreshCw, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVehicleStorePaginated } from "@/hooks/useVehicleStorePaginated";
import { VehicleDetailsDialog } from "@/components/VehicleDetailsDialog";
import { Vehicle } from "@/stores/vehicleStore";
import { toast } from "sonner";

interface VehicleInventoryOptimizedProps {
  onNavigate: (page: string) => void;
}

export function VehicleInventoryOptimized({ onNavigate }: VehicleInventoryOptimizedProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  
  const { 
    vehicles, 
    totalCount, 
    isLoading, 
    hasMore, 
    searchTerm, 
    setSearchTerm, 
    loadMore, 
    updateVehicleStatus, 
    refreshVehicles,
    loadVehicleDocuments
  } = useVehicleStorePaginated();

  const handleAddVehicle = () => {
    onNavigate('intake');
  };

  const handleEditVehicle = useCallback(async (vehicle: Vehicle) => {
    console.log('Loading documents for vehicle:', vehicle.id);
    setLoadingDocuments(true);
    
    try {
      // Load documents when editing
      const documents = await loadVehicleDocuments(vehicle.id);
      console.log('Loaded documents for vehicle dialog:', documents);
      
      // Create the vehicle object with documents
      const vehicleWithDocuments = { 
        ...vehicle, 
        documents: documents.map(doc => ({
          id: doc.id || `doc_${Date.now()}`,
          name: doc.name || 'Untitled Document',
          url: doc.url || '',
          size: doc.size || 0,
          file: new File([], doc.name || 'document', { 
            type: doc.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg' 
          })
        }))
      };
      
      console.log('Setting selected vehicle with documents:', vehicleWithDocuments);
      setSelectedVehicle(vehicleWithDocuments);
      setIsDialogOpen(true);
    } catch (error) {
      console.error('Error loading vehicle documents:', error);
      toast.error("Failed to load vehicle documents");
      // Still open dialog without documents
      setSelectedVehicle(vehicle);
      setIsDialogOpen(true);
    } finally {
      setLoadingDocuments(false);
    }
  }, [loadVehicleDocuments]);

  const handleSaveVehicle = async (vehicleId: string, newStatus: Vehicle['status'], soldData?: {
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
            Manage your vehicle inventory and track status ({totalCount} total vehicles)
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
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {vehicles.length} of {totalCount} vehicles matching "{searchTerm}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Vehicles ({vehicles.length}{totalCount > vehicles.length ? ` of ${totalCount}` : ''})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalCount === 0 && !isLoading ? (
            <div className="text-center py-12">
              <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No vehicles match your search criteria.' : 'Start by adding your first vehicle to the inventory.'}
              </p>
              {searchTerm ? (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              ) : (
                <Button className="gradient-primary" onClick={handleAddVehicle}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Vehicle
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Vehicle ID</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Sold To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditVehicle(vehicle)}
                          disabled={isLoading || loadingDocuments}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {loadingDocuments ? 'Loading...' : 'Edit'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={isLoading}
                    className="min-w-32"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}

              {/* Loading indicator for initial load */}
              {isLoading && vehicles.length === 0 && (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
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
