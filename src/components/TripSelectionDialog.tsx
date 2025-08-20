import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Calendar, Truck } from "lucide-react";
import { format } from "date-fns";

interface TripSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onTripSelected: (tripNumber: number) => void;
  vehicleData: any;
}

export function TripSelectionDialog({ 
  open, 
  onClose, 
  onTripSelected, 
  vehicleData 
}: TripSelectionDialogProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Get existing trip data for today
  const getTripStatus = (tripNumber: number) => {
    const tripKey = `sa-trip-${today}-${tripNumber}`;
    const tripData = localStorage.getItem(tripKey);
    if (!tripData) return { vehicle1: null, vehicle2: null, isFull: false };
    
    const parsed = JSON.parse(tripData);
    return {
      vehicle1: parsed.vehicle1,
      vehicle2: parsed.vehicle2,
      isFull: parsed.vehicle1 && parsed.vehicle2
    };
  };

  const handleTripClick = (tripNumber: number) => {
    const tripStatus = getTripStatus(tripNumber);
    if (tripStatus.isFull) {
      return; // Trip is full, don't allow selection
    }
    onTripSelected(tripNumber);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Select SA Recycling Trip
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {format(new Date(), 'MMMM d, yyyy')}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Vehicle: {vehicleData?.year} {vehicleData?.make} {vehicleData?.model} ({vehicleData?.vehicleId})
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3, 4, 5].map((tripNumber) => {
              const tripStatus = getTripStatus(tripNumber);
              const isFull = tripStatus.isFull;
              
              return (
                <Card 
                  key={tripNumber} 
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    isFull ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => handleTripClick(tripNumber)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                          {tripNumber}
                        </div>
                        <div>
                          <div className="font-medium">Trip {tripNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <div className={`px-2 py-1 rounded-md text-xs ${
                          tripStatus.vehicle1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          Slot 1: {tripStatus.vehicle1 ? 'Filled' : 'Available'}
                        </div>
                        <div className={`px-2 py-1 rounded-md text-xs ${
                          tripStatus.vehicle2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          Slot 2: {tripStatus.vehicle2 ? 'Filled' : 'Available'}
                        </div>
                        {isFull && (
                          <div className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-700">
                            Full
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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