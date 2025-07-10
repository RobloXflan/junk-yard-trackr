import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, Calculator } from "lucide-react";

interface Worker {
  id: string;
  name: string;
}

interface AddCashEntryProps {
  workers: Worker[];
  selectedWorker: string;
  onWorkerChange: (workerId: string) => void;
  reportedCash: string;
  onReportedCashChange: (amount: string) => void;
  cashGiven: string;
  onCashGivenChange: (amount: string) => void;
  onAddEntry: () => void;
  loading: boolean;
}

export function AddCashEntry({
  workers,
  selectedWorker,
  onWorkerChange,
  reportedCash,
  onReportedCashChange,
  cashGiven,
  onCashGivenChange,
  onAddEntry,
  loading
}: AddCashEntryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Cash Entry
        </CardTitle>
        <CardDescription>
          Record how much cash a worker reported and how much we gave them
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="worker">Select Worker</Label>
            <Select value={selectedWorker} onValueChange={onWorkerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose worker..." />
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

          <div className="space-y-2">
            <Label htmlFor="reported">Cash Reported</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="reported"
                type="number"
                step="0.01"
                min="0"
                value={reportedCash}
                onChange={(e) => onReportedCashChange(e.target.value)}
                placeholder="0.00"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="given">Cash Given</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="given"
                type="number"
                step="0.01"
                min="0"
                value={cashGiven}
                onChange={(e) => onCashGivenChange(e.target.value)}
                placeholder="0.00"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Total</Label>
            <div className="flex items-center h-10 px-3 py-2 border border-input bg-muted rounded-md">
              <span className="text-lg font-semibold">
                ${((parseFloat(reportedCash) || 0) + (parseFloat(cashGiven) || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button 
            onClick={onAddEntry} 
            disabled={loading || !selectedWorker || !reportedCash || !cashGiven}
            className="w-full md:w-auto"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}