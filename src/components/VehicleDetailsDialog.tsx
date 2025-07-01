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
import { BuyerSelector } from "./forms/BuyerSelector";
import { toast } from "@/hooks/use-toast";
import { CarImagesUpload } from "./CarImagesUpload";
import { DocumentUpload, UploadedDocument } from "./forms/DocumentUpload";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { Buyer } from "@/hooks/useBuyers";
import { supabase } from "@/integrations/supabase/client";

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
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);

  useEffect(() => {
    setLocalVehicle(vehicle);
    setEditedVehicle(vehicle);
    setSelectedStatus(vehicle?.status || 'yard');
    // Initialize with empty array for new documents
    setUploadedDocuments([]);
  }, [vehicle]);

  if (!vehicle || !localVehicle || !editedVehicle) {
    return null;
  }

  // Helper function to serialize documents for database storage
  const serializeDocuments = (documents: UploadedDocument[]) => {
    return documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      size: doc.size,
      url: doc.url,
      // Don't store the File object, just the essential data
    }));
  };

  const handleStatusChange = async (newStatus: Vehicle['status']) => {
    if (newStatus === 'sold') {
      setShowBuyerSelector(true);
      return;
    }

    try {
      console.log('Updating vehicle status to:', newStatus);
      
      const updatedVehicle = { ...localVehicle, status: newStatus };
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

      const updateFunction = onStatusUpdate || fallbackUpdateStatus;
      await updateFunction(vehicle.id, newStatus);
      
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

      const updateFunction = onStatusUpdate || fallbackUpdateStatus;
      await updateFunction(vehicle.id, 'sold', soldData);
      
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

      console.log('Saving vehicle details:', updateData);

      const updateFunction = onVehicleUpdate || fallbackUpdateDetails;
      await updateFunction(vehicle.id, updateData);

      const updatedVehicle = { ...localVehicle, ...updateData };
      setLocalVehicle(updatedVehicle);
      setEditedVehicle(updatedVehicle);
      setIsEditing(false);

      if (refreshVehicles) {
        await refreshVehicles();
      }
      if (fallbackRefresh) {
        await fallbackRefresh();
      }

      toast({
        title: "Vehicle Updated",
        description: "Vehicle details have been updated successfully",
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
      const updatedVehicle = { ...localVehicle, carImages };
      setLocalVehicle(updatedVehicle);
      setEditedVehicle(updatedVehicle);
      
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

  const handleDocumentsUpdate = async (newDocuments: UploadedDocument[]) => {
    try {
      // Combine existing documents with new documents
      const existingDocuments = localVehicle.documents || [];
      const serializedNewDocuments = serializeDocuments(newDocuments);
      const allDocuments = [...existingDocuments, ...serializedNewDocuments];
      
      // Update the database with combined documents
      const { error } = await supabase
        .from('vehicles')
        .update({
          documents: allDocuments,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicle.id);

      if (error) throw error;

      // Update local state
      const updatedVehicle = { ...localVehicle, documents: allDocuments };
      setLocalVehicle(updatedVehicle);
      setEditedVehicle(updatedVehicle);
      
      // Clear the upload state
      setUploadedDocuments([]);
      
      // Refresh the vehicles list
      if (refreshVehicles) {
        await refreshVehicles();
      }
      if (fallbackRefresh) {
        await fallbackRefresh();
      }

      toast({
        title: "Documents Updated",
        description: `${newDocuments.length} new document(s) added successfully`,
      });

    } catch (error) {
      console.error('Failed to update vehicle documents:', error);
      toast({
        title: "Error",
        description: "Failed to update vehicle documents",
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
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditedVehicle(localVehicle);
                    setIsEditing(false);
                  }}>
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
                    <Label htmlFor="buyerAddress" className="text-foreground font-medium">Buyer Address</Label>
                    <div className="p-2 border rounded-md bg-muted/20">
                      {localVehicle.buyerAddress ? (
                        <div>
                          <div>{localVehicle.buyerAddress}</div>
                          {(localVehicle.buyerCity || localVehicle.buyerState || localVehicle.buyerZip) && (
                            <div className="text-sm text-muted-foreground">
                              {localVehicle.buyerCity && localVehicle.buyerCity}
                              {localVehicle.buyerCity && localVehicle.buyerState && ', '}
                              {localVehicle.buyerState && localVehicle.buyerState}
                              {localVehicle.buyerZip && ` ${localVehicle.buyerZip}`}
                            </div>
                          )}
                        </div>
                      ) : 'N/A'}
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

            {/* Documents Section - Enhanced with Upload Capability */}
            <div className="space-y-4">
              <Label className="text-foreground font-medium flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Documents
              </Label>
              
              {/* Existing Documents Display */}
              {localVehicle.documents && localVehicle.documents.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Existing Documents:</div>
                  <div className="p-3 border rounded-md bg-muted/20">
                    <div className="space-y-2">
                      {localVehicle.documents.map((doc, index) => (
                        <div key={`existing-${index}`} className="flex items-center justify-between py-1">
                          <span className="text-sm">{doc.name}</span>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm font-medium"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Document Upload Section */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Add New Documents:</div>
                <DocumentUpload
                  uploadedDocuments={uploadedDocuments}
                  onDocumentsChange={setUploadedDocuments}
                />
                
                {/* Save Documents Button */}
                {uploadedDocuments.length > 0 && (
                  <div className="pt-2">
                    <Button 
                      onClick={() => handleDocumentsUpdate(uploadedDocuments)}
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Save {uploadedDocuments.length} New Document{uploadedDocuments.length > 1 ? 's' : ''} to Vehicle
                    </Button>
                  </div>
                )}
              </div>
              
              {/* No Documents Message */}
              {(!localVehicle.documents || localVehicle.documents.length === 0) && uploadedDocuments.length === 0 && (
                <div className="p-3 border rounded-md bg-muted/20">
                  <p className="text-muted-foreground text-sm">No documents uploaded yet</p>
                </div>
              )}
            </div>

            {/* Car Images */}
            <div className="space-y-2">
              <Label className="text-foreground font-medium flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Vehicle Images
              </Label>
              <CarImagesUpload 
                vehicleId={localVehicle.id}
                currentImages={localVehicle.carImages || []}
                onImagesUpdate={handleCarImagesUpdate}
              />
            </div>
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
