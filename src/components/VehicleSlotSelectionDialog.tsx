import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Car, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface VehicleSlotSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSlotSelected: (slot: 1 | 2) => void;
  tripNumber: number;
  vehicleData: any;
}

export function VehicleSlotSelectionDialog({ 
  open, 
  onClose, 
  onSlotSelected, 
  tripNumber,
  vehicleData 
}: VehicleSlotSelectionDialogProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Get existing trip data
  const getTripData = () => {
    const tripKey = `sa-trip-${today}-${tripNumber}`;
    const tripData = localStorage.getItem(tripKey);
    if (!tripData) return { vehicle1: null, vehicle2: null };
    return JSON.parse(tripData);
  };

  const tripData = getTripData();
  const slot1Available = !tripData.vehicle1;
  const slot2Available = !tripData.vehicle2;

  const handleSlotClick = (slot: 1 | 2) => {
    if (slot === 1 && !slot1Available) return;
    if (slot === 2 && !slot2Available) return;
    onSlotSelected(slot);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Select Vehicle Slot
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Trip {tripNumber} - {format(new Date(), 'MMM d, yyyy')}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Adding: {vehicleData?.year} {vehicleData?.make} {vehicleData?.model} ({vehicleData?.vehicleId})
          </div>

          <div className="space-y-3">
            {/* Vehicle Slot 1 */}
            <Card 
              className={`cursor-pointer transition-colors ${
                slot1Available ? 'hover:bg-muted/50' : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => handleSlotClick(1)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                      1
                    </div>
                    <div>
                      <div className="font-medium">Vehicle Slot 1</div>
                      {tripData.vehicle1 && (
                        <div className="text-sm text-muted-foreground">
                          {tripData.vehicle1.year} {tripData.vehicle1.make} {tripData.vehicle1.model}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {slot1Available ? (
                    <div className="px-2 py-1 rounded-md text-xs bg-green-100 text-green-700">
                      Available
                    </div>
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Slot 2 */}
            <Card 
              className={`cursor-pointer transition-colors ${
                slot2Available ? 'hover:bg-muted/50' : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => handleSlotClick(2)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-medium">
                      2
                    </div>
                    <div>
                      <div className="font-medium">Vehicle Slot 2</div>
                      {tripData.vehicle2 && (
                        <div className="text-sm text-muted-foreground">
                          {tripData.vehicle2.year} {tripData.vehicle2.make} {tripData.vehicle2.model}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {slot2Available ? (
                    <div className="px-2 py-1 rounded-md text-xs bg-green-100 text-green-700">
                      Available
                    </div>
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}