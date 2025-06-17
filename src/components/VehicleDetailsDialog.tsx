
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { 
  Car, 
  Calendar, 
  DollarSign, 
  FileText, 
  User,
  Package,
  ExternalLink,
  Download,
  Edit,
  Save,
  X
} from "lucide-react";
import { Vehicle } from "@/stores/vehicleStore";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { SoldDialog } from "@/components/forms/SoldDialog";
import { toast } from "sonner";

interface VehicleDetailsDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleDetailsDialog({ vehicle, open, onOpenChange }: VehicleDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Vehicle>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSoldDialog, setShowSoldDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Vehicle['status']>('yard');
  const { updateVehicleDetails, updateVehicleStatus } = useVehicleStore();

  useEffect(() => {
    if (vehicle) {
      setEditData({
        vehicleId: vehicle.vehicleId,
        licensePlate: vehicle.licensePlate || '',
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        sellerName: vehicle.sellerName || '',
        purchaseDate: vehicle.purchaseDate || '',
        purchasePrice: vehicle.purchasePrice || '',
        salePrice: vehicle.salePrice || '',
        saleDate: vehicle.saleDate || '',
        buyerFirstName: vehicle.buyerFirstName || '',
        buyerLastName: vehicle.buyerLastName || '',
        notes: vehicle.notes || ''
      });
      setSelectedStatus(vehicle.status);
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateVehicleDetails(vehicle.id, editData);
      toast.success("Vehicle details updated successfully");
      setIsEditing(false);
      // Close and reopen dialog to refresh data
      onOpenChange(false);
      setTimeout(() => onOpenChange(true), 100);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error("Failed to update vehicle details");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset edit data to original values
    setEditData({
      vehicleId: vehicle.vehicleId,
      licensePlate: vehicle.licensePlate || '',
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      sellerName: vehicle.sellerName || '',
      purchaseDate: vehicle.purchaseDate || '',
      purchasePrice: vehicle.purchasePrice || '',
      salePrice: vehicle.salePrice || '',
      saleDate: vehicle.saleDate || '',
      buyerFirstName: vehicle.buyerFirstName || '',
      buyerLastName: vehicle.buyerLastName || '',
      notes: vehicle.notes || ''
    });
  };

  const handleStatusChange = async (newStatus: Vehicle['status']) => {
    if (newStatus === 'sold') {
      setShowSoldDialog(true);
    } else {
      try {
        await updateVehicleStatus(vehicle.id, newStatus);
        setSelectedStatus(newStatus);
        toast.success(`Vehicle status updated to ${newStatus}`);
        // Refresh the dialog
        onOpenChange(false);
        setTimeout(() => onOpenChange(true), 100);
      } catch (error) {
        console.error('Error updating vehicle status:', error);
        toast.error("Failed to update vehicle status");
      }
    }
  };

  const handleSoldConfirm = async (soldData: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  }) => {
    try {
      await updateVehicleStatus(vehicle.id, 'sold', soldData);
      setSelectedStatus('sold');
      setShowSoldDialog(false);
      toast.success("Vehicle marked as sold");
      // Refresh the dialog
      onOpenChange(false);
      setTimeout(() => onOpenChange(true), 100);
    } catch (error) {
      console.error('Error marking vehicle as sold:', error);
      toast.error("Failed to mark vehicle as sold");
    }
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

  const handleDownloadDocument = (document: any) => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                {vehicle.year} {vehicle.make} {vehicle.model}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(vehicle.status)} text-white`}>
                  {getStatusDisplay(vehicle.status)}
                </Badge>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Change Section - Only for Main Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Vehicle Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Current Status</Label>
                  <Select value={selectedStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yard">In Yard</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="pick-your-part">Pick Your Part</SelectItem>
                      <SelectItem value="sa-recycling">SA Recycling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Car Images Section */}
            {vehicle.carImages && vehicle.carImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Car Images ({vehicle.carImages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicle.carImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                          <img
                            src={image.url}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Image ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(image.url, '_blank')}
                            onError={(e) => {
                              console.error('Error loading car image:', image.url);
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-xs text-muted-foreground truncate flex-1">
                            {image.name}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(image.url, '_blank')}
                            className="h-6 w-6 p-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Vehicle ID</Label>
                    {isEditing ? (
                      <Input
                        value={editData.vehicleId || ''}
                        onChange={(e) => setEditData({...editData, vehicleId: e.target.value})}
                        placeholder="Vehicle ID"
                      />
                    ) : (
                      <p className="font-medium">{vehicle.vehicleId}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">License Plate</Label>
                    {isEditing ? (
                      <Input
                        value={editData.licensePlate || ''}
                        onChange={(e) => setEditData({...editData, licensePlate: e.target.value})}
                        placeholder="License Plate"
                      />
                    ) : (
                      <p className="font-medium">{vehicle.licensePlate || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Year</Label>
                    {isEditing ? (
                      <Input
                        value={editData.year || ''}
                        onChange={(e) => setEditData({...editData, year: e.target.value})}
                        placeholder="Year"
                      />
                    ) : (
                      <p className="font-medium">{vehicle.year}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Make</Label>
                    {isEditing ? (
                      <Input
                        value={editData.make || ''}
                        onChange={(e) => setEditData({...editData, make: e.target.value})}
                        placeholder="Make"
                      />
                    ) : (
                      <p className="font-medium">{vehicle.make}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Model</Label>
                    {isEditing ? (
                      <Input
                        value={editData.model || ''}
                        onChange={(e) => setEditData({...editData, model: e.target.value})}
                        placeholder="Model"
                      />
                    ) : (
                      <p className="font-medium">{vehicle.model}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Purchase Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Driver</Label>
                    {isEditing ? (
                      <Input
                        value={editData.sellerName || ''}
                        onChange={(e) => setEditData({...editData, sellerName: e.target.value})}
                        placeholder="Driver Name"
                      />
                    ) : (
                      <p className="font-medium">{vehicle.sellerName || 'N/A'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Purchase Price</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData.purchasePrice || ''}
                        onChange={(e) => setEditData({...editData, purchasePrice: e.target.value})}
                        placeholder="Purchase Price"
                      />
                    ) : (
                      <p className="font-medium">{vehicle.purchasePrice ? `$${parseFloat(vehicle.purchasePrice).toLocaleString()}` : 'N/A'}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Purchase Date</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.purchaseDate || ''}
                      onChange={(e) => setEditData({...editData, purchaseDate: e.target.value})}
                    />
                  ) : (
                    <p className="font-medium">{vehicle.purchaseDate || 'N/A'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Paperwork Status</p>
                  <p className="font-medium">{formatPaperworkDisplay(vehicle.paperwork, vehicle.paperworkOther)}</p>
                </div>
                {vehicle.documents && vehicle.documents.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Documents ({vehicle.documents.length})</h4>
                    <div className="space-y-2">
                      {vehicle.documents.map((doc: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{doc.name || `Document ${index + 1}`}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sale Information (if sold) */}
            {vehicle.status === 'sold' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Sale Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Buyer First Name</Label>
                      {isEditing ? (
                        <Input
                          value={editData.buyerFirstName || ''}
                          onChange={(e) => setEditData({...editData, buyerFirstName: e.target.value})}
                          placeholder="First Name"
                        />
                      ) : (
                        <p className="font-medium">{vehicle.buyerFirstName || 'N/A'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Buyer Last Name</Label>
                      {isEditing ? (
                        <Input
                          value={editData.buyerLastName || ''}
                          onChange={(e) => setEditData({...editData, buyerLastName: e.target.value})}
                          placeholder="Last Name"
                        />
                      ) : (
                        <p className="font-medium">{vehicle.buyerLastName || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Sale Price</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editData.salePrice || ''}
                          onChange={(e) => setEditData({...editData, salePrice: e.target.value})}
                          placeholder="Sale Price"
                        />
                      ) : (
                        <p className="font-medium">{vehicle.salePrice ? `$${parseFloat(vehicle.salePrice).toLocaleString()}` : 'N/A'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Sale Date</Label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editData.saleDate || ''}
                          onChange={(e) => setEditData({...editData, saleDate: e.target.value})}
                        />
                      ) : (
                        <p className="font-medium">{vehicle.saleDate || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  {vehicle.buyerAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground">Buyer Address</p>
                      <p className="font-medium">
                        {vehicle.buyerAddress}
                        {vehicle.buyerCity && `, ${vehicle.buyerCity}`}
                        {vehicle.buyerState && `, ${vehicle.buyerState}`}
                        {vehicle.buyerZip && ` ${vehicle.buyerZip}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Additional Notes</Label>
                  {isEditing ? (
                    <textarea
                      className="w-full min-h-20 p-3 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      value={editData.notes || ''}
                      onChange={(e) => setEditData({...editData, notes: e.target.value})}
                      placeholder="Enter any additional notes..."
                    />
                  ) : (
                    <p className="font-medium">{vehicle.notes || 'No notes available'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sold Dialog */}
      <SoldDialog
        open={showSoldDialog}
        onOpenChange={setShowSoldDialog}
        onConfirm={handleSoldConfirm}
        initialData={{
          buyerFirstName: vehicle.buyerFirstName || '',
          buyerLastName: vehicle.buyerLastName || '',
          salePrice: vehicle.salePrice || '',
          saleDate: vehicle.saleDate || new Date().toISOString().split('T')[0]
        }}
      />
    </>
  );
}
