
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VehicleDetailsDialog } from "./VehicleDetailsDialog";
import { useVehicleStorePaginated } from "@/hooks/useVehicleStorePaginated";
import { Vehicle } from "@/stores/vehicleStore";
import { 
  Search, 
  Car, 
  DollarSign, 
  Calendar,
  User,
  Package,
  FileText,
  ExternalLink,
  Eye,
  Loader2,
  Filter
} from "lucide-react";

interface VehicleInventoryOptimizedProps {
  onNavigate: (page: string) => void;
}

export function VehicleInventoryOptimized({ onNavigate }: VehicleInventoryOptimizedProps) {
  const {
    vehicles,
    totalCount,
    isLoading,
    hasMore,
    searchTerm,
    setSearchTerm,
    loadMore,
    refreshVehicles
  } = useVehicleStorePaginated();

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Filter vehicles based on selected status filters
  const filteredVehicles = vehicles.filter(vehicle => {
    if (statusFilter.length === 0) return true;
    return statusFilter.includes(vehicle.status);
  });

  const handleVehicleClick = (vehicle: Vehicle) => {
    console.log('Vehicle selected:', vehicle.id);
    setSelectedVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleVehicleUpdated = () => {
    console.log('Vehicle updated callback triggered - refreshing inventory');
    refreshVehicles();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'yard': return 'bg-blue-500';
      case 'sold': return 'bg-green-500';
      case 'pick-your-part': return 'bg-orange-500';
      case 'sa-recycling': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusDisplay = (status: string) => {
    if (!status) return 'UNKNOWN';
    
    switch (status) {
      case 'yard': return 'In Yard';
      case 'sold': return 'Sold';
      case 'pick-your-part': return 'Pick Your Part';
      case 'sa-recycling': return 'SA Recycling';
      default: return status.toUpperCase();
    }
  };

  const formatPaperworkDisplay = (paperwork?: string, paperworkOther?: string): string => {
    if (!paperwork) return "Unknown";
    
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

  const getStatusCounts = () => {
    const counts = {
      yard: vehicles.filter(v => v.status === 'yard').length,
      sold: vehicles.filter(v => v.status === 'sold').length,
      'pick-your-part': vehicles.filter(v => v.status === 'pick-your-part').length,
      'sa-recycling': vehicles.filter(v => v.status === 'sa-recycling').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : `${filteredVehicles.length} of ${totalCount} vehicles`}
        </div>
      </div>

      {/* Status Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter by Status:</span>
            </div>
            <ToggleGroup 
              type="multiple" 
              value={statusFilter} 
              onValueChange={setStatusFilter}
              className="justify-start"
            >
              <ToggleGroupItem value="yard" aria-label="In Yard" className="text-xs">
                In Yard ({statusCounts.yard})
              </ToggleGroupItem>
              <ToggleGroupItem value="sold" aria-label="Sold" className="text-xs">
                Sold ({statusCounts.sold})
              </ToggleGroupItem>
              <ToggleGroupItem value="pick-your-part" aria-label="Pick Your Part" className="text-xs">
                Pick Your Part ({statusCounts['pick-your-part']})
              </ToggleGroupItem>
              <ToggleGroupItem value="sa-recycling" aria-label="SA Recycling" className="text-xs">
                SA Recycling ({statusCounts['sa-recycling']})
              </ToggleGroupItem>
            </ToggleGroup>
            {statusFilter.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter([])}
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              {/* Header with status */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm truncate">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <Badge className={`${getStatusColor(vehicle.status)} text-white text-xs`}>
                  {getStatusDisplay(vehicle.status)}
                </Badge>
              </div>

              {/* Vehicle ID and License Plate */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Car className="w-3 h-3" />
                  <span>ID: {vehicle.vehicleId}</span>
                </div>
                {vehicle.licensePlate && (
                  <div className="text-xs text-muted-foreground">
                    License: {vehicle.licensePlate}
                  </div>
                )}
              </div>

              <Separator />

              {/* Purchase Info */}
              <div className="space-y-1">
                {vehicle.purchasePrice && (
                  <div className="flex items-center gap-2 text-xs">
                    <DollarSign className="w-3 h-3" />
                    <span>Purchase: ${parseFloat(vehicle.purchasePrice).toLocaleString()}</span>
                  </div>
                )}
                {vehicle.purchaseDate && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{vehicle.purchaseDate}</span>
                  </div>
                )}
              </div>

              {/* Sale Info (if sold) */}
              {vehicle.status === 'sold' && (
                <div className="space-y-1 border-t pt-2">
                  {vehicle.salePrice && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <DollarSign className="w-3 h-3" />
                      <span>Sold: ${parseFloat(vehicle.salePrice).toLocaleString()}</span>
                    </div>
                  )}
                  {vehicle.buyerFirstName && vehicle.buyerLastName && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{vehicle.buyerFirstName} {vehicle.buyerLastName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Documentation status */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>{formatPaperworkDisplay(vehicle.paperwork, vehicle.paperworkOther)}</span>
              </div>

              {/* Action Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => handleVehicleClick(vehicle)}
              >
                <Eye className="w-3 h-3 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && !searchTerm.trim() && statusFilter.length === 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Vehicles'
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {filteredVehicles.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No vehicles found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter.length > 0 ? 'Try adjusting your search or filter settings' : 'Start by adding your first vehicle'}
          </p>
        </div>
      )}

      {/* Vehicle Details Dialog */}
      <VehicleDetailsDialog
        vehicle={selectedVehicle}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onVehicleUpdated={handleVehicleUpdated}
      />
    </div>
  );
}
