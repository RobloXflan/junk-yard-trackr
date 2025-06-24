
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Save, X } from "lucide-react";
import { Vehicle } from "@/stores/vehicleStore";

interface VehicleDialogHeaderProps {
  vehicle: Vehicle;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export function VehicleDialogHeader({ 
  vehicle, 
  isEditing, 
  onEditToggle, 
  onSave, 
  onCancel 
}: VehicleDialogHeaderProps) {
  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'yard': return 'bg-blue-500';
      case 'sold': return 'bg-green-500';
      case 'pick-your-part': return 'bg-orange-500';
      case 'sa-recycling': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <DialogHeader>
      <DialogTitle className="text-xl font-bold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </span>
          <Badge className={`${getStatusColor(vehicle.status)} text-white`}>
            {vehicle.status}
          </Badge>
        </div>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={onEditToggle}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={onSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        )}
      </DialogTitle>
    </DialogHeader>
  );
}
