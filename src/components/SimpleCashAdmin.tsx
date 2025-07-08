import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DollarSign, Plus, Calculator, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
}

interface DailyCashEntry {
  id?: string;
  worker_id: string;
  worker_name: string;
  reported_cash: number;
  cash_given: number;
  total_cash: number;
  transaction_date: string;
}

export function SimpleCashAdmin() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyCashEntry[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [reportedCash, setReportedCash] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    loadEntriesForDate();
  }, [selectedDate]);

  const fetchWorkers = async () => {
    try {
      const { data } = await supabase
        .from('workers')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (data) {
        setWorkers(data);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const loadEntriesForDate = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('cash_transactions')
        .select(`
          id,
          worker_id,
          amount,
          transaction_date,
          transaction_type,
          notes,
          workers:worker_id (name)
        `)
        .eq('transaction_date', selectedDateString)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading entries:', error);
        return;
      }

      // Group transactions by worker to calculate totals
      const workerEntries = new Map<string, DailyCashEntry>();

      transactions?.forEach((transaction) => {
        const workerId = transaction.worker_id;
        const workerName = (transaction.workers as any)?.name || 'Unknown Worker';
        
        if (!workerEntries.has(workerId)) {
          workerEntries.set(workerId, {
            id: transaction.id,
            worker_id: workerId,
            worker_name: workerName,
            reported_cash: 0,
            cash_given: 0,
            total_cash: 0,
            transaction_date: transaction.transaction_date
          });
        }

        const entry = workerEntries.get(workerId)!;
        
        // Determine if this is reported cash or cash given based on transaction type
        if (transaction.transaction_type === 'cash_reported') {
          entry.reported_cash = Math.abs(transaction.amount);
        } else if (transaction.transaction_type === 'cash_given') {
          entry.cash_given = Math.abs(transaction.amount);
        }
        
        entry.total_cash = entry.reported_cash + entry.cash_given;
      });

      setDailyEntries(Array.from(workerEntries.values()));
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const handleAddEntry = async () => {
    if (!selectedWorker || !reportedCash || !cashGiven) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const worker = workers.find(w => w.id === selectedWorker);
    if (!worker) return;

    const reportedAmount = parseFloat(reportedCash);
    const givenAmount = parseFloat(cashGiven);

    if (isNaN(reportedAmount) || isNaN(givenAmount) || reportedAmount < 0 || givenAmount < 0) {
      toast({
        title: "Error",
        description: "Please enter valid positive amounts",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Remove any existing entries for this worker on this date
      await supabase
        .from('cash_transactions')
        .delete()
        .eq('worker_id', selectedWorker)
        .eq('transaction_date', selectedDateString);

      // Insert new transactions
      const transactions = [];
      
      if (reportedAmount > 0) {
        transactions.push({
          worker_id: selectedWorker,
          transaction_date: selectedDateString,
          amount: reportedAmount,
          balance_after: reportedAmount,
          transaction_type: 'cash_reported',
          notes: 'Daily cash reported'
        });
      }

      if (givenAmount > 0) {
        transactions.push({
          worker_id: selectedWorker,
          transaction_date: selectedDateString,
          amount: givenAmount,
          balance_after: reportedAmount + givenAmount,
          transaction_type: 'cash_given',
          notes: 'Daily cash given'
        });
      }

      if (transactions.length > 0) {
        const { error } = await supabase
          .from('cash_transactions')
          .insert(transactions);

        if (error) {
          throw error;
        }
      }

      // Reload entries for the selected date
      await loadEntriesForDate();

      // Clear form
      setSelectedWorker("");
      setReportedCash("");
      setCashGiven("");

      toast({
        title: "Success",
        description: `Cash entry recorded for ${worker.name} on ${format(selectedDate, "MMM dd, yyyy")}`,
      });
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error",
        description: "Failed to save cash entry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEntry = async (workerId: string) => {
    try {
      const { error } = await supabase
        .from('cash_transactions')
        .delete()
        .eq('worker_id', workerId)
        .eq('transaction_date', selectedDateString);

      if (error) {
        throw error;
      }

      // Reload entries for the selected date
      await loadEntriesForDate();
      
      toast({
        title: "Entry Removed",
        description: "Cash entry has been removed",
      });
    } catch (error) {
      console.error('Error removing entry:', error);
      toast({
        title: "Error",
        description: "Failed to remove cash entry",
        variant: "destructive"
      });
    }
  };

  const totalReported = dailyEntries.reduce((sum, entry) => sum + entry.reported_cash, 0);
  const totalGiven = dailyEntries.reduce((sum, entry) => sum + entry.cash_given, 0);
  const grandTotal = dailyEntries.reduce((sum, entry) => sum + entry.total_cash, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Cash Admin</h1>
          <p className="text-muted-foreground">Cash tracking for {format(selectedDate, "MMMM dd, yyyy")}</p>
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="date-picker">Select Date:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-picker"
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reported</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalReported.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Given</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalGiven.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${grandTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Entry */}
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
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
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
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="reported"
                  type="number"
                  step="0.01"
                  min="0"
                  value={reportedCash}
                  onChange={(e) => setReportedCash(e.target.value)}
                  placeholder="0.00"
                  className="pl-12 text-right font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="given">Cash Given</Label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="given"
                  type="number"
                  step="0.01"
                  min="0"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="0.00"
                  className="pl-12 text-right font-medium"
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
              onClick={handleAddEntry} 
              disabled={loading || !selectedWorker || !reportedCash || !cashGiven}
              className="w-full md:w-auto"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today's Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Entries for {format(selectedDate, "MMM dd, yyyy")}</CardTitle>
          <CardDescription>
            Worker cash status for selected date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailyEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cash entries recorded for {format(selectedDate, "MMM dd, yyyy")}
            </div>
          ) : (
            <div className="space-y-3">
              {dailyEntries.map((entry) => (
                <div key={entry.worker_id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{entry.worker_name}</h3>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Reported: </span>
                        <span className="font-medium">${entry.reported_cash.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Given: </span>
                        <span className="font-medium">${entry.cash_given.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-bold text-primary">${entry.total_cash.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveEntry(entry.worker_id)}
                    className="ml-4"
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}