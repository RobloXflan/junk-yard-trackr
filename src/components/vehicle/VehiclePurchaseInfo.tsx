
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Vehicle } from "@/stores/vehicleStore";

interface VehiclePurchaseInfoProps {
  vehicle: Vehicle;
  isEditing: boolean;
  editedVehicle: Vehicle;
  onVehicleUpdate: (updates: Partial<Vehicle>) => void;
}

export function VehiclePurchaseInfo({ 
  vehicle, 
  isEditing, 
  editedVehicle, 
  onVehicleUpdate 
}: VehiclePurchaseInfoProps) {
  const handleFieldChange = (field: keyof Vehicle, value: string) => {
    onVehicleUpdate({ [field]: value });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="purchaseDate" className="text-foreground font-medium">Purchase Date</Label>
        {isEditing ? (
          <div className="flex">
            <Input
              id="purchaseDate"
              type="date"
              value={editedVehicle.purchaseDate || ''}
              onChange={(e) => handleFieldChange('purchaseDate', e.target.value)}
              className="border-border focus:border-primary text-foreground"
            />
          </div>
        ) : (
          <div className="p-2 border rounded-md bg-muted/20 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
            {formatDate(vehicle.purchaseDate)}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchasePrice" className="text-foreground font-medium">Purchase Price</Label>
        {isEditing ? (
          <Input
            id="purchasePrice"
            value={editedVehicle.purchasePrice || ''}
            onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
            className="border-border focus:border-primary text-foreground"
          />
        ) : (
          <div className="p-2 border rounded-md bg-muted/20">
            {vehicle.purchasePrice ? `$${vehicle.purchasePrice}` : 'N/A'}
          </div>
        )}
      </div>
    </div>
  );
}
