import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingCart, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface WorkerCashFlow {
  id: string;
  name: string;
  starting_balance: number;
  money_given: number;
  money_turned_in: number;
  vehicle_spending: number;
  ending_balance: number;
  net_change: number;
}

interface DailyWorkerCashFlowProps {
  selectedDate: Date;
}

export function DailyWorkerCashFlow({ selectedDate }: DailyWorkerCashFlowProps) {
  const [workerFlows, setWorkerFlows] = useState<WorkerCashFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkerCashFlows();
  }, [selectedDate]);

  const fetchWorkerCashFlows = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Get all active workers
      const { data: workers } = await supabase
        .from('workers')
        .select('*')
        .eq('status', 'active');

      if (!workers) return;

      // Calculate cash flow for each worker
      const flows = await Promise.all(
        workers.map(async (worker) => {
          // Get starting balance for the day
          const { data: startingBalanceData } = await supabase
            .from('cash_transactions')
            .select('balance_after')
            .eq('worker_id', worker.id)
            .eq('transaction_date', dateStr)
            .eq('transaction_type', 'starting_balance')
            .order('created_at', { ascending: false })
            .limit(1);

          // Get all transactions for the day (excluding starting balance)
          const { data: transactions } = await supabase
            .from('cash_transactions')
            .select('transaction_type, amount')
            .eq('worker_id', worker.id)
            .eq('transaction_date', dateStr)
            .in('transaction_type', ['turn_in', 'give_money']);

          // Calculate vehicle spending for the day
          // Using UPPER() to handle case insensitive matching
          const { data: vehicles } = await supabase
            .from('vehicles')
            .select('purchase_price')
            .eq('purchase_date', dateStr)
            .filter('seller_name', 'ilike', worker.name);

          const starting_balance = startingBalanceData?.[0]?.balance_after || 0;
          
          let money_given = 0;
          let money_turned_in = 0;
          
          transactions?.forEach(tx => {
            if (tx.transaction_type === 'give_money') {
              money_given += Number(tx.amount);
            } else if (tx.transaction_type === 'turn_in') {
              money_turned_in += Number(tx.amount);
            }
          });

          const vehicle_spending = vehicles?.reduce((sum, vehicle) => 
            sum + (Number(vehicle.purchase_price) || 0), 0) || 0;

          const net_change = money_given - money_turned_in;
          const ending_balance = starting_balance + net_change;

          return {
            id: worker.id,
            name: worker.name,
            starting_balance,
            money_given,
            money_turned_in,
            vehicle_spending,
            ending_balance,
            net_change
          };
        })
      );

      setWorkerFlows(flows);
    } catch (error) {
      console.error('Error fetching worker cash flows:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading worker cash flows...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Worker Cash Flow</h3>
          <p className="text-sm text-muted-foreground">
            Daily breakdown for {format(selectedDate, "MMM dd, yyyy")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {workerFlows.map((flow) => (
          <Card key={flow.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {flow.name}
                <Badge variant={flow.net_change >= 0 ? "default" : "destructive"}>
                  {flow.net_change >= 0 ? '+' : ''}${flow.net_change.toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Starting Cash:</span>
                    <span className="font-medium">${flow.starting_balance.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Money Given:
                    </span>
                    <span className="font-medium">+${flow.money_given.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-red-600">
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Money Turned In:
                    </span>
                    <span className="font-medium">−${flow.money_turned_in.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-orange-600">
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      Vehicle Spending:
                    </span>
                    <span className="font-medium">${flow.vehicle_spending.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between font-medium text-base pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Cash Remaining:
                    </span>
                    <span>${flow.ending_balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {flow.vehicle_spending > 0 && (
                <div className="mt-3 p-2 bg-orange-50 rounded text-xs text-orange-800">
                  💡 Vehicle spending explains cash reduction
                </div>
              )}
              
              {flow.starting_balance === 0 && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                  ⚠️ No starting balance recorded for this day
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {workerFlows.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No workers found. Add workers in the Workers tab.
          </CardContent>
        </Card>
      )}
    </div>
  );
}