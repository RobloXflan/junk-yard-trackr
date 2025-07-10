import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Check } from "lucide-react";
import { format } from "date-fns";

interface WorkerCashEntry {
  worker_id: string;
  worker_name: string;
  reported_cash: number;
  cash_given: number;
  total_cash: number;
  source: 'worker' | 'admin';
}

const workers = [
  { id: 'angel', name: 'Angel' },
  { id: 'chino', name: 'Chino' },
  { id: 'dante', name: 'Dante' }
];

export function WorkerCashEntry() {
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [reportedCash, setReportedCash] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleSubmit = () => {
    // Reset error
    setError("");

    // Validation
    if (!selectedWorker || !reportedCash || !cashGiven) {
      setError("Please fill in all fields");
      return;
    }

    const reportedAmount = parseFloat(reportedCash);
    const givenAmount = parseFloat(cashGiven);

    if (isNaN(reportedAmount) || isNaN(givenAmount) || reportedAmount < 0 || givenAmount < 0) {
      setError("Please enter valid positive amounts");
      return;
    }

    const worker = workers.find(w => w.id === selectedWorker);
    if (!worker) return;

    const totalAmount = reportedAmount + givenAmount;

    const newEntry: WorkerCashEntry = {
      worker_id: selectedWorker,
      worker_name: worker.name,
      reported_cash: reportedAmount,
      cash_given: givenAmount,
      total_cash: totalAmount,
      source: 'worker'
    };

    // Get existing entries for today
    const stored = localStorage.getItem(`dailyCash_${today}`);
    const existingEntries: WorkerCashEntry[] = stored ? JSON.parse(stored) : [];

    // Remove any existing entry for this worker
    const filteredEntries = existingEntries.filter(entry => entry.worker_id !== selectedWorker);
    
    // Add the new entry
    const updatedEntries = [...filteredEntries, newEntry];
    
    // Save to localStorage
    localStorage.setItem(`dailyCash_${today}`, JSON.stringify(updatedEntries));

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Success!</h2>
              <p className="text-muted-foreground">
                Your cash report has been submitted successfully.
              </p>
              <Button 
                onClick={() => {
                  setIsSubmitted(false);
                  setSelectedWorker("");
                  setReportedCash("");
                  setCashGiven("");
                  setError("");
                }}
                className="w-full"
              >
                Submit Another Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Daily Cash Report</CardTitle>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), "MMMM dd, yyyy")}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="worker" className="text-base">Select Your Name</Label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger className="h-12 text-lg">
                <SelectValue placeholder="Choose your name..." />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id} className="text-lg py-3">
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reported" className="text-base">Money I Reported Today</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
              <Input
                id="reported"
                type="number"
                step="0.01"
                min="0"
                value={reportedCash}
                onChange={(e) => setReportedCash(e.target.value)}
                placeholder="0.00"
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="given" className="text-base">Money Given/Received</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-4 h-5 w-5 text-muted-foreground" />
              <Input
                id="given"
                type="number"
                step="0.01"
                min="0"
                value={cashGiven}
                onChange={(e) => setCashGiven(e.target.value)}
                placeholder="0.00"
                className="pl-10 h-12 text-lg"
              />
            </div>
          </div>

          {reportedCash && cashGiven && (
            <div className="p-4 bg-muted rounded-md">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  ${((parseFloat(reportedCash) || 0) + (parseFloat(cashGiven) || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            disabled={!selectedWorker || !reportedCash || !cashGiven}
            className="w-full h-12 text-lg"
          >
            Submit Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}