import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CheckCircle, DollarSign, MapPin, Truck, Clock } from "lucide-react";

interface Worker {
  id: string;
  name: string;
  status: string;
}

interface Truck {
  id: string;
  truck_number: string;
  license_plate: string;
  make: string;
  model: string;
  status: string;
}

export function WorkerCheckin() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [startingCash, setStartingCash] = useState<string>("");
  const [moneyAdded, setMoneyAdded] = useState<string>("");
  const [moneySubtracted, setMoneySubtracted] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // GPS Tracking state
  const [enableGpsTracking, setEnableGpsTracking] = useState(false);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string>("");
  const [isTracking, setIsTracking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [trackingSessionId, setTrackingSessionId] = useState<string>("");

  useEffect(() => {
    fetchActiveWorkers();
    fetchTrucks();
  }, []);

  useEffect(() => {
    if (isTracking && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1000);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isTracking && timeRemaining <= 0) {
      handleStopTracking();
    }
  }, [isTracking, timeRemaining]);

  useEffect(() => {
    if (isTracking) {
      const interval = setInterval(updateLocation, 30000);
      return () => clearInterval(interval);
    }
  }, [isTracking, selectedTruckId]);

  const fetchActiveWorkers = async () => {
    try {
      const { data, error } = await supabase
        .from("workers")
        .select("id, name, status")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setWorkers(data || []);
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast.error("Failed to load workers");
    }
  };

  const fetchTrucks = async () => {
    try {
      const { data, error } = await supabase
        .from("trucks")
        .select("*")
        .eq("status", "available")
        .order("truck_number");

      if (error) throw error;
      setTrucks(data || []);
    } catch (error) {
      console.error("Error fetching trucks:", error);
      toast.error("Failed to load trucks");
    }
  };

  const updateLocation = async () => {
    if (!navigator.geolocation || !selectedTruckId) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await supabase.from("truck_locations").insert({
            truck_id: selectedTruckId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        } catch (error) {
          console.error("Error updating location:", error);
        }
      },
      (error) => console.error("Geolocation error:", error)
    );
  };

  const handleStartTracking = async () => {
    if (!selectedTruckId || !enableGpsTracking || !selectedWorkerId) return;

    try {
      const { data: sessionData, error } = await supabase
        .from("truck_tracking_sessions")
        .insert({
          truck_id: selectedTruckId,
          driver_id: selectedWorkerId,
          planned_duration_minutes: 600, // 10 hours
          status: "active"
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("trucks")
        .update({ status: "in_use", current_driver_id: selectedWorkerId })
        .eq("id", selectedTruckId);

      setTrackingSessionId(sessionData.id);
      setIsTracking(true);
      setTimeRemaining(600 * 60 * 1000); // 10 hours in milliseconds
      updateLocation();
      toast.success("GPS tracking started for 10 hours!");
    } catch (error) {
      console.error("Error starting tracking:", error);
      toast.error("Failed to start GPS tracking");
    }
  };

  const handleStopTracking = async () => {
    if (!trackingSessionId || !selectedTruckId) return;

    try {
      const actualDurationMinutes = Math.round((600 * 60 * 1000 - timeRemaining) / 60000);

      await supabase
        .from("truck_tracking_sessions")
        .update({
          session_end: new Date().toISOString(),
          actual_duration_minutes: actualDurationMinutes,
          status: "completed"
        })
        .eq("id", trackingSessionId);

      await supabase
        .from("trucks")
        .update({ status: "available", current_driver_id: null })
        .eq("id", selectedTruckId);

      setIsTracking(false);
      setTimeRemaining(0);
      setTrackingSessionId("");
      toast.success("GPS tracking stopped!");
    } catch (error) {
      console.error("Error stopping tracking:", error);
      toast.error("Failed to stop GPS tracking");
    }
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleSubmit = async () => {
    if (!selectedWorkerId || !startingCash) {
      toast.error("Please select a worker and enter starting cash amount");
      return;
    }

    const startingAmount = parseFloat(startingCash) || 0;
    const addedAmount = parseFloat(moneyAdded) || 0;
    const subtractedAmount = parseFloat(moneySubtracted) || 0;
    const finalTotal = startingAmount + addedAmount - subtractedAmount;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("worker_checkins")
        .upsert({
          worker_id: selectedWorkerId,
          checkin_date: new Date().toISOString().split('T')[0],
          starting_cash: startingAmount,
          money_added: addedAmount,
          money_subtracted: subtractedAmount,
          final_total: finalTotal
        }, {
          onConflict: 'worker_id,checkin_date'
        });

      if (error) throw error;

      toast.success("Cash report submitted successfully!");
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting cash report:", error);
      toast.error("Failed to submit cash report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedWorkerId("");
    setStartingCash("");
    setMoneyAdded("");
    setMoneySubtracted("");
    setSubmitted(false);
    setEnableGpsTracking(false);
    setSelectedTruckId("");
    if (isTracking) {
      handleStopTracking();
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Cash Report Complete!</CardTitle>
            <CardDescription>
              Your cash report has been recorded for today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={resetForm} className="w-full">
              Submit Another Cash Report
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Worker Cash Report</CardTitle>
          <CardDescription className="text-center">
            Please select your name and report your daily cash amounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="worker-select">Select Your Name</Label>
            <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your name" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="starting-cash">Starting Cash Amount *</Label>
              <Input
                id="starting-cash"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="money-added">Money Added</Label>
              <Input
                id="money-added"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={moneyAdded}
                onChange={(e) => setMoneyAdded(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="money-subtracted">Money Subtracted</Label>
              <Input
                id="money-subtracted"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={moneySubtracted}
                onChange={(e) => setMoneySubtracted(e.target.value)}
              />
            </div>

            {startingCash && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium">Final Total</Label>
                <div className="text-2xl font-bold text-green-600">
                  ${((parseFloat(startingCash) || 0) + (parseFloat(moneyAdded) || 0) - (parseFloat(moneySubtracted) || 0)).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* GPS Tracking Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <Label htmlFor="gps-tracking" className="text-base font-medium">
                  Allow GPS tracking for the next 10 hours
                </Label>
              </div>
              <Switch
                id="gps-tracking"
                checked={enableGpsTracking}
                onCheckedChange={setEnableGpsTracking}
                disabled={isTracking}
              />
            </div>

            {enableGpsTracking && !isTracking && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-md border border-blue-200">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Truck</Label>
                  <Select value={selectedTruckId} onValueChange={setSelectedTruckId}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Choose a truck..." />
                    </SelectTrigger>
                    <SelectContent>
                      {trucks.map((truck) => (
                        <SelectItem key={truck.id} value={truck.id}>
                          <div className="flex items-center space-x-2">
                            <Truck className="w-4 h-4" />
                            <span>
                              #{truck.truck_number} {truck.make} {truck.model}
                              {truck.license_plate && ` (${truck.license_plate})`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleStartTracking}
                  disabled={!selectedTruckId || !selectedWorkerId}
                  className="w-full"
                  variant="outline"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Start 10-Hour GPS Tracking
                </Button>
              </div>
            )}

            {isTracking && (
              <div className="p-4 bg-green-50 rounded-md border border-green-200">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">GPS Active</span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-mono">{formatTime(timeRemaining)}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Truck: {trucks.find(t => t.id === selectedTruckId)?.truck_number}
                  </div>

                  <Button
                    onClick={handleStopTracking}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    Stop GPS Tracking
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="lg"
            disabled={isSubmitting || !selectedWorkerId || !startingCash}
          >
            {isSubmitting ? "Submitting..." : "Submit Cash Report"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}