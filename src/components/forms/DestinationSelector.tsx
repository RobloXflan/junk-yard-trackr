
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SoldDialog } from "./SoldDialog";
import { Vehicle } from "@/stores/vehicleStore";

interface DestinationSelectorProps {
  vehicle: Vehicle;
  onStatusUpdate: (vehicleId: string, status: Vehicle['status'], soldData?: any) => void;
}

export function DestinationSelector({ vehicle, onStatusUpdate }: DestinationSelectorProps) {
  const [isSoldDialogOpen, setIsSoldDialogOpen] = useState(false);

  const handleStatusChange = (newStatus: Vehicle['status']) => {
    if (newStatus === 'sold') {
      setIsSoldDialogOpen(true);
    } else {
      onStatusUpdate(vehicle.id, newStatus);
    }
  };

  const handleSoldConfirm = (soldData: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  }) => {
    onStatusUpdate(vehicle.id, 'sold', soldData);
    setIsSoldDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'yard':
        return 'bg-blue-500';
      case 'sold':
        return 'bg-green-500';
      case 'pick-your-part':
        return 'bg-orange-500';
      case 'sa-recycling':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Current Status:</span>
        <Badge className={getStatusColor(vehicle.status)}>
          {vehicle.status === 'yard' ? 'In Yard' : 
           vehicle.status === 'sold' ? 'Sold' :
           vehicle.status === 'pick-your-part' ? 'Pick Your Part' :
           vehicle.status === 'sa-recycling' ? 'SA Recycling' :
           vehicle.status}
        </Badge>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Update Status:</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={vehicle.status === 'yard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('yard')}
          >
            In Yard
          </Button>
          <Button
            variant={vehicle.status === 'sold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('sold')}
          >
            Sold
          </Button>
          <Button
            variant={vehicle.status === 'pick-your-part' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('pick-your-part')}
          >
            Pick Your Part
          </Button>
          <Button
            variant={vehicle.status === 'sa-recycling' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange('sa-recycling')}
          >
            SA Recycling
          </Button>
        </div>
      </div>

      <SoldDialog
        open={isSoldDialogOpen}
        onOpenChange={setIsSoldDialogOpen}
        vehicle={vehicle}
        onConfirm={handleSoldConfirm}
        initialData={{
          buyerFirstName: vehicle.buyerFirstName || "",
          buyerLastName: vehicle.buyerLastName || "",
          salePrice: vehicle.salePrice || "",
          saleDate: vehicle.saleDate || new Date().toISOString().split('T')[0]
        }}
      />
    </div>
  );
}
