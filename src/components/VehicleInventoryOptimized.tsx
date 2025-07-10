
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVehicleStorePaginated } from "@/hooks/useVehicleStorePaginated";
import { VehicleDetailsDialog } from "@/components/VehicleDetailsDialog";
import { Vehicle, CarImage } from "@/stores/vehicleStore";
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
  const [editingPaperworkId, setEditingPaperworkId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Vehicle['status'] | 'all'>('all');
  const [statusSpecificVehicles, setStatusSpecificVehicles] = useState<Vehicle[]>([]);
  const [statusSpecificLoading, setStatusSpecificLoading] = useState(false);
  const [actualStatusCounts, setActualStatusCounts] = useState({
    all: 0,
    yard: 0,
    sold: 0,
    'pick-your-part': 0,
    'sa-recycling': 0,
  });
  
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
    updateVehiclePaperwork
  } = useVehicleStorePaginated();

  const deserializeCarImages = (carImagesData: any): CarImage[] => {
    if (!carImagesData || !Array.isArray(carImagesData)) {
      return [];
    }
    
    return carImagesData.map(img => ({
      id: img.id || `img_${Date.now()}`,
      name: img.name || 'Untitled Image',
      size: img.size || 0,
      url: img.url || '',
      uploadedAt: img.uploadedAt || new Date().toISOString()
    }));
  };

  // Load ALL vehicles for specific status filters
  const loadAllVehiclesForStatus = async (status: Vehicle['status']) => {
    setStatusSpecificLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          year,
          make,
          model,
          vehicle_id,
          license_plate,
          seller_name,
          purchase_date,
          purchase_price,
          title_present,
          bill_of_sale,
          destination,
          buyer_name,
          buyer_first_name,
          buyer_last_name,
          buyer_address,
          buyer_city,
          buyer_state,
          buyer_zip,
          sale_date,
          sale_price,
          notes,
          paperwork,
          paperwork_other,
          status,
          is_released,
          car_images,
          created_at,
          updated_at
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedVehicles: Vehicle[] = (data || []).map(vehicle => ({
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
        notes: vehicle.notes || undefined,
        paperwork: vehicle.paperwork || undefined,
        paperworkOther: vehicle.paperwork_other || undefined,
        status: (vehicle.status as Vehicle['status']) || 'yard',
        isReleased: Boolean(vehicle.is_released),
        carImages: deserializeCarImages(vehicle.car_images),
        createdAt: vehicle.created_at,
        documents: []
      }));

      setStatusSpecificVehicles(transformedVehicles);
    } catch (error) {
      console.error('Error loading vehicles for status:', status, error);
      setStatusSpecificVehicles([]);
    } finally {
      setStatusSpecificLoading(false);
    }
  };

  // Load actual status counts from database
  const loadStatusCounts = async () => {
    try {
      const [allResult, yardResult, soldResult, pypResult, saResult] = await Promise.all([
        supabase.from('vehicles').select('id', { count: 'exact', head: true }),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'yard'),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'pick-your-part'),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'sa-recycling'),
      ]);

      setActualStatusCounts({
        all: allResult.count || 0,
        yard: yardResult.count || 0,
        sold: soldResult.count || 0,
        'pick-your-part': pypResult.count || 0,
        'sa-recycling': saResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading status counts:', error);
    }
  };

  // Load status counts on component mount and when vehicles change
  useEffect(() => {
    loadStatusCounts();
  }, []);

  // Reload status counts when vehicles are updated
  useEffect(() => {
    if (vehicles.length > 0) {
      loadStatusCounts();
    }
  }, [vehicles.length]);

  // Load status-specific vehicles when filter changes
  useEffect(() => {
    if (statusFilter !== 'all' && statusFilter !== 'yard') {
      loadAllVehiclesForStatus(statusFilter);
    } else {
      setStatusSpecificVehicles([]);
    }
  }, [statusFilter]);

  // Use status-specific vehicles when available, otherwise filter from paginated results
  const filteredVehicles = (statusFilter !== 'all' && statusFilter !== 'yard' && statusSpecificVehicles.length > 0)
    ? statusSpecificVehicles
    : vehicles.filter((vehicle) => {
        if (statusFilter !== 'all' && vehicle.status !== statusFilter) {
          return false;
        }
        return true;
      });

  // Use actual database counts for status badges
  const statusCounts = actualStatusCounts;

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

  const isSearching = searchTerm.trim().length > 0;

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
              <Input
                placeholder="Search by make, model, year, Vehicle ID, or license plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
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
                <>Showing {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} matching "{searchTerm}"</>
              ) : (
                <>Showing {filteredVehicles.length} of {totalCount} vehicles matching "{searchTerm}"</>
              )}
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
              (isSearching ? filteredVehicles.length : `${filteredVehicles.length}${totalCount > filteredVehicles.length ? ` of ${totalCount}` : ''}`) :
              `${filteredVehicles.length} ${statusFilter === 'yard' ? 'In Yard' : 
                statusFilter === 'sold' ? 'Sold' :
                statusFilter === 'pick-your-part' ? 'Pick Your Part' :
                'SA Recycling'} vehicles`
            })
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
                  'No vehicles match your search criteria.'
                }
              </p>
              <div className="flex gap-2 justify-center">
                {statusFilter !== 'all' && (
                  <Button variant="outline" onClick={() => setStatusFilter('all')}>
                    Show All Vehicles
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
              
              {/* Load More Button - Only show when not searching and there are more items */}
              {hasMore && !isSearching && statusFilter === 'all' && (
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

              {/* Loading indicator for initial load and status-specific loading */}
              {(isLoading && vehicles.length === 0) || (statusSpecificLoading && statusFilter !== 'all' && statusFilter !== 'yard') ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">
                    {statusSpecificLoading ? `Loading all ${statusFilter.replace('-', ' ')} vehicles...` : 'Loading vehicles...'}
                  </span>
                </div>
              ) : null}
            </>
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
