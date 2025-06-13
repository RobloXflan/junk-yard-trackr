
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Vehicle } from "@/stores/vehicleStore";
import { Save, X } from "lucide-react";

interface VehicleDetailsDialogProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicleId: string, newStatus: Vehicle['status']) => void;
}

export function VehicleDetailsDialog({ vehicle, isOpen, onClose, onSave }: VehicleDetailsDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<Vehicle['status']>(vehicle?.status || 'yard');

  if (!vehicle) return null;

  const handleSave = () => {
    onSave(vehicle.id, selectedStatus);
    onClose();
  };

  const getStatusLabel = (status: Vehicle['status']) => {
    switch (status) {
      case 'yard': return 'In Yard';
      case 'sold': return 'Sold';
      case 'pick-your-part': return 'Pick Your Part';
      case 'sa-recycling': return 'SA Recycling';
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Vehicle Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle ID:</span>
                  <span className="font-mono">{vehicle.vehicleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">License Plate:</span>
                  <span>{vehicle.licensePlate || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller:</span>
                  <span>{vehicle.sellerName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Date:</span>
                  <span>{vehicle.purchaseDate || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Price:</span>
                  <span>{vehicle.purchasePrice ? `$${parseFloat(vehicle.purchasePrice).toLocaleString()}` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sale Price:</span>
                  <span>{vehicle.salePrice ? `$${parseFloat(vehicle.salePrice).toLocaleString()}` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Status:</span>
                  <Badge variant={
                    vehicle.status === 'sold' ? 'default' :
                    vehicle.status === 'yard' ? 'secondary' :
                    'outline'
                  }>
                    {getStatusLabel(vehicle.status)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Status Editor */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Update Status</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="status">New Status</Label>
                  <Select value={selectedStatus} onValueChange={(value: Vehicle['status']) => setSelectedStatus(value)}>
                    <SelectTrigger>
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
                
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Status
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>

            {/* Notes */}
            {vehicle.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {vehicle.notes}
                </p>
              </div>
            )}
          </div>

          {/* Images */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Vehicle Images</h3>
            {vehicle.documents && vehicle.documents.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {vehicle.documents.map((doc) => (
                  <div key={doc.id} className="border rounded-lg overflow-hidden">
                    <img 
                      src={doc.url} 
                      alt="Vehicle document"
                      className="w-full h-auto max-h-96 object-contain bg-muted"
                      onError={(e) => {
                        console.log('Image failed to load:', doc.url);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No images available for this vehicle</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
