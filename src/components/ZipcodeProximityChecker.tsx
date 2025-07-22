
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock } from "lucide-react";
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

interface ZipcodeProximityCheckerProps {
  className?: string;
}

export function ZipcodeProximityChecker({ className = "" }: ZipcodeProximityCheckerProps) {
  const [zipcode, setZipcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [zipcodeCoordinates, setZipcodeCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyAppointments, setNearbyAppointments] = useState<PendingAppointment[]>([]);
  const { toast } = useToast();

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Use the existing google-places function to get coordinates directly
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
            distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
          });
        }
      }

      // Sort by distance (closest first)
      appointmentsWithDistances.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setNearbyAppointments(appointmentsWithDistances);

      toast({
        title: "Success",
        description: `Found ${appointmentsWithDistances.length} nearby appointments`
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
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              Location: {zipcode} ({zipcodeCoordinates.lat.toFixed(4)}, {zipcodeCoordinates.lng.toFixed(4)})
            </div>

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

            {nearbyAppointments.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No recent pending appointments found with valid addresses
              </div>
            )}

            {/* Map Component */}
            <ProximityMap 
              zipcodeCoordinates={zipcodeCoordinates}
              nearbyAppointments={nearbyAppointments}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
