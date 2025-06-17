import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Car, Plus, Edit, RefreshCw, ChevronDown, FileText, Send } from "lucide-react";
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
import { VehicleDetailsDialog } from "@/components/VehicleDetailsDialog";
import { DMVProgressDialog } from "@/components/DMVProgressDialog";
import { Vehicle } from "@/stores/vehicleStore";
import { toast } from "sonner";

interface VehicleInventoryOptimizedProps {
  onNavigate: (page: string, state?: any) => void; // allow optional state
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
  const [editingPaperworkId, setEditingPaperworkId] = useState<string | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [isDMVDialogOpen, setIsDMVDialogOpen] = useState(false);
  const [dmvVehicles, setDMVVehicles] = useState<Array<{ id: string; year: string; make: string; model: string; vehicleId: string; }>>([]);
  
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
    loadVehicleDocuments,
    updateVehiclePaperwork,
    submitToDMV
  } = useVehicleStorePaginated();

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
      setEditingPaperworkId(null);
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

  const handleSelectVehicle = (vehicleId: string, checked: boolean) => {
    const newSelected = new Set(selectedVehicles);
    if (checked) {
      newSelected.add(vehicleId);
    } else {
      newSelected.delete(vehicleId);
    }
    setSelectedVehicles(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const eligibleVehicles = vehicles.filter(v => 
        v.status === 'sold' && 
        v.buyerFirstName && 
        v.buyerLastName &&
        v.dmvStatus === 'pending'
      );
      setSelectedVehicles(new Set(eligibleVehicles.map(v => v.id)));
    } else {
      setSelectedVehicles(new Set());
    }
  };

  const handleDMVAutomation = () => {
    const eligibleVehicles = vehicles.filter(v => 
      v.status === 'sold' && 
      v.buyerFirstName && 
      v.buyerLastName &&
      v.dmvStatus === 'pending'
    );

    if (selectedVehicles.size === 0) {
      toast.error("Please select vehicles for DMV automation");
      return;
    }

    const selectedEligibleVehicles = eligibleVehicles.filter(v => selectedVehicles.has(v.id));
    
    if (selectedEligibleVehicles.length === 0) {
      toast.error("No eligible vehicles selected for DMV automation");
      return;
    }

    setDMVVehicles(selectedEligibleVehicles.map(v => ({
      id: v.id,
      year: v.year,
      make: v.make,
      model: v.model,
      vehicleId: v.vehicleId
    })));
    setIsDMVDialogOpen(true);
  };

  const handleDMVSubmit = async (vehicleIds: string[]) => {
    try {
      const result = await submitToDMV(vehicleIds);
      await refreshVehicles();
      return result;
    } catch (error) {
      console.error('DMV submission error:', error);
      throw error;
    }
  };

  const handleCloseDMVDialog = () => {
    setIsDMVDialogOpen(false);
    setDMVVehicles([]);
    setSelectedVehicles(new Set());
  };

  const handleIndividualDMVAutomation = (vehicle: Vehicle) => {
    setDMVVehicles([{
      id: vehicle.id,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      vehicleId: vehicle.vehicleId
    }]);
    setIsDMVDialogOpen(true);
  };

  const handleUpdateVehicleInfo = async (vehicleId: string, data: {
    buyerFirstName: string;
    buyerLastName: string;
    buyerAddress?: string;
    buyerCity?: string;
    buyerState?: string;
    buyerZip?: string;
    salePrice: string;
    saleDate: string;
  }) => {
    try {
      await updateVehicleStatus(vehicleId, 'sold', data);
      await refreshVehicles();
      toast.success("Vehicle information updated successfully");
    } catch (error) {
      console.error('Error updating vehicle info:', error);
      toast.error("Failed to update vehicle information");
      throw error;
    }
  };

  const eligibleVehicles = vehicles.filter(v => 
    v.status === 'sold' && 
    v.buyerFirstName && 
    v.buyerLastName &&
    v.dmvStatus === 'pending'
  );

  const isSearching = searchTerm.trim().length > 0;

  const getDMVStatusDisplay = (vehicle: Vehicle) => {
    const isEligibleForSubmission = vehicle.status === 'sold' && 
      vehicle.buyerFirstName && 
      vehicle.buyerLastName && 
      vehicle.dmvStatus === 'pending';
    
    if (isEligibleForSubmission) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleIndividualDMVAutomation(vehicle)}
          className="h-6 px-2 text-xs"
        >
          <Send className="w-3 h-3 mr-1" />
          DMV Automation
        </Button>
      );
    }

    switch (vehicle.dmvStatus) {
      case 'submitted':
        return <Badge variant="default" className="bg-green-500">Submitted</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="destructive">Failed</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleIndividualDMVAutomation(vehicle)}
              className="h-5 px-1 text-xs"
            >
              <Send className="w-2 h-2 mr-1" />
              Retry
            </Button>
          </div>
        );
      default:
        return <Badge variant="outline">Not Eligible</Badge>;
    }
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
          {eligibleVehicles.length > 0 && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={handleDMVAutomation}
                disabled={selectedVehicles.size === 0}
              >
                <Send className="w-4 h-4 mr-2" />
                DMV Automation ({selectedVehicles.size})
              </Button>
            </div>
          )}
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
              {isSearching ? (
                <>Showing {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} matching "{searchTerm}"</>
              ) : (
                <>Showing {vehicles.length} of {totalCount} vehicles matching "{searchTerm}"</>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Vehicles ({isSearching ? vehicles.length : `${vehicles.length}${totalCount > vehicles.length ? ` of ${totalCount}` : ''}`})
            {eligibleVehicles.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({eligibleVehicles.length} eligible for DMV)
              </span>
            )}
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
                    {eligibleVehicles.length > 0 && (
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedVehicles.size > 0 && selectedVehicles.size === eligibleVehicles.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </TableHead>
                    )}
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Vehicle ID</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Sale Price</TableHead>
                    <TableHead>Sold To</TableHead>
                    <TableHead>Paperwork</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>DMV Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => {
                    const isEligibleForDMV = vehicle.status === 'sold' && 
                      vehicle.buyerFirstName && 
                      vehicle.buyerLastName &&
                      vehicle.dmvStatus === 'pending';
                    
                    return (
                      <TableRow key={vehicle.id}>
                        {eligibleVehicles.length > 0 && (
                          <TableCell>
                            {isEligibleForDMV && (
                              <input
                                type="checkbox"
                                checked={selectedVehicles.has(vehicle.id)}
                                onChange={(e) => handleSelectVehicle(vehicle.id, e.target.checked)}
                                className="rounded"
                              />
                            )}
                          </TableCell>
                        )}
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
                          <div className="flex flex-col gap-1">
                            {getDMVStatusDisplay(vehicle)}
                            {vehicle.dmvConfirmationNumber && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {vehicle.dmvConfirmationNumber}
                              </span>
                            )}
                          </div>
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
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Load More Button - Only show when not searching and there are more items */}
              {hasMore && !isSearching && (
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

      <DMVProgressDialog
        isOpen={isDMVDialogOpen}
        onClose={handleCloseDMVDialog}
        vehicles={dmvVehicles}
        onSubmit={handleDMVSubmit}
        onUpdateVehicle={handleUpdateVehicleInfo}
      />
    </div>
  );
}
