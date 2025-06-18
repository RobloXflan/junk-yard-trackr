
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Edit, Save, X, FileText, Upload } from "lucide-react";
import { Vehicle } from "@/stores/vehicleStore";
import { SoldDialog } from "./forms/SoldDialog";
import { toast } from "@/hooks/use-toast";
import { CarImagesUpload } from "./CarImagesUpload";
import { useVehicleStore } from "@/hooks/useVehicleStore";

interface VehicleDetailsDialogProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (vehicleId: string, newStatus: Vehicle['status'], soldData?: any) => Promise<void>;
  onVehicleUpdate?: (vehicleId: string, updateData: Partial<Vehicle>) => Promise<void>;
  refreshVehicles?: () => Promise<void>;
}

export function VehicleDetailsDialog({ 
  vehicle, 
  isOpen, 
  onClose, 
  onStatusUpdate,
  onVehicleUpdate,
  refreshVehicles
}: VehicleDetailsDialogProps) {
  const { updateVehicleStatus: fallbackUpdateStatus, updateVehicleDetails: fallbackUpdateDetails, refreshVehicles: fallbackRefresh } = useVehicleStore();
  
  const [localVehicle, setLocalVehicle] = useState<Vehicle | null>(vehicle);
  const [isEditing, setIsEditing] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState<Vehicle | null>(vehicle);
  const [selectedStatus, setSelectedStatus] = useState<Vehicle['status']>(vehicle?.status || 'yard');
  const [showSoldDialog, setShowSoldDialog] = useState(false);

  useEffect(() => {
    setLocalVehicle(vehicle);
    setEditedVehicle(vehicle);
    setSelectedStatus(vehicle?.status || 'yard');
  }, [vehicle]);

  if (!vehicle || !localVehicle || !editedVehicle) {
    return null;
  }

  const handleStatusChange = async (newStatus: Vehicle['status']) => {
    if (newStatus === 'sold') {
      setShowSoldDialog(true);
      return;
    }

    try {
      console.log('Updating vehicle status to:', newStatus);
      
      // Update local state immediately for smooth UI
      const updatedVehicle = { ...localVehicle, status: newStatus };
      // Clear sold data if status is not sold
      updatedVehicle.buyerFirstName = undefined;
      updatedVehicle.buyerLastName = undefined;
      updatedVehicle.buyerName = undefined;
      updatedVehicle.salePrice = undefined;
      updatedVehicle.saleDate = undefined;
      updatedVehicle.buyerAddress = undefined;
      updatedVehicle.buyerCity = undefined;
      updatedVehicle.buyerState = undefined;
      updatedVehicle.buyerZip = undefined;
      
      setLocalVehicle(updatedVehicle);
      setSelectedStatus(newStatus);

      // Use provided update function or fallback to hook
      const updateFunction = onStatusUpdate || fallbackUpdateStatus;
      await updateFunction(vehicle.id, newStatus);
      
      // Refresh data in both possible data sources
      if (refreshVehicles) {
        await refreshVehicles();
      }
      if (fallbackRefresh) {
        await fallbackRefresh();
      }

      toast({
        title: "Status Updated",
        description: `Vehicle status changed to ${newStatus}`,
      });

    } catch (error) {
      console.error('Failed to update vehicle status:', error);
      
      // Revert local state on error
      setLocalVehicle(vehicle);
      setSelectedStatus(vehicle.status);
      
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
    buyerAddress?: string;
    buyerCity?: string;
    buyerState?: string;
    buyerZip?: string;
  }) => {
    try {
      console.log('Updating vehicle to sold status with data:', soldData);
      
      // Update local state immediately
      const updatedVehicle = {
        ...localVehicle,
        status: 'sold' as Vehicle['status'],
        buyerFirstName: soldData.buyerFirstName,
        buyerLastName: soldData.buyerLastName,
        buyerName: `${soldData.buyerFirstName} ${soldData.buyerLastName}`,
        salePrice: soldData.salePrice,
        saleDate: soldData.saleDate,
        buyerAddress: soldData.buyerAddress,
        buyerCity: soldData.buyerCity,
        buyerState: soldData.buyerState,
        buyerZip: soldData.buyerZip,
      };
      
      setLocalVehicle(updatedVehicle);
      setSelectedStatus('sold');
      setShowSoldDialog(false);

      // Use provided update function or fallback to hook
      const updateFunction = onStatusUpdate || fallbackUpdateStatus;
      await updateFunction(vehicle.id, 'sold', soldData);
      
      // Refresh data in both possible data sources
      if (refreshVehicles) {
        await refreshVehicles();
      }
      if (fallbackRefresh) {
        await fallbackRefresh();
      }

      toast({
        title: "Vehicle Sold",
        description: `Vehicle sold to ${soldData.buyerFirstName} ${soldData.buyerLastName}`,
      });

    } catch (error) {
      console.error('Failed to update vehicle as sold:', error);
      
      // Revert local state on error
      setLocalVehicle(vehicle);
      setSelectedStatus(vehicle.status);
      setShowSoldDialog(false);
      
      toast({
        title: "Error",
        description: "Failed to update vehicle as sold",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        year: editedVehicle.year,
        make: editedVehicle.make,
        model: editedVehicle.model,
        vehicleId: editedVehicle.vehicleId,
        licensePlate: editedVehicle.licensePlate,
        sellerName: editedVehicle.sellerName,
        purchaseDate: editedVehicle.purchaseDate,
        purchasePrice: editedVehicle.purchasePrice,
        notes: editedVehicle.notes,
      };

      // Use provided update function or fallback to hook
      const updateFunction = onVehicleUpdate || fallbackUpdateDetails;
      await updateFunction(vehicle.id, updateData);

      setLocalVehicle(editedVehicle);
      setIsEditing(false);

      toast({
        title: "Vehicle Updated",
        description: "Vehicle details have been updated",
      });
    } catch (error) {
      console.error('Failed to update vehicle details:', error);
      toast({
        title: "Error",
        description: "Failed to update vehicle details",
        variant: "destructive",
      });
    }
  };

  const handleCarImagesUpdate = async (carImages: any[]) => {
    try {
      // This would typically be handled by a separate function
      // but for now we'll just update the local state
      setLocalVehicle(prev => prev ? ({
        ...prev,
        carImages
      }) : null);
      
      toast({
        title: "Images Updated",
        description: "Vehicle images have been updated",
      });
    } catch (error) {
      console.error('Failed to update car images:', error);
      toast({
        title: "Error",
        description: "Failed to update vehicle images",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'yard': return 'bg-blue-500';
      case 'sold': return 'bg-green-500';
      case 'pick-your-part': return 'bg-orange-500';
      case 'sa-recycling': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>
                  {localVehicle.year} {localVehicle.make} {localVehicle.model}
                </span>
                <Badge className={`${getStatusColor(localVehicle.status)} text-white`}>
                  {localVehicle.status}
                </Badge>
              </div>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Selector */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-foreground font-medium">Status</Label>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yard">In Yard</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="pick-your-part">Pick Your Part</SelectItem>
                  <SelectItem value="sa-recycling">SA Recycling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleId" className="text-foreground font-medium">VIN</Label>
                {isEditing ? (
                  <Input
                    id="vehicleId"
                    value={editedVehicle.vehicleId}
                    onChange={(e) => setEditedVehicle({...editedVehicle, vehicleId: e.target.value})}
                    className="border-border focus:border-primary text-foreground"
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{localVehicle.vehicleId}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licensePlate" className="text-foreground font-medium">License Plate</Label>
                {isEditing ? (
                  <Input
                    id="licensePlate"
                    value={editedVehicle.licensePlate || ''}
                    onChange={(e) => setEditedVehicle({...editedVehicle, licensePlate: e.target.value})}
                    className="border-border focus:border-primary text-foreground"
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{localVehicle.licensePlate || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year" className="text-foreground font-medium">Year</Label>
                {isEditing ? (
                  <Input
                    id="year"
                    value={editedVehicle.year}
                    onChange={(e) => setEditedVehicle({...editedVehicle, year: e.target.value})}
                    className="border-border focus:border-primary text-foreground"
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{localVehicle.year}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="make" className="text-foreground font-medium">Make</Label>
                {isEditing ? (
                  <Input
                    id="make"
                    value={editedVehicle.make}
                    onChange={(e) => setEditedVehicle({...editedVehicle, make: e.target.value})}
                    className="border-border focus:border-primary text-foreground"
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{localVehicle.make}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-foreground font-medium">Model</Label>
                {isEditing ? (
                  <Input
                    id="model"
                    value={editedVehicle.model}
                    onChange={(e) => setEditedVehicle({...editedVehicle, model: e.target.value})}
                    className="border-border focus:border-primary text-foreground"
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{localVehicle.model}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellerName" className="text-foreground font-medium">Seller Name</Label>
                {isEditing ? (
                  <Input
                    id="sellerName"
                    value={editedVehicle.sellerName || ''}
                    onChange={(e) => setEditedVehicle({...editedVehicle, sellerName: e.target.value})}
                    className="border-border focus:border-primary text-foreground"
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{localVehicle.sellerName || 'N/A'}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate" className="text-foreground font-medium">Purchase Date</Label>
                {isEditing ? (
                  <div className="flex">
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={editedVehicle.purchaseDate || ''}
                      onChange={(e) => setEditedVehicle({...editedVehicle, purchaseDate: e.target.value})}
                      className="border-border focus:border-primary text-foreground"
                    />
                  </div>
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    {formatDate(localVehicle.purchaseDate)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePrice" className="text-foreground font-medium">Purchase Price</Label>
                {isEditing ? (
                  <Input
                    id="purchasePrice"
                    value={editedVehicle.purchasePrice || ''}
                    onChange={(e) => setEditedVehicle({...editedVehicle, purchasePrice: e.target.value})}
                    className="border-border focus:border-primary text-foreground"
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">
                    {localVehicle.purchasePrice ? `$${localVehicle.purchasePrice}` : 'N/A'}
                  </div>
                )}
              </div>

              {localVehicle.status === 'sold' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="buyerName" className="text-foreground font-medium">Buyer Name</Label>
                    <div className="p-2 border rounded-md bg-muted/20">
                      {localVehicle.buyerName || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saleDate" className="text-foreground font-medium">Sale Date</Label>
                    <div className="p-2 border rounded-md bg-muted/20 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      {formatDate(localVehicle.saleDate)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="salePrice" className="text-foreground font-medium">Sale Price</Label>
                    <div className="p-2 border rounded-md bg-muted/20">
                      {localVehicle.salePrice ? `$${localVehicle.salePrice}` : 'N/A'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground font-medium">Notes</Label>
              {isEditing ? (
                <Textarea
                  id="notes"
                  value={editedVehicle.notes || ''}
                  onChange={(e) => setEditedVehicle({...editedVehicle, notes: e.target.value})}
                  rows={3}
                  className="border-border focus:border-primary text-foreground"
                />
              ) : (
                <div className="p-2 border rounded-md bg-muted/20 min-h-[80px]">
                  {localVehicle.notes || 'No notes'}
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </Label>
              <div className="p-2 border rounded-md bg-muted/20">
                {localVehicle.documents && localVehicle.documents.length > 0 ? (
                  <ul className="space-y-1">
                    {localVehicle.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between">
                        <span>{doc.name}</span>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          View
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No documents uploaded</p>
                )}
              </div>
            </div>

            {/* Car Images */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Vehicle Images
              </Label>
              <CarImagesUpload 
                vehicleId={localVehicle.id}
                carImages={localVehicle.carImages || []}
                onImagesUpdate={handleCarImagesUpdate}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <SoldDialog
        open={showSoldDialog}
        onClose={() => setShowSoldDialog(false)}
        onSubmit={handleSoldSubmit}
        vehicle={localVehicle}
      />
    </>
  );
}
