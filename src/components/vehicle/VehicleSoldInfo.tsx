
import { Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Vehicle } from "@/stores/vehicleStore";

interface VehicleSoldInfoProps {
  vehicle: Vehicle;
}

export function VehicleSoldInfo({ vehicle }: VehicleSoldInfoProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (vehicle.status !== 'sold') {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="buyerName" className="text-foreground font-medium">Buyer Name</Label>
        <div className="p-2 border rounded-md bg-muted/20">
          {vehicle.buyerName || 'N/A'}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="buyerAddress" className="text-foreground font-medium">Buyer Address</Label>
        <div className="p-2 border rounded-md bg-muted/20">
          {vehicle.buyerAddress ? (
            <div>
              <div>{vehicle.buyerAddress}</div>
              {(vehicle.buyerCity || vehicle.buyerState || vehicle.buyerZip) && (
                <div className="text-sm text-muted-foreground">
                  {vehicle.buyerCity && vehicle.buyerCity}
                  {vehicle.buyerCity && vehicle.buyerState && ', '}
                  {vehicle.buyerState && vehicle.buyerState}
                  {vehicle.buyerZip && ` ${vehicle.buyerZip}`}
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
          {formatDate(vehicle.saleDate)}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="salePrice" className="text-foreground font-medium">Sale Price</Label>
        <div className="p-2 border rounded-md bg-muted/20">
          {vehicle.salePrice ? `$${vehicle.salePrice}` : 'N/A'}
        </div>
      </div>
    </div>
  );
}
