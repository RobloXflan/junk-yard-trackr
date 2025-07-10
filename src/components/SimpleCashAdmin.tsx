import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, Plus, Calculator, QrCode, Users, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { QRCodeDisplay } from "./QRCodeDisplay";

interface Worker {
  id: string;
  name: string;
}

interface DailyCashEntry {
  worker_id: string;
  worker_name: string;
  reported_cash: number;
  dinero_dado?: number;
  dinero_recibido?: number;
  cash_given?: number; // Keep for backward compatibility
  total_cash: number;
  source?: 'worker' | 'admin';
  entry_date?: string;
}

export function SimpleCashAdmin() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyCashEntry[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [reportedCash, setReportedCash] = useState("");
  const [cashGiven, setCashGiven] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  
  console.log('Admin - selected date:', selectedDate);
  console.log('Admin - dateKey:', dateKey);

  useEffect(() => {
    fetchWorkers();
    loadEntriesForDate(dateKey);
  }, [dateKey]);

  useEffect(() => {
    fetchWorkers();
  }, []);

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

  const loadEntriesForDate = async (date: string) => {
    console.log('Admin - loading entries for date:', date);
    console.log('Admin - checking localStorage key:', `dailyCash_${date}`);
    
    // Debug: Show all localStorage keys that start with 'dailyCash_'
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('dailyCash_'));
    console.log('Admin - all dailyCash localStorage keys found:', allKeys);
    
    // Load from localStorage for the selected date
    const stored = localStorage.getItem(`dailyCash_${date}`);
    console.log('Admin - found stored data:', stored);
    
    if (stored) {
      const parsedData = JSON.parse(stored);
      console.log('Admin - parsed data:', parsedData);
      setDailyEntries(parsedData);
    } else {
      console.log('Admin - no data found, setting empty array');
      setDailyEntries([]);
    }
  };

  // Auto-refresh entries every 10 seconds to pick up worker submissions
  useEffect(() => {
    const interval = setInterval(() => loadEntriesForDate(dateKey), 10000);
    return () => clearInterval(interval);
  }, [dateKey]);

  const saveEntriesForDate = (entries: DailyCashEntry[], date: string) => {
    localStorage.setItem(`dailyCash_${date}`, JSON.stringify(entries));
    setDailyEntries(entries);
  };

  const handleAddEntry = () => {
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
    const totalAmount = reportedAmount + givenAmount;

    if (isNaN(reportedAmount) || isNaN(givenAmount) || reportedAmount < 0 || givenAmount < 0) {
      toast({
        title: "Error",
        description: "Please enter valid positive amounts",
        variant: "destructive"
      });
      return;
    }

    const newEntry: DailyCashEntry = {
      worker_id: selectedWorker,
      worker_name: worker.name,
      reported_cash: reportedAmount,
      cash_given: givenAmount,
      total_cash: totalAmount,
      source: 'admin'
    };

    // Check if worker already has an entry today
    const existingEntries = dailyEntries.filter(entry => entry.worker_id !== selectedWorker);
    const updatedEntries = [...existingEntries, newEntry];

    saveEntriesForDate(updatedEntries, dateKey);

    // Clear form
    setSelectedWorker("");
    setReportedCash("");
    setCashGiven("");

    toast({
      title: "Success",
      description: `Cash entry recorded for ${worker.name}`,
    });
  };

  const handleRemoveEntry = (workerId: string) => {
    const updatedEntries = dailyEntries.filter(entry => entry.worker_id !== workerId);
    saveEntriesForDate(updatedEntries, dateKey);
    
    toast({
      title: "Entry Removed",
      description: "Cash entry has been removed",
    });
  };

  const totalReported = dailyEntries.reduce((sum, entry) => sum + entry.reported_cash, 0);
  const totalGiven = dailyEntries.reduce((sum, entry) => {
    // Handle both old format (cash_given) and new format (dinero_dado - dinero_recibido)
    if (entry.dinero_dado !== undefined || entry.dinero_recibido !== undefined) {
      return sum + (entry.dinero_dado || 0) - (entry.dinero_recibido || 0);
    }
    return sum + (entry.cash_given || 0);
  }, 0);
  const grandTotal = dailyEntries.reduce((sum, entry) => sum + entry.total_cash, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Cash Admin</h1>
          <p className="text-muted-foreground">Simple cash tracking for {format(selectedDate, "MMMM dd, yyyy")}</p>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select Date to View
          </CardTitle>
          <CardDescription>
            Choose a date to view cash entries for that day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label className="text-base">Date:</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
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
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setDatePickerOpen(false); // Close the popover when date is selected
                    }
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {dailyEntries.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {dailyEntries.length} entries found
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="entries" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Cash Entries
          </TabsTrigger>
          <TabsTrigger value="qr-code" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Worker QR Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qr-code" className="space-y-4">
          <QRCodeDisplay />
        </TabsContent>

        <TabsContent value="entries" className="space-y-4">

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
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reported"
                  type="number"
                  step="0.01"
                  min="0"
                  value={reportedCash}
                  onChange={(e) => setReportedCash(e.target.value)}
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
                  onChange={(e) => setCashGiven(e.target.value)}
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
          <CardTitle>Cash Entries</CardTitle>
          <CardDescription>
            Cash entries for {format(selectedDate, "MMMM dd, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailyEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cash entries recorded for {format(selectedDate, "MMMM dd, yyyy")}
            </div>
          ) : (
            <div className="space-y-3">
              {dailyEntries.map((entry) => (
                <div key={entry.worker_id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{entry.worker_name}</h3>
                      <Badge variant={entry.source === 'worker' ? 'default' : 'secondary'} className="text-xs">
                        {entry.source === 'worker' ? 'Worker Submitted' : 'Admin Added'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Reported: </span>
                        <span className="font-medium">${entry.reported_cash.toFixed(2)}</span>
                      </div>
                      {entry.dinero_dado !== undefined || entry.dinero_recibido !== undefined ? (
                        <>
                          {entry.dinero_dado! > 0 && (
                            <div>
                              <span className="text-red-600">Dinero Dado (-): </span>
                              <span className="font-medium text-red-600">${entry.dinero_dado!.toFixed(2)}</span>
                            </div>
                          )}
                          {entry.dinero_recibido! > 0 && (
                            <div>
                              <span className="text-green-600">Dinero Recibido (+): </span>
                              <span className="font-medium text-green-600">${entry.dinero_recibido!.toFixed(2)}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <span className="text-muted-foreground">Given: </span>
                          <span className="font-medium">${(entry.cash_given || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="col-span-2 border-t pt-2">
                        <span className="text-muted-foreground">Final Total: </span>
                        <span className="font-bold text-primary">${entry.total_cash.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveEntry(entry.worker_id)}
                    className="ml-4"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}