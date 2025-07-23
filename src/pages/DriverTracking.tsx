import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck, Clock, Battery, MapPin } from "lucide-react";

interface TrackingSession {
  id: string;
  planned_duration_minutes: number;
  session_start: string;
  status: string;
}

interface Truck {
  id: string;
  truck_number: string;
  license_plate: string;
  make: string;
  model: string;
}

export function DriverTracking() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string>("");
  const [duration, setDuration] = useState<string>("60");
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TrackingSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  useEffect(() => {
    fetchTrucks();
    checkLocationPermission();
    checkBatteryLevel();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && currentSession) {
      interval = setInterval(() => {
        const startTime = new Date(currentSession.session_start).getTime();
        const durationMs = currentSession.planned_duration_minutes * 60 * 1000;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, durationMs - elapsed);
        
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          handleStopTracking(true);
        } else if (remaining <= 10 * 60 * 1000) { // 10 minutes warning
          toast.warning(`Tracking will stop in ${Math.ceil(remaining / 60000)} minutes`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, currentSession]);

  useEffect(() => {
    let locationInterval: NodeJS.Timeout;
    if (isTracking && selectedTruckId) {
      locationInterval = setInterval(updateLocation, 300000); // Update every 5 minutes
      updateLocation(); // Initial update
    }
    return () => clearInterval(locationInterval);
  }, [isTracking, selectedTruckId]);

  const fetchTrucks = async () => {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .eq('status', 'available')
      .order('truck_number');
    
    if (error) {
      toast.error('Failed to fetch trucks');
      return;
    }
    setTrucks(data || []);
  };

  const checkLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        setLocationPermission(true);
      } catch {
        setLocationPermission(false);
        toast.error('Location permission required for GPS tracking');
      }
    }
  };

  const checkBatteryLevel = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
      } catch {
        // Battery API not supported
      }
    }
  };

  const updateLocation = async () => {
    if (!selectedTruckId || !locationPermission) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        const { error } = await supabase
          .from('truck_locations')
          .insert({
            truck_id: selectedTruckId,
            latitude,
            longitude,
            accuracy,
            battery_level: batteryLevel
          });

        if (error) {
          console.error('Failed to update location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get current location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleStartTracking = async () => {
    if (!selectedTruckId) {
      toast.error('Please select a truck');
      return;
    }

    if (!locationPermission) {
      toast.error('Location permission required');
      return;
    }

    const { data: sessionData, error } = await supabase
      .from('truck_tracking_sessions')
      .insert({
        truck_id: selectedTruckId,
        driver_id: '00000000-0000-0000-0000-000000000000', // You'll need to implement proper driver selection
        planned_duration_minutes: parseInt(duration),
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to start tracking session');
      return;
    }

    // Update truck status
    await supabase
      .from('trucks')
      .update({ status: 'in_use' })
      .eq('id', selectedTruckId);

    setCurrentSession(sessionData);
    setIsTracking(true);
    toast.success(`GPS tracking started for ${parseInt(duration)} minutes`);
  };

  const handleStopTracking = async (autoStopped = false) => {
    if (!currentSession) return;

    const endTime = new Date().toISOString();
    const actualDuration = Math.round((new Date(endTime).getTime() - new Date(currentSession.session_start).getTime()) / 60000);

    await supabase
      .from('truck_tracking_sessions')
      .update({
        session_end: endTime,
        actual_duration_minutes: actualDuration,
        status: autoStopped ? 'expired' : 'completed',
        auto_stopped: autoStopped
      })
      .eq('id', currentSession.id);

    // Update truck status back to available
    await supabase
      .from('trucks')
      .update({ status: 'available' })
      .eq('id', selectedTruckId);

    setIsTracking(false);
    setCurrentSession(null);
    setTimeRemaining(0);
    
    toast.success(autoStopped ? 'Tracking automatically stopped' : 'Tracking stopped');
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Truck className="h-6 w-6" />
            Driver GPS Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isTracking ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Truck</label>
                <Select value={selectedTruckId} onValueChange={setSelectedTruckId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your truck" />
                  </SelectTrigger>
                  <SelectContent>
                    {trucks.map((truck) => (
                      <SelectItem key={truck.id} value={truck.id}>
                        Truck #{truck.truck_number} - {truck.make} {truck.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tracking Duration</label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">GPS Permission</span>
                <Badge variant={locationPermission ? "default" : "destructive"}>
                  <MapPin className="h-3 w-3 mr-1" />
                  {locationPermission ? "Granted" : "Required"}
                </Badge>
              </div>

              <Button 
                onClick={handleStartTracking}
                disabled={!selectedTruckId || !locationPermission}
                className="w-full"
                size="lg"
              >
                Start GPS Tracking
              </Button>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-green-600">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  TRACKING ACTIVE
                </div>
                
                <div className="text-3xl font-mono">
                  {formatTime(timeRemaining)}
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <Battery className="h-4 w-4" />
                  <span className="text-sm">{batteryLevel}%</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => setDuration(prev => String(parseInt(prev) + 60))}
                  variant="outline"
                  className="w-full"
                >
                  Extend +1 Hour
                </Button>
                
                <Button 
                  onClick={() => handleStopTracking(false)}
                  variant="destructive"
                  className="w-full"
                >
                  Stop Tracking
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
