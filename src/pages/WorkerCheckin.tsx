import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

interface Worker {
  id: string;
  name: string;
  status: string;
}

export function WorkerCheckin() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchActiveWorkers();
  }, []);

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

  const handleSubmit = async () => {
    if (!selectedWorkerId || !response) {
      toast.error("Please select a worker and provide a response");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("worker_checkins")
        .upsert({
          worker_id: selectedWorkerId,
          checkin_date: new Date().toISOString().split('T')[0],
          response: response
        }, {
          onConflict: 'worker_id,checkin_date'
        });

      if (error) throw error;

      toast.success("Check-in submitted successfully!");
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting check-in:", error);
      toast.error("Failed to submit check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedWorkerId("");
    setResponse("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check-in Complete!</CardTitle>
            <CardDescription>
              Your response has been recorded for today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={resetForm} className="w-full">
              Submit Another Check-in
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
          <CardTitle className="text-2xl text-center">Worker Check-in</CardTitle>
          <CardDescription className="text-center">
            Please select your name and provide your response for today.
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

          <div className="space-y-3">
            <Label>Your Response</Label>
            <RadioGroup value={response} onValueChange={setResponse}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="text-lg font-medium text-green-600">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="text-lg font-medium text-red-600">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="lg"
            disabled={isSubmitting || !selectedWorkerId || !response}
          >
            {isSubmitting ? "Submitting..." : "Submit Check-in"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}