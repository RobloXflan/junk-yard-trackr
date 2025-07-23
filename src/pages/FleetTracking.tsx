import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { TruckManagement } from "@/components/TruckManagement";
import { toast } from "sonner";
import { Truck, MapPin, Clock, Users, Activity } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Mapbox token
  const MAPBOX_TOKEN = "pk.eyJ1IjoiMTQyNmRhbnRlIiwiYSI6ImNtZGY4b2Z6dDBhdHcyaXEwM29sY3UwOXQifQ.20FciL4TNEtXMCY4MyKgDA";

  useEffect(() => {
    fetchActiveSessions();
    fetchFleetStats();
    initializeMap();
    
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
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Update map markers when active sessions change
    if (map.current && activeSessions.length > 0) {
      updateMapMarkers();
    }
  }, [activeSessions]);

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

  const initializeMap = () => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-118.2437, 34.0522], // Los Angeles center
      zoom: 10
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
  };

  const updateMapMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.truck-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add markers for each truck
    truckLocations.forEach((truck) => {
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'truck-marker';
      markerElement.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: #22c55e;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;
      markerElement.textContent = truck.truck_number;

      // Create popup content
      const popupContent = `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Truck #${truck.truck_number}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px;">Driver: ${truck.driver_name}</p>
          <p style="margin: 0 0 4px 0; font-size: 12px;">Battery: ${truck.battery_level}%</p>
          <p style="margin: 0; font-size: 12px;">Time Remaining: ${Math.floor(truck.time_remaining / 60000)} min</p>
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

      // Add marker to map
      new mapboxgl.Marker(markerElement)
        .setLngLat([truck.coordinates.lng, truck.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Fit map to show all markers if there are any
    if (truckLocations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      truckLocations.forEach(truck => {
        bounds.extend([truck.coordinates.lng, truck.coordinates.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
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

      {/* Fleet Map */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Map - Live Truck Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={mapContainer} style={{ height: '400px' }} className="rounded-lg border" />
          <div className="mt-4 flex flex-wrap gap-2">
            {truckLocations.map((truck) => (
              <Badge key={truck.id} variant="outline">
                Truck #{truck.truck_number} - {truck.driver_name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Truck Management */}
      <TruckManagement />
    </div>
  );
}