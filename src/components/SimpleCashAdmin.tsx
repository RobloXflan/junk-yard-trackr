import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { DateSelector } from "./cash-admin/DateSelector";
import { CashSummaryCards } from "./cash-admin/CashSummaryCards";
import { AddCashEntry } from "./cash-admin/AddCashEntry";
import { CashEntriesList } from "./cash-admin/CashEntriesList";

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
      console.log('Admin - entries count found:', parsedData.length);
      setDailyEntries(parsedData);
    } else {
      console.log('Admin - no data found for key:', `dailyCash_${date}`);
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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Cash Admin</h1>
          <p className="text-muted-foreground">Simple cash tracking for {format(selectedDate, "MMMM dd, yyyy")}</p>
        </div>
      </div>

      <DateSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        entriesCount={dailyEntries.length}
        datePickerOpen={datePickerOpen}
        onDatePickerOpenChange={setDatePickerOpen}
      />

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
          <CashSummaryCards dailyEntries={dailyEntries} />

          <AddCashEntry
            workers={workers}
            selectedWorker={selectedWorker}
            onWorkerChange={setSelectedWorker}
            reportedCash={reportedCash}
            onReportedCashChange={setReportedCash}
            cashGiven={cashGiven}
            onCashGivenChange={setCashGiven}
            onAddEntry={handleAddEntry}
            loading={loading}
          />

          <CashEntriesList
            dailyEntries={dailyEntries}
            selectedDate={selectedDate}
            onRemoveEntry={handleRemoveEntry}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}