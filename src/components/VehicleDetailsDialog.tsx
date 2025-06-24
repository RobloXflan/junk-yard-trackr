
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Vehicle } from "@/stores/vehicleStore";
import { BuyerSelector } from "./forms/BuyerSelector";
import { toast } from "@/hooks/use-toast";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { Buyer } from "@/hooks/useBuyers";
import { VehicleDialogHeader } from "./vehicle/VehicleDialogHeader";
import { VehicleStatusSelector } from "./vehicle/VehicleStatusSelector";
import { VehicleBasicDetails } from "./vehicle/VehicleBasicDetails";
import { VehiclePurchaseInfo } from "./vehicle/VehiclePurchaseInfo";
import { VehicleSoldInfo } from "./vehicle/VehicleSoldInfo";
import { VehicleNotes } from "./vehicle/VehicleNotes";
import { VehicleDocuments } from "./vehicle/VehicleDocuments";
import { VehicleImages } from "./vehicle/VehicleImages";

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
  const [showBuyerSelector, setShowBuyerSelector] = useState(false);

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
      setShowBuyerSelector(true);
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

  const handleBuyerSelected = async (buyer: Buyer, salePrice: string, saleDate: string) => {
    try {
      console.log('Updating vehicle to sold status with buyer:', buyer);
      
      const soldData = {
        buyerFirstName: buyer.first_name,
        buyerLastName: buyer.last_name,
        salePrice,
        saleDate,
        buyerAddress: buyer.address,
        buyerCity: buyer.city,
        buyerState: buyer.state,
        buyerZip: buyer.zip_code,
      };
      
      // Update local state immediately
      const updatedVehicle = {
        ...localVehicle,
        status: 'sold' as Vehicle['status'],
        buyerFirstName: buyer.first_name,
        buyerLastName: buyer.last_name,
        buyerName: `${buyer.first_name} ${buyer.last_name}`,
        salePrice,
        saleDate,
        buyerAddress: buyer.address,
        buyerCity: buyer.city,
        buyerState: buyer.state,
        buyerZip: buyer.zip_code,
      };
      
      setLocalVehicle(updatedVehicle);
      setSelectedStatus('sold');
      setShowBuyerSelector(false);

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
        description: `Vehicle sold to ${buyer.first_name} ${buyer.last_name}`,
      });

    } catch (error) {
      console.error('Failed to update vehicle as sold:', error);
      
      // Revert local state on error
      setLocalVehicle(vehicle);
      setSelectedStatus(vehicle.status);
      setShowBuyerSelector(false);
      
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

  const handleVehicleUpdate = (updates: Partial<Vehicle>) => {
    setEditedVehicle(prev => prev ? { ...prev, ...updates } : null);
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <VehicleDialogHeader
            vehicle={localVehicle}
            isEditing={isEditing}
            onEditToggle={() => setIsEditing(true)}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
          />

          <div className="space-y-6">
            {/* Status Selector */}
            <VehicleStatusSelector
              status={selectedStatus}
              onStatusChange={handleStatusChange}
            />

            {/* Vehicle Details */}
            <VehicleBasicDetails
              vehicle={localVehicle}
              isEditing={isEditing}
              editedVehicle={editedVehicle}
              onVehicleUpdate={handleVehicleUpdate}
            />

            {/* Purchase Information */}
            <VehiclePurchaseInfo
              vehicle={localVehicle}
              isEditing={isEditing}
              editedVehicle={editedVehicle}
              onVehicleUpdate={handleVehicleUpdate}
            />

            {/* Sold Information */}
            <VehicleSoldInfo vehicle={localVehicle} />

            {/* Notes */}
            <VehicleNotes
              vehicle={localVehicle}
              isEditing={isEditing}
              editedVehicle={editedVehicle}
              onVehicleUpdate={handleVehicleUpdate}
            />

            {/* Documents */}
            <VehicleDocuments vehicle={localVehicle} />

            {/* Car Images */}
            <VehicleImages 
              vehicle={localVehicle}
              onImagesUpdate={handleCarImagesUpdate}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <BuyerSelector
        open={showBuyerSelector}
        onOpenChange={(open) => setShowBuyerSelector(open)}
        onSelectBuyer={handleBuyerSelected}
      />
    </>
  );
}
