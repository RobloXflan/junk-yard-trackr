
import { useState, useEffect } from "react";
import { VehicleIntakeForm } from "@/components/VehicleIntakeForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  year: string;
  make: string;
  model: string;
  vehicle_id: string;
  created_at: string;
}

interface MonthCount {
  month: string;
  count: number;
  monthName: string;
}

export function Intake() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [monthCounts, setMonthCounts] = useState<MonthCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, year, make, model, vehicle_id, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const vehicleData = data || [];
      setVehicles(vehicleData);
      setFilteredVehicles(vehicleData);
      
      // Calculate month counts
      const counts: { [key: string]: number } = {};
      vehicleData.forEach(vehicle => {
        const month = vehicle.created_at.substring(5, 7); // Extract MM from YYYY-MM-DD
        counts[month] = (counts[month] || 0) + 1;
      });

      const monthCountsArray: MonthCount[] = [];
      for (let i = 1; i <= 12; i++) {
        const monthKey = i.toString().padStart(2, '0');
        monthCountsArray.push({
          month: monthKey,
          count: counts[monthKey] || 0,
          monthName: monthNames[i - 1]
        });
      }

      setMonthCounts(monthCountsArray);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error("Failed to load vehicles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    if (selectedMonth === "all") {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter(vehicle => {
        const vehicleMonth = vehicle.created_at.substring(5, 7);
        return vehicleMonth === selectedMonth;
      });
      setFilteredVehicles(filtered);
    }
  }, [selectedMonth, vehicles]);

  const handleSuccess = () => {
    toast.success("Vehicle added successfully!");
    // Refresh the vehicle list to update counts
    loadVehicles();
  };

  const totalVehicles = vehicles.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Intake</h1>
        <p className="text-black">
          Add new vehicles to your inventory
        </p>
      </div>

      {/* Month Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4" />
            <h3 className="font-medium">Filter by Month</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedMonth === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMonth("all")}
              className="flex items-center gap-2"
            >
              All Months
              <Badge variant="secondary" className="ml-1">
                {totalVehicles}
              </Badge>
            </Button>
            
            {monthCounts.map((monthData) => (
              <Button
                key={monthData.month}
                variant={selectedMonth === monthData.month ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonth(monthData.month)}
                className="flex items-center gap-2"
                disabled={monthData.count === 0}
              >
                {monthData.month} ({monthData.monthName.slice(0, 3)})
                <Badge variant="secondary" className="ml-1">
                  {monthData.count}
                </Badge>
              </Button>
            ))}
          </div>

          {selectedMonth !== "all" && (
            <div className="mt-3 text-sm text-muted-foreground">
              Showing {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} from {
                monthCounts.find(m => m.month === selectedMonth)?.monthName
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Vehicles Preview */}
      {filteredVehicles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">
              {selectedMonth === "all" ? "Recent Vehicles" : `Vehicles from ${monthCounts.find(m => m.month === selectedMonth)?.monthName}`}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredVehicles.slice(0, 10).map((vehicle) => (
                <div key={vehicle.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <div>
                    <span className="font-medium">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ID: {vehicle.vehicle_id}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(vehicle.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {filteredVehicles.length > 10 && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  ... and {filteredVehicles.length - 10} more vehicles
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <VehicleIntakeForm onSuccess={handleSuccess} />
    </div>
  );
}
