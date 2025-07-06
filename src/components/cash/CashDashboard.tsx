import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { DailyWorkerCashFlow } from "./DailyWorkerCashFlow";

interface WorkerBalance {
  id: string;
  name: string;
  current_balance: number;
  last_transaction_date: string;
}

interface DailySummary {
  total_turned_in: number;
  total_given_out: number;
  net_change: number;
  active_workers_count: number;
}

interface CashDashboardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function CashDashboard({ selectedDate, onDateChange }: CashDashboardProps) {
  const [workerBalances, setWorkerBalances] = useState<WorkerBalance[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    total_turned_in: 0,
    total_given_out: 0,
    net_change: 0,
    active_workers_count: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedDate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch worker balances
      const { data: workers } = await supabase
        .from('workers')
        .select('*')
        .eq('status', 'active');

      if (workers) {
        const balances = await Promise.all(
          workers.map(async (worker) => {
            const { data: lastTransaction } = await supabase
              .from('cash_transactions')
              .select('balance_after, transaction_date')
              .eq('worker_id', worker.id)
              .order('created_at', { ascending: false })
              .limit(1);

            return {
              id: worker.id,
              name: worker.name,
              current_balance: lastTransaction?.[0]?.balance_after || 0,
              last_transaction_date: lastTransaction?.[0]?.transaction_date || format(new Date(), 'yyyy-MM-dd')
            };
          })
        );
        setWorkerBalances(balances);
      }

      // Fetch daily summary
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data: transactions } = await supabase
        .from('cash_transactions')
        .select('transaction_type, amount')
        .eq('transaction_date', dateStr);

      if (transactions) {
        const summary = transactions.reduce(
          (acc, tx) => {
            if (tx.transaction_type === 'turn_in') {
              acc.total_turned_in += Number(tx.amount);
            } else if (tx.transaction_type === 'give_money') {
              acc.total_given_out += Number(tx.amount);
            }
            return acc;
          },
          { total_turned_in: 0, total_given_out: 0, net_change: 0, active_workers_count: workers?.length || 0 }
        );
        summary.net_change = summary.total_turned_in - summary.total_given_out;
        setDailySummary(summary);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCashHeld = workerBalances.reduce((sum, worker) => sum + worker.current_balance, 0);

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Daily Overview</h2>
        <Popover>
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
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Held</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCashHeld.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across {workerBalances.length} workers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Money Turned In</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${dailySummary.total_turned_in.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Today's total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Money Given Out</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${dailySummary.total_given_out.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Today's total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Change</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${dailySummary.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${dailySummary.net_change.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Today's net flow
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Worker Cash Flows */}
      <DailyWorkerCashFlow selectedDate={selectedDate} />

      {/* Worker Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Cash Balances</CardTitle>
          <CardDescription>Current cash held by each worker</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : workerBalances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No workers found. Add workers in the Workers tab.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workerBalances.map((worker) => (
                <Card key={worker.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{worker.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last: {format(new Date(worker.last_transaction_date), "MM/dd")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${worker.current_balance.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}