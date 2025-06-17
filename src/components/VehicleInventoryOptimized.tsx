
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Car, 
  DollarSign, 
  Calendar, 
  User, 
  MapPin, 
  FileText,
  Eye,
  Edit3,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVehicleStorePaginated } from '@/hooks/useVehicleStorePaginated';
import { VehicleDetailsDialog } from '@/components/VehicleDetailsDialog';
import { SoldDialog } from '@/components/forms/SoldDialog';
import { Vehicle } from '@/stores/vehicleStore';
import { useToast } from '@/hooks/use-toast';

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
    updateVehicleStatus, 
    refreshVehicles,
    updateVehiclePaperwork
  } = useVehicleStorePaginated();

  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showSoldDialog, setShowSoldDialog] = useState(false);
  const [vehicleToSell, setVehicleToSell] = useState<Vehicle | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const filteredAndSortedVehicles = useMemo(() => {
    let filtered = vehicles;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'make':
          return a.make.localeCompare(b.make);
        case 'year':
          return parseInt(b.year) - parseInt(a.year);
        default:
          return 0;
      }
    });

    return sorted;
  }, [vehicles, statusFilter, sortBy]);

  const handleStatusChange = async (vehicleId: string, newStatus: Vehicle['status']) => {
    if (newStatus === 'sold') {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setVehicleToSell(vehicle);
        setShowSoldDialog(true);
      }
      return;
    }

    try {
      await updateVehicleStatus(vehicleId, newStatus);
      toast({
        title: "Success",
        description: `Vehicle status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      toast({
        title: "Error",
        description: "Failed to update vehicle status",
        variant: "destructive",
      });
    }
  };

  const handleSoldSubmit = async (soldData: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  }) => {
    if (!vehicleToSell) return;

    try {
      await updateVehicleStatus(vehicleToSell.id, 'sold', soldData);
      toast({
        title: "Success",
        description: "Vehicle marked as sold successfully",
      });
      setShowSoldDialog(false);
      setVehicleToSell(null);
    } catch (error) {
      console.error('Error marking vehicle as sold:', error);
      toast({
        title: "Error",
        description: "Failed to mark vehicle as sold",
        variant: "destructive",
      });
    }
  };

  const handlePaperworkChange = async (vehicleId: string, newPaperwork: string) => {
    try {
      await updateVehiclePaperwork(vehicleId, newPaperwork);
      toast({
        title: "Success",
        description: "Paperwork status updated",
      });
    } catch (error) {
      console.error('Error updating paperwork:', error);
      toast({
        title: "Error",
        description: "Failed to update paperwork status",
        variant: "destructive",
      });
    }
  };

  const toggleCardExpansion = (vehicleId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sold': return 'default';
      case 'yard': return 'secondary';
      case 'pick-your-part': return 'outline';
      case 'sa-recycling': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sold': return 'text-green-600 bg-green-50';
      case 'yard': return 'text-blue-600 bg-blue-50';
      case 'pick-your-part': return 'text-orange-600 bg-orange-50';
      case 'sa-recycling': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by make, model, year, VIN, or license plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="yard">In Yard</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="pick-your-part">Pick Your Part</SelectItem>
              <SelectItem value="sa-recycling">SA Recycling</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="make">Make</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={refreshVehicles} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedVehicles.length} of {totalCount} vehicles
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAndSortedVehicles.map((vehicle) => {
          const isExpanded = expandedCards.has(vehicle.id);
          
          return (
            <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      VIN: {vehicle.vehicleId}
                    </p>
                  </div>
                  <Badge 
                    variant={getStatusBadgeVariant(vehicle.status)}
                    className={`${getStatusColor(vehicle.status)} font-medium`}
                  >
                    {vehicle.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Always visible info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {vehicle.purchaseDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Purchased:</span>
                      <span>{new Date(vehicle.purchaseDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {vehicle.purchasePrice && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Cost:</span>
                      <span>${vehicle.purchasePrice}</span>
                    </div>
                  )}
                </div>

                {/* Expandable content */}
                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t">
                    {vehicle.licensePlate && (
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">License: {vehicle.licensePlate}</span>
                      </div>
                    )}
                    
                    {vehicle.sellerName && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Seller: {vehicle.sellerName}</span>
                      </div>
                    )}

                    {vehicle.status === 'sold' && vehicle.buyerFirstName && vehicle.buyerLastName && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Buyer: {vehicle.buyerFirstName} {vehicle.buyerLastName}</span>
                        </div>
                        {vehicle.salePrice && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Sale Price: ${vehicle.salePrice}</span>
                          </div>
                        )}
                        {vehicle.saleDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Sale Date: {new Date(vehicle.saleDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {vehicle.notes && (
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Notes:</span>
                        <p className="text-sm text-muted-foreground">{vehicle.notes}</p>
                      </div>
                    )}

                    {/* Document Status */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Documents:</span>
                      </div>
                      <div className="ml-6 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Title:</span>
                          <Badge variant={vehicle.titlePresent ? "default" : "secondary"}>
                            {vehicle.titlePresent ? "Present" : "Missing"}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Bill of Sale:</span>
                          <Badge variant={vehicle.billOfSale ? "default" : "secondary"}>
                            {vehicle.billOfSale ? "Present" : "Missing"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Paperwork Status */}
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Paperwork Status:</span>
                      <Select
                        value={vehicle.paperwork || ''}
                        onValueChange={(value) => handlePaperworkChange(vehicle.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select paperwork status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVehicle(vehicle)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>

                  <Select
                    value={vehicle.status}
                    onValueChange={(value) => handleStatusChange(vehicle.id, value as Vehicle['status'])}
                  >
                    <SelectTrigger className="w-[120px]">
                      <Edit3 className="w-4 h-4 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yard">In Yard</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="pick-your-part">Pick Your Part</SelectItem>
                      <SelectItem value="sa-recycling">SA Recycling</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCardExpansion(vehicle.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && !searchTerm && (
        <div className="flex justify-center">
          <Button 
            onClick={loadMore} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Loading...' : 'Load More Vehicles'}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedVehicles.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No vehicles found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? `No vehicles match "${searchTerm}"` : 'No vehicles in inventory yet'}
          </p>
          {!searchTerm && (
            <Button onClick={() => onNavigate('intake')}>
              Add Your First Vehicle
            </Button>
          )}
        </div>
      )}

      {/* Dialogs */}
      {selectedVehicle && (
        <VehicleDetailsDialog
          vehicle={selectedVehicle}
          open={!!selectedVehicle}
          onOpenChange={() => setSelectedVehicle(null)}
        />
      )}

      {showSoldDialog && vehicleToSell && (
        <SoldDialog
          vehicle={vehicleToSell}
          open={showSoldDialog}
          onOpenChange={setShowSoldDialog}
          onSubmit={handleSoldSubmit}
        />
      )}
    </div>
  );
}
