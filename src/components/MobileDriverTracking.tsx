
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Truck, Clock, Battery, MapPin, Smartphone } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';

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

export function MobileDriverTracking() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string>("");
  const [duration, setDuration] = useState<string>("60");
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<TrackingSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  useEffect(() => {
    setIsNativeApp(Capacitor.isNativePlatform());
    fetchTrucks();
    initializeBackgroundGeolocation();
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
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, currentSession]);

  const initializeBackgroundGeolocation = async () => {
    if (!isNativeApp) return;

    try {
      await BackgroundGeolocation.ready({
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 10,
        stopTimeout: 5,
        debug: false,
        logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
        enableHeadless: true,
        stopOnTerminate: false,
        startOnBoot: true,
        url: `${window.location.origin}/api/locations`,
        autoSync: true,
        params: {
          truck_id: selectedTruckId
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setLocationPermission(true);
      
      // Listen for location events
      BackgroundGeolocation.onLocation(onLocation);
      BackgroundGeolocation.onMotionChange(onMotionChange);
      BackgroundGeolocation.onProviderChange(onProviderChange);
      
    } catch (error) {
      console.error('Background geolocation error:', error);
      setLocationPermission(false);
      toast.error('Failed to initialize GPS tracking');
    }
  };

  const onLocation = async (location: any) => {
    console.log('Location received:', location);
    
    if (selectedTruckId) {
      const { error } = await supabase
        .from('truck_locations')
        .insert({
          truck_id: selectedTruckId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          battery_level: batteryLevel,
          speed: location.coords.speed || 0,
          heading: location.coords.heading || 0
        });

      if (error) {
        console.error('Failed to save location:', error);
      }
    }
  };

  const onMotionChange = (event: any) => {
    console.log('Motion change:', event);
    if (event.isMoving) {
      BackgroundGeolocation.changePace(true);
    } else {
      BackgroundGeolocation.changePace(false);
    }
  };

  const onProviderChange = (provider: any) => {
    console.log('Provider change:', provider);
    if (!provider.gps) {
      toast.error('GPS is disabled. Please enable GPS in your device settings.');
    }
  };

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
        driver_id: '00000000-0000-0000-0000-000000000000',
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

    if (isNativeApp) {
      // Start native background tracking
      await BackgroundGeolocation.setConfig({
        params: {
          truck_id: selectedTruckId,
          session_id: sessionData.id
        }
      });
      await BackgroundGeolocation.start();
    }

    setCurrentSession(sessionData);
    setIsTracking(true);
    toast.success(`Background GPS tracking started for ${parseInt(duration)} minutes`);
  };

  const handleStopTracking = async (autoStopped = false) => {
    if (!currentSession) return;

    if (isNativeApp) {
      await BackgroundGeolocation.stop();
    }

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
    
    toast.success(autoStopped ? 'Tracking automatically stopped' : 'Background tracking stopped');
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
            {isNativeApp ? 'Mobile GPS Tracking' : 'Web GPS Tracking'}
          </CardTitle>
          <div className="flex justify-center">
            <Badge variant={isNativeApp ? "default" : "secondary"}>
              <Smartphone className="h-3 w-3 mr-1" />
              {isNativeApp ? 'Native App - Background Tracking' : 'Web Browser - Limited Tracking'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isNativeApp && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You're using the web version. For true background GPS tracking that works when your phone is locked, install the mobile app.
              </p>
            </div>
          )}

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
                Start {isNativeApp ? 'Background' : 'Web'} GPS Tracking
              </Button>
            </>
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-green-600">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  {isNativeApp ? 'BACKGROUND TRACKING ACTIVE' : 'WEB TRACKING ACTIVE'}
                </div>
                
                <div className="text-3xl font-mono">
                  {formatTime(timeRemaining)}
                </div>
                
                <div className="flex items-center justify-center gap-2">
                  <Battery className="h-4 w-4" />
                  <span className="text-sm">{batteryLevel}%</span>
                </div>

                {isNativeApp && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ Background tracking is active. You can now lock your phone or use other apps.
                    </p>
                  </div>
                )}
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
