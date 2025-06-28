
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, RefreshCw, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVehicleStorePaginated } from "@/hooks/useVehicleStorePaginated";
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch";
import { VehicleDetailsDialog } from "@/components/VehicleDetailsDialog";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { Vehicle } from "@/stores/vehicleStore";
import { toast } from "sonner";

interface VehicleInventoryOptimizedProps {
  onNavigate: (page: string) => void;
}

// Helper function to format paperwork display text
const formatPaperworkDisplay = (paperwork?: string, paperworkOther?: string): string => {
  if (!paperwork) return "-";
  
  switch (paperwork) {
    case "title":
      return "Title";
    case "registered-owner":
      return "Registered Owner";
    case "lien-sale":
      return "Lien Sale";
    case "no-paperwork":
      return "No Paperwork";
    case "other":
      return paperworkOther || "Other";
    default:
      return paperwork;
  }
};

export function VehicleInventoryOptimized({ onNavigate }: VehicleInventoryOptimizedProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  
  const { 
    vehicles, 
    totalCount, 
    isLoading, 
    refreshVehicles,
    loadVehicleDocuments,
    updateVehiclePaperwork
  } = useVehicleStorePaginated();

  // Use advanced search instead of basic filtering
  const { filteredVehicles, setFilters, totalResults } = useAdvancedSearch(vehicles);

  const paperworkOptions = [
    { value: "title", label: "Title" },
    { value: "registered-owner", label: "Registered Owner" },
    { value: "lien-sale", label: "Lien Sale" },
    { value: "no-paperwork", label: "No Paperwork" },
    { value: "other", label: "Other" }
  ];

  const handlePaperworkChange = async (vehicleId: string, newPaperwork: string) => {
    try {
      await updateVehiclePaperwork(vehicleId, newPaperwork);
      toast.success("Paperwork status updated successfully");
    } catch (error) {
      console.error('Error updating paperwork:', error);
      toast.error("Failed to update paperwork status");
    }
  };

  const handleAddVehicle = () => {
    onNavigate('intake');
  };

  const handleEditVehicle = useCallback(async (vehicle: Vehicle) => {
    console.log('Loading documents for vehicle:', vehicle.id);
    setLoadingDocuments(true);
    
    try {
      const documents = await loadVehicleDocuments(vehicle.id);
      console.log('Loaded documents for vehicle dialog:', documents);
      
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
      setSelectedVehicle(vehicle);
      setIsDialogOpen(true);
    } finally {
      setLoadingDocuments(false);
    }
  }, [loadVehicleDocuments]);

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

      {/* Advanced Search Component */}
      <AdvancedSearch 
        onFiltersChange={setFilters}
        totalResults={totalResults}
      />

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Vehicles ({totalResults} {totalResults === totalCount ? '' : `of ${totalCount}`} results)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalResults === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 text-muted-foreground mx-auto mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters to find vehicles.
              </p>
              <Button variant="outline" onClick={() => setFilters({
                searchTerm: '',
                status: 'all',
                paperwork: 'all',
                priceRange: { min: '', max: '' },
                dateRange: { startDate: '', endDate: '' },
                hasImages: null,
                hasDocuments: null,
              })}>
                Clear All Filters
              </Button>
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
                  <TableHead>Sold To</TableHead>
                  <TableHead>Paperwork</TableHead>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Badge 
                            variant="outline" 
                            className="cursor-pointer hover:bg-accent transition-colors"
                          >
                            {formatPaperworkDisplay(vehicle.paperwork, vehicle.paperworkOther)}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {paperworkOptions.map((option) => (
                            <DropdownMenuItem
                              key={option.value}
                              onClick={() => handlePaperworkChange(vehicle.id, option.value)}
                              className="cursor-pointer"
                            >
                              {option.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
          )}
          
          {/* Loading indicator */}
          {isLoading && vehicles.length === 0 && (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>

      <VehicleDetailsDialog
        vehicle={selectedVehicle}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onStatusUpdate={async () => {}} // Remove status update for now since we're using advanced search
        refreshVehicles={refreshVehicles}
      />
    </div>
  );
}
