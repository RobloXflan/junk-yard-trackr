
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Vehicle } from "@/stores/vehicleStore";

interface VehicleBasicDetailsProps {
  vehicle: Vehicle;
  isEditing: boolean;
  editedVehicle: Vehicle;
  onVehicleUpdate: (updates: Partial<Vehicle>) => void;
}

export function VehicleBasicDetails({ 
  vehicle, 
  isEditing, 
  editedVehicle, 
  onVehicleUpdate 
}: VehicleBasicDetailsProps) {
  const handleFieldChange = (field: keyof Vehicle, value: string) => {
    onVehicleUpdate({ [field]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="vehicleId" className="text-foreground font-medium">VIN</Label>
        {isEditing ? (
          <Input
            id="vehicleId"
            value={editedVehicle.vehicleId}
            onChange={(e) => handleFieldChange('vehicleId', e.target.value)}
            className="border-border focus:border-primary text-foreground"
          />
        ) : (
          <div className="p-2 border rounded-md bg-muted/20">{vehicle.vehicleId}</div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="licensePlate" className="text-foreground font-medium">License Plate</Label>
        {isEditing ? (
          <Input
            id="licensePlate"
            value={editedVehicle.licensePlate || ''}
            onChange={(e) => handleFieldChange('licensePlate', e.target.value)}
            className="border-border focus:border-primary text-foreground"
          />
        ) : (
          <div className="p-2 border rounded-md bg-muted/20">{vehicle.licensePlate || 'N/A'}</div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="year" className="text-foreground font-medium">Year</Label>
        {isEditing ? (
          <Input
            id="year"
            value={editedVehicle.year}
            onChange={(e) => handleFieldChange('year', e.target.value)}
            className="border-border focus:border-primary text-foreground"
          />
        ) : (
          <div className="p-2 border rounded-md bg-muted/20">{vehicle.year}</div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="make" className="text-foreground font-medium">Make</Label>
        {isEditing ? (
          <Input
            id="make"
            value={editedVehicle.make}
            onChange={(e) => handleFieldChange('make', e.target.value)}
            className="border-border focus:border-primary text-foreground"
          />
        ) : (
          <div className="p-2 border rounded-md bg-muted/20">{vehicle.make}</div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="model" className="text-foreground font-medium">Model</Label>
        {isEditing ? (
          <Input
            id="model"
            value={editedVehicle.model}
            onChange={(e) => handleFieldChange('model', e.target.value)}
            className="border-border focus:border-primary text-foreground"
          />
        ) : (
          <div className="p-2 border rounded-md bg-muted/20">{vehicle.model}</div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sellerName" className="text-foreground font-medium">Seller Name</Label>
        {isEditing ? (
          <Input
            id="sellerName"
            value={editedVehicle.sellerName || ''}
            onChange={(e) => handleFieldChange('sellerName', e.target.value)}
            className="border-border focus:border-primary text-foreground"
          />
        ) : (
          <div className="p-2 border rounded-md bg-muted/20">{vehicle.sellerName || 'N/A'}</div>
        )}
      </div>
    </div>
  );
}
