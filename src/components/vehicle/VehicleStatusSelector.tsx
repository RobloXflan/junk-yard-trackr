
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Vehicle } from "@/stores/vehicleStore";

interface VehicleStatusSelectorProps {
  status: Vehicle['status'];
  onStatusChange: (status: Vehicle['status']) => void;
}

export function VehicleStatusSelector({ status, onStatusChange }: VehicleStatusSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="status" className="text-foreground font-medium">Status</Label>
      <Select value={status} onValueChange={onStatusChange}>
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
  );
}
