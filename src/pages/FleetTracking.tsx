import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TruckManagement } from "@/components/TruckManagement";
import { ProximityMap } from "@/components/ProximityMap";
import { toast } from "sonner";
import { Truck, MapPin, Clock, Users, Activity } from "lucide-react";

interface ActiveSession {
  id: string;
  truck_id: string;
  truck_number: string;
  driver_name: string;
  session_start: string;
  planned_duration_minutes: number;
  status: string;
  latest_location?: {
    latitude: number;
    longitude: number;
    battery_level: number;
    created_at: string;
  };
}

interface FleetStats {
  total_trucks: number;
  active_tracking: number;
  available_trucks: number;
  in_maintenance: number;
}

export function FleetTracking() {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [fleetStats, setFleetStats] = useState<FleetStats>({
    total_trucks: 0,
    active_tracking: 0,
    available_trucks: 0,
    in_maintenance: 0
  });
  const [mapboxToken, setMapboxToken] = useState("");
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchActiveSessions();
    fetchFleetStats();
    
    // Set up real-time subscriptions
    const trackingSubscription = supabase
      .channel('tracking_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'truck_tracking_sessions' },
        () => {
          fetchActiveSessions();
          fetchFleetStats();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'truck_locations' },
        () => {
          fetchActiveSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(trackingSubscription);
    };
  }, []);

  const fetchActiveSessions = async () => {
    const { data, error } = await supabase
      .from('truck_tracking_sessions')
      .select(`
        id,
        truck_id,
        session_start,
        planned_duration_minutes,
        status,
        trucks!inner(
          truck_number
        ),
        workers!inner(
          name
        )
      `)
      .eq('status', 'active')
      .order('session_start', { ascending: false });

    if (error) {
      toast.error('Failed to fetch active sessions');
      return;
    }

    // Fetch latest locations for each truck
    const sessionsWithLocations = await Promise.all(
      (data || []).map(async (session: any) => {
        const { data: locationData } = await supabase
          .from('truck_locations')
          .select('latitude, longitude, battery_level, created_at')
          .eq('truck_id', session.truck_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: session.id,
          truck_id: session.truck_id,
          truck_number: session.trucks.truck_number,
          driver_name: session.workers.name,
          session_start: session.session_start,
          planned_duration_minutes: session.planned_duration_minutes,
          status: session.status,
          latest_location: locationData
        };
      })
    );

    setActiveSessions(sessionsWithLocations);
  };

  const fetchFleetStats = async () => {
    const { data: trucks, error } = await supabase
      .from('trucks')
      .select('status');

    if (error) {
      toast.error('Failed to fetch fleet stats');
      return;
    }

    const { data: activeSessions } = await supabase
      .from('truck_tracking_sessions')
      .select('id')
      .eq('status', 'active');

    const stats = {
      total_trucks: trucks?.length || 0,
      active_tracking: activeSessions?.length || 0,
      available_trucks: trucks?.filter(t => t.status === 'available').length || 0,
      in_maintenance: trucks?.filter(t => t.status === 'maintenance').length || 0
    };

    setFleetStats(stats);
  };

  const getTimeRemaining = (sessionStart: string, durationMinutes: number) => {
    const startTime = new Date(sessionStart).getTime();
    const endTime = startTime + (durationMinutes * 60 * 1000);
    const remaining = Math.max(0, endTime - Date.now());
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return { remaining, hours, minutes };
  };

  const getTimeRemainingColor = (remaining: number, totalDuration: number) => {
    const percentRemaining = remaining / (totalDuration * 60 * 1000);
    if (percentRemaining > 0.5) return "default";
    if (percentRemaining > 0.25) return "secondary";
    return "destructive";
  };

  const extendSession = async (sessionId: string, additionalMinutes: number) => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    const newDuration = session.planned_duration_minutes + additionalMinutes;
    
    const { error } = await supabase
      .from('truck_tracking_sessions')
      .update({ planned_duration_minutes: newDuration })
      .eq('id', sessionId);

    if (error) {
      toast.error('Failed to extend session');
      return;
    }

    toast.success(`Session extended by ${additionalMinutes} minutes`);
    fetchActiveSessions();
  };

  const handleMapboxToken = () => {
    if (mapboxToken.trim()) {
      setShowMap(true);
    } else {
      toast.error('Please enter a valid Mapbox token');
    }
  };

  // Convert active sessions to map format
  const truckLocations = activeSessions
    .filter(session => session.latest_location)
    .map(session => ({
      id: session.truck_id,
      truck_number: session.truck_number,
      driver_name: session.driver_name,
      coordinates: {
        lat: Number(session.latest_location!.latitude),
        lng: Number(session.latest_location!.longitude)
      },
      battery_level: session.latest_location!.battery_level,
      time_remaining: getTimeRemaining(session.session_start, session.planned_duration_minutes).remaining
    }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Fleet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trucks</p>
                <p className="text-2xl font-bold">{fleetStats.total_trucks}</p>
              </div>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Tracking</p>
                <p className="text-2xl font-bold text-green-600">{fleetStats.active_tracking}</p>
              </div>
              <Activity className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">{fleetStats.available_trucks}</p>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{fleetStats.in_maintenance}</p>
              </div>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tracking Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Active Tracking Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active tracking sessions</p>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => {
                const { remaining, hours, minutes } = getTimeRemaining(session.session_start, session.planned_duration_minutes);
                const colorVariant = getTimeRemainingColor(remaining, session.planned_duration_minutes);
                
                return (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Truck #{session.truck_number}</span>
                        <Badge variant="outline">{session.driver_name}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Started: {new Date(session.session_start).toLocaleTimeString()}</span>
                        {session.latest_location && (
                          <>
                            <span>Battery: {session.latest_location.battery_level}%</span>
                            <span>Last update: {new Date(session.latest_location.created_at).toLocaleTimeString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={colorVariant}>
                        {hours}h {minutes}m remaining
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => extendSession(session.id, 60)}
                      >
                        +1hr
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Integration */}
      {!showMap ? (
        <Card>
          <CardHeader>
            <CardTitle>Fleet Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter Mapbox public token"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              />
              <Button onClick={handleMapboxToken}>
                Show Map
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Get your Mapbox token from{" "}
              <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                mapbox.com
              </a>
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Fleet Map - Active Trucks</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '400px' }}>
              {/* You can integrate your existing map component here with truck locations */}
              <div className="bg-muted rounded-lg h-full flex items-center justify-center">
                <p className="text-muted-foreground">
                  Map integration with {truckLocations.length} active trucks
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {truckLocations.map((truck) => (
                <Badge key={truck.id} variant="outline">
                  Truck #{truck.truck_number} - {truck.driver_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Truck Management */}
      <TruckManagement />
    </div>
  );
}