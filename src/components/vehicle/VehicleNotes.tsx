
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Vehicle } from "@/stores/vehicleStore";

interface VehicleNotesProps {
  vehicle: Vehicle;
  isEditing: boolean;
  editedVehicle: Vehicle;
  onVehicleUpdate: (updates: Partial<Vehicle>) => void;
}

export function VehicleNotes({ 
  vehicle, 
  isEditing, 
  editedVehicle, 
  onVehicleUpdate 
}: VehicleNotesProps) {
  const handleNotesChange = (value: string) => {
    onVehicleUpdate({ notes: value });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="notes" className="text-foreground font-medium">Notes</Label>
      {isEditing ? (
        <Textarea
          id="notes"
          value={editedVehicle.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={3}
          className="border-border focus:border-primary text-foreground"
        />
      ) : (
        <div className="p-2 border rounded-md bg-muted/20 min-h-[80px]">
          {vehicle.notes || 'No notes'}
        </div>
      )}
    </div>
  );
}
