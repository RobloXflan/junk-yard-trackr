
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { CarImagesUpload } from "../CarImagesUpload";
import { Vehicle, CarImage } from "@/stores/vehicleStore";

interface VehicleImagesProps {
  vehicle: Vehicle;
  onImagesUpdate: (images: CarImage[]) => void;
}

export function VehicleImages({ vehicle, onImagesUpdate }: VehicleImagesProps) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground font-medium flex items-center">
        <Upload className="w-4 h-4 mr-2" />
        Vehicle Images
      </Label>
      <CarImagesUpload 
        vehicleId={vehicle.id}
        currentImages={vehicle.carImages || []}
        onImagesUpdate={onImagesUpdate}
      />
    </div>
  );
}
