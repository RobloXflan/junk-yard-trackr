import { useState } from "react";
import { Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentNotepad } from "@/components/AppointmentNotepad";
import { VehiclePricingTool } from "@/components/VehiclePricingTool";
import { SavedQuotesList } from "@/components/SavedQuotesList";
import { AppointmentNotesList } from "@/components/AppointmentNotesList";

interface VehicleData {
  year: string;
  make: string;
  model: string;
}

export function Appointments() {
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    year: "",
    make: "",
    model: ""
  });

  const hasVehicleData = vehicleData.year || vehicleData.make || vehicleData.model;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Appointments & Quotes</h1>
          <p className="text-muted-foreground">Manage appointments with integrated pricing tools</p>
        </div>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new">New Appointment</TabsTrigger>
          <TabsTrigger value="saved">Saved Notes</TabsTrigger>
          <TabsTrigger value="pending">Pending Appointments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Appointment Notepad */}
            <div className="space-y-4">
              <AppointmentNotepad 
                vehicleData={vehicleData}
                onVehicleDataChange={setVehicleData}
              />
            </div>

            {/* Right Side - Quotes Integration */}
            <div className="space-y-4">
              {hasVehicleData ? (
                <Tabs defaultValue="pricing" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pricing">Price Lookup</TabsTrigger>
                    <TabsTrigger value="saved">Saved Quotes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pricing" className="space-y-4">
                    <VehiclePricingTool 
                      vehicleData={vehicleData}
                      onVehicleDataChange={setVehicleData}
                    />
                  </TabsContent>
                  <TabsContent value="saved" className="space-y-4">
                    <SavedQuotesList />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-muted rounded-lg p-8">
                  <div className="text-center space-y-2">
                    <div className="text-muted-foreground">Enter vehicle details on the left</div>
                    <div className="text-sm text-muted-foreground">to see pricing tools and quotes</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <AppointmentNotesList />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <AppointmentNotesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}