
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, Truck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProximityMap } from "./ProximityMap";

interface PendingAppointment {
  id: string;
  customer_address: string;
  vehicle_year: string;
  vehicle_make: string;
  vehicle_model: string;
  created_at: string;
  estimated_price: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance?: number;
}

interface ActiveWorker {
  id: string;
  truck_number: string;
  driver_name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance: number;
  last_update: string;
  battery_level?: number;
}

interface ZipcodeProximityCheckerProps {
  className?: string;
}

export function ZipcodeProximityChecker({ className = "" }: ZipcodeProximityCheckerProps) {
  const [zipcode, setZipcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [zipcodeCoordinates, setZipcodeCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyAppointments, setNearbyAppointments] = useState<PendingAppointment[]>([]);
  const [activeWorkers, setActiveWorkers] = useState<ActiveWorker[]>([]);
  const { toast } = useToast();

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { 
          query: address,
          getCoordinates: true 
        }
      });

      if (error) {
        console.error('Error calling google-places function:', error);
        return null;
      }

      if (data?.coordinates) {
        return data.coordinates;
      }

      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchActiveWorkers = async (zipcodeCoords: { lat: number; lng: number }) => {
    try {
      // First get active tracking sessions with truck and driver info
      const { data: sessions, error: sessionsError } = await supabase
        .from('truck_tracking_sessions')
        .select(`
          id,
          truck_id,
          driver_id,
          status,
          trucks!inner(
            truck_number,
            status
          ),
          workers!inner(
            name
          )
        `)
        .eq('status', 'active');

      if (sessionsError) {
        console.error('Error fetching active sessions:', sessionsError);
        return [];
      }

      // For each active session, get the latest location
      const workersWithLocations: ActiveWorker[] = [];
      
      for (const session of sessions || []) {
        const { data: locationData } = await supabase
          .from('truck_locations')
          .select('latitude, longitude, battery_level, created_at')
          .eq('truck_id', session.truck_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (locationData) {
          const distance = calculateDistance(
            zipcodeCoords.lat,
            zipcodeCoords.lng,
            Number(locationData.latitude),
            Number(locationData.longitude)
          );

          workersWithLocations.push({
            id: session.truck_id,
            truck_number: session.trucks.truck_number,
            driver_name: session.workers.name,
            coordinates: {
              lat: Number(locationData.latitude),
              lng: Number(locationData.longitude)
            },
            distance: Math.round(distance * 10) / 10,
            last_update: locationData.created_at,
            battery_level: locationData.battery_level
          });
        }
      }

      // Sort by distance (closest first)
      workersWithLocations.sort((a, b) => a.distance - b.distance);
      return workersWithLocations;

    } catch (error) {
      console.error('Error fetching active workers:', error);
      return [];
    }
  };

  const checkZipcode = async () => {
    if (!zipcode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a zipcode",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Geocode the input zipcode
      const zipcodeCoords = await geocodeAddress(zipcode);
      if (!zipcodeCoords) {
        toast({
          title: "Error",
          description: "Could not find location for this zipcode",
          variant: "destructive"
        });
        return;
      }
      setZipcodeCoordinates(zipcodeCoords);

      // Fetch active workers and their distances
      const workers = await fetchActiveWorkers(zipcodeCoords);
      setActiveWorkers(workers);

      // Fetch last 4 pending appointments
      const { data: appointments, error } = await supabase
        .from('appointment_notes')
        .select('id, customer_address, vehicle_year, vehicle_make, vehicle_model, created_at, estimated_price')
        .eq('appointment_booked', true)
        .not('customer_address', 'is', null)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) throw error;

      // Geocode each appointment address and calculate distances
      const appointmentsWithDistances: PendingAppointment[] = [];
      
      for (const appointment of appointments || []) {
        const coords = await geocodeAddress(appointment.customer_address);
        if (coords) {
          const distance = calculateDistance(
            zipcodeCoords.lat,
            zipcodeCoords.lng,
            coords.lat,
            coords.lng
          );
          appointmentsWithDistances.push({
            ...appointment,
            coordinates: coords,
            distance: Math.round(distance * 10) / 10
          });
        }
      }

      // Sort by distance (closest first)
      appointmentsWithDistances.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setNearbyAppointments(appointmentsWithDistances);

      toast({
        title: "Success",
        description: `Found ${appointmentsWithDistances.length} appointments and ${workers.length} active workers nearby`
      });

    } catch (error) {
      console.error('Error checking zipcode:', error);
      toast({
        title: "Error",
        description: "Failed to check zipcode proximity",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDistanceColor = (distance: number) => {
    if (distance < 5) return "bg-green-100 text-green-800";
    if (distance < 15) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Zipcode Proximity Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zipcode Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter zipcode (e.g., 90210)"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={checkZipcode}
            disabled={loading}
            className="px-6"
          >
            {loading ? "Checking..." : "Check"}
          </Button>
        </div>

        {/* Results */}
        {zipcodeCoordinates && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              Location: {zipcode} ({zipcodeCoordinates.lat.toFixed(4)}, {zipcodeCoordinates.lng.toFixed(4)})
            </div>

            {/* Active Workers Section */}
            {activeWorkers.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Workers (by distance)
                </h4>
                {activeWorkers.map((worker) => (
                  <div 
                    key={worker.id}
                    className="p-3 border rounded-lg bg-primary/10 border-primary/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary" />
                        <span className="font-medium">Truck #{worker.truck_number}</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          {worker.driver_name}
                        </Badge>
                      </div>
                      <Badge className={getDistanceColor(worker.distance)}>
                        {worker.distance} miles
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>📍 GPS: {worker.coordinates.lat.toFixed(4)}, {worker.coordinates.lng.toFixed(4)}</span>
                      {worker.battery_level && (
                        <span>🔋 {worker.battery_level}%</span>
                      )}
                      <span>⏱️ {new Date(worker.last_update).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Appointments Section */}
            {nearbyAppointments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Pending Appointments (by distance)
                </h4>
                {nearbyAppointments.map((appointment) => (
                  <div 
                    key={appointment.id}
                    className="p-3 border rounded-lg bg-muted/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {appointment.vehicle_year} {appointment.vehicle_make} {appointment.vehicle_model}
                      </div>
                      <Badge className={getDistanceColor(appointment.distance || 0)}>
                        {appointment.distance} miles
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      📍 {appointment.customer_address}
                    </div>
                    {appointment.estimated_price && (
                      <div className="text-sm font-medium">
                        💰 ${appointment.estimated_price.toLocaleString()}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(appointment.created_at).toLocaleDateString()} at {new Date(appointment.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results Messages */}
            {activeWorkers.length === 0 && nearbyAppointments.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No active workers or recent appointments found
              </div>
            )}

            {/* Map Component */}
            <ProximityMap 
              zipcodeCoordinates={zipcodeCoordinates}
              nearbyAppointments={nearbyAppointments}
              activeWorkers={activeWorkers}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
