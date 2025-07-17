
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VehicleDetailsProps {
  formData: {
    year: string;
    make: string;
    model: string;
    vehicleId: string;
    licensePlate: string;
  };
  onInputChange: (field: string, value: any) => void;
}

export function VehicleDetails({ formData, onInputChange }: VehicleDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year" className="text-foreground font-medium">Year *</Label>
          <Input
            id="year"
            type="number"
            placeholder="2015"
            value={formData.year}
            onChange={(e) => onInputChange("year", e.target.value)}
            required
            className="border-border focus:border-primary text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="make" className="text-foreground font-medium">Make *</Label>
          <Input
            id="make"
            placeholder="Honda"
            value={formData.make}
            onChange={(e) => onInputChange("make", e.target.value)}
            required
            className="border-border focus:border-primary text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model" className="text-foreground font-medium">Model *</Label>
          <Input
            id="model"
            placeholder="Civic"
            value={formData.model}
            onChange={(e) => onInputChange("model", e.target.value)}
            required
            className="border-border focus:border-primary text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicleId" className="text-foreground font-medium">Vehicle ID (Last 5 of VIN) *</Label>
          <Input
            id="vehicleId"
            placeholder="09186"
            value={formData.vehicleId}
            onChange={(e) => onInputChange("vehicleId", e.target.value.toUpperCase())}
            required
            maxLength={5}
            className="border-border focus:border-primary text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="licensePlate" className="text-foreground font-medium">License Plate</Label>
          <Input
            id="licensePlate"
            placeholder="ABC123"
            value={formData.licensePlate}
            onChange={(e) => onInputChange("licensePlate", e.target.value)}
            className="border-border focus:border-primary text-foreground"
          />
        </div>
      </div>
    </div>
  );
}
