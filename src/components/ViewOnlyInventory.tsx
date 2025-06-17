
import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ViewOnlyVehicleDialog } from "@/components/ViewOnlyVehicleDialog";
import { Search, LogOut, CheckCircle, XCircle, Eye, RefreshCw, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVehicleStorePaginated } from "@/hooks/useVehicleStorePaginated";
import { Vehicle } from "@/stores/vehicleStore";

interface ViewOnlyInventoryProps {
  onLogout: () => void;
  username: string;
}

export const ViewOnlyInventory = ({ onLogout, username }: ViewOnlyInventoryProps) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const { toast } = useToast();

  const { 
    vehicles, 
    totalCount, 
    isLoading, 
    hasMore, 
    searchTerm, 
    setSearchTerm, 
    loadMore,
    refreshVehicles,
    loadVehicleDocuments
  } = useVehicleStorePaginated();

  const handleVehicleClick = useCallback(async (vehicle: Vehicle) => {
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
      setDialogOpen(true);
    } catch (error) {
      console.error('Error loading vehicle documents:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicle documents",
        variant: "destructive",
      });
      setSelectedVehicle(vehicle);
      setDialogOpen(true);
    } finally {
      setLoadingDocuments(false);
    }
  }, [loadVehicleDocuments, toast]);

  const handleRefresh = async () => {
    try {
      await refreshVehicles();
      toast({
        title: "Success",
        description: "Vehicles refreshed successfully",
      });
    } catch (error) {
      console.error('Error refreshing vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to refresh vehicles",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "yard":
        return "bg-blue-100 text-blue-800";
      case "sold":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaperworkColor = (paperwork: string) => {
    switch (paperwork?.toLowerCase()) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "missing":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Inventory</h1>
              <p className="text-sm text-gray-600">Logged in as: {username} (View Only) - {totalCount} total vehicles</p>
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
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by make, model, year, Vehicle ID, or license plate..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
        </div>

        {isLoading && vehicles.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mx-auto mb-2" />
            <p>Loading inventory...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? "No vehicles match your search." : "No vehicles in inventory."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <Card 
                  key={vehicle.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleVehicleClick(vehicle)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(vehicle.status)}>
                        {vehicle.status || "Unknown"}
                      </Badge>
                      <Badge className={getPaperworkColor(vehicle.paperwork)}>
                        {vehicle.paperwork || "Unknown"} Paperwork
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Vehicle ID</p>
                      <p className="font-semibold">{vehicle.vehicleId}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {vehicle.titlePresent ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">Title</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {vehicle.billOfSale ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">Bill of Sale</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {vehicle.documents && vehicle.documents.length > 0 ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>{vehicle.documents.length} document(s)</span>
                          </>
                        ) : (
                          <span className="text-gray-400">No documents</span>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVehicleClick(vehicle);
                        }}
                        disabled={loadingDocuments}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {loadingDocuments ? 'Loading...' : 'View Details'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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
          </>
        )}
      </div>

      <ViewOnlyVehicleDialog 
        vehicle={selectedVehicle}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
