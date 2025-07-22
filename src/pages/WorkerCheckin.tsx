import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, DollarSign } from "lucide-react";

interface Worker {
  id: string;
  name: string;
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