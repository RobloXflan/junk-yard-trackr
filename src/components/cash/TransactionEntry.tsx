import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, Calculator, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  current_balance: number;
}

interface TransactionEntryProps {
  selectedDate: Date;
}

export function TransactionEntry({ selectedDate }: TransactionEntryProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<Date>(selectedDate);
  const [transactionType, setTransactionType] = useState<"turn_in" | "give_money" | "starting_balance">("turn_in");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    if (selectedWorker) {
      const worker = workers.find(w => w.id === selectedWorker);
      setCurrentBalance(worker?.current_balance || 0);
    }
  }, [selectedWorker, workers]);

  const fetchWorkers = async () => {
    try {
      const { data: workersData } = await supabase
        .from('workers')
        .select('*')
        .eq('status', 'active');

      if (workersData) {
        const workersWithBalances = await Promise.all(
          workersData.map(async (worker) => {
            const { data: lastTransaction } = await supabase
              .from('cash_transactions')
              .select('balance_after')
              .eq('worker_id', worker.id)
              .order('created_at', { ascending: false })
              .limit(1);

            return {
              id: worker.id,
              name: worker.name,
              current_balance: lastTransaction?.[0]?.balance_after || 0
            };
          })
        );
        setWorkers(workersWithBalances);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const calculateNewBalance = () => {
    const amountNum = parseFloat(amount) || 0;
    if (transactionType === "starting_balance") {
      return amountNum;
    } else if (transactionType === "turn_in") {
      return currentBalance - amountNum;
    } else {
      return currentBalance + amountNum;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorker || !amount) {
      toast({
        title: "Error",
        description: "Please select a worker and enter an amount",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const newBalance = calculateNewBalance();
      const dateStr = format(transactionDate, 'yyyy-MM-dd');

      const { error } = await supabase
        .from('cash_transactions')
        .insert([{
          worker_id: selectedWorker,
          transaction_date: dateStr,
          transaction_type: transactionType,
          amount: amountNum,
          balance_after: newBalance,
          notes: notes.trim() || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction recorded successfully"
      });

      // Reset form
      setSelectedWorker("");
      setTransactionDate(selectedDate);
      setAmount("");
      setNotes("");
      setCurrentBalance(0);
      
      // Refresh workers to get updated balances
      fetchWorkers();
    } catch (error) {
      console.error('Error recording transaction:', error);
      toast({
        title: "Error",
        description: "Failed to record transaction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const newBalance = calculateNewBalance();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="worker">Select Worker *</Label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a worker..." />
              </SelectTrigger>
              <SelectContent>
                {workers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name} (Current: ${worker.current_balance.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Transaction Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !transactionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {transactionDate ? format(transactionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={transactionDate}
                  onSelect={(date) => date && setTransactionDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <Label>Transaction Type *</Label>
            <RadioGroup
              value={transactionType}
              onValueChange={(value) => setTransactionType(value as "turn_in" | "give_money" | "starting_balance")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="starting_balance" id="starting_balance" />
                <Label htmlFor="starting_balance">Set Starting Balance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="turn_in" id="turn_in" />
                <Label htmlFor="turn_in">Turn In Money (Subtract)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="give_money" id="give_money" />
                <Label htmlFor="give_money">Give Money (Add)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this transaction..."
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Transaction Preview
              </CardTitle>
              <CardDescription>
                Review the transaction details before submitting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Date:</span>
                <span className="font-medium">{format(transactionDate, "MMM dd, yyyy")}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Worker:</span>
                <span className="font-medium">
                  {selectedWorker ? workers.find(w => w.id === selectedWorker)?.name : "—"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Balance:</span>
                <span className="font-medium">${currentBalance.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Transaction:</span>
                <span className={`font-medium ${
                  transactionType === 'starting_balance' ? 'text-blue-600' : 
                  transactionType === 'turn_in' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transactionType === 'starting_balance' ? 'Set to' : 
                   transactionType === 'turn_in' ? '−' : '+'} ${parseFloat(amount) || 0}
                </span>
              </div>

              <hr />

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">New Balance:</span>
                <span className="text-lg font-bold">${newBalance.toFixed(2)}</span>
              </div>

              {newBalance < 0 && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  ⚠️ Warning: This transaction will result in a negative balance
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading || !selectedWorker || !amount}>
            {loading ? "Recording..." : "Record Transaction"}
          </Button>
        </div>
      </div>
    </form>
  );
}