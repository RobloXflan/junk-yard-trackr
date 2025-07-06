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
  previous_ending_balance: number;
  money_given: number;
  money_turned_in: number;
  vehicle_spending_previous_day: number;
  expected_vs_actual_difference: number;
  net_unexplained: number;
  ending_balance: number;
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
      const previousDate = new Date(selectedDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousDateStr = format(previousDate, 'yyyy-MM-dd');
      
      // Get all active workers
      const { data: workers } = await supabase
        .from('workers')
        .select('*')
        .eq('status', 'active');

      if (!workers) return;

      // Calculate cash flow for each worker
      const flows = await Promise.all(
        workers.map(async (worker) => {
          // Get starting balance for the current day
          const { data: startingBalanceData } = await supabase
            .from('cash_transactions')
            .select('balance_after')
            .eq('worker_id', worker.id)
            .eq('transaction_date', dateStr)
            .eq('transaction_type', 'starting_balance')
            .order('created_at', { ascending: false })
            .limit(1);

          // Get previous day's ending balance
          const { data: previousTransactions } = await supabase
            .from('cash_transactions')
            .select('balance_after, transaction_type, amount')
            .eq('worker_id', worker.id)
            .eq('transaction_date', previousDateStr)
            .order('created_at', { ascending: false });

          // Calculate previous day's ending balance
          let previous_ending_balance = 0;
          if (previousTransactions && previousTransactions.length > 0) {
            // Get the starting balance for previous day
            const prevStarting = previousTransactions.find(tx => tx.transaction_type === 'starting_balance')?.balance_after || 0;
            // Calculate net transactions for previous day
            const prevNetTransactions = previousTransactions
              .filter(tx => tx.transaction_type !== 'starting_balance')
              .reduce((sum, tx) => {
                return sum + (tx.transaction_type === 'give_money' ? Number(tx.amount) : -Number(tx.amount));
              }, 0);
            
            previous_ending_balance = prevStarting + prevNetTransactions;
          }

          // Get current day transactions (excluding starting balance)
          const { data: transactions } = await supabase
            .from('cash_transactions')
            .select('transaction_type, amount')
            .eq('worker_id', worker.id)
            .eq('transaction_date', dateStr)
            .in('transaction_type', ['turn_in', 'give_money']);

          // Get vehicle spending from PREVIOUS day
          const { data: previousDayVehicles } = await supabase
            .from('vehicles')
            .select('purchase_price')
            .eq('purchase_date', previousDateStr)
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

          const vehicle_spending_previous_day = previousDayVehicles?.reduce((sum, vehicle) => 
            sum + (Number(vehicle.purchase_price) || 0), 0) || 0;

          // Calculate the differences
          const expected_vs_actual_difference = previous_ending_balance - starting_balance;
          const net_unexplained = expected_vs_actual_difference - vehicle_spending_previous_day;
          const ending_balance = starting_balance + money_given - money_turned_in;

          return {
            id: worker.id,
            name: worker.name,
            starting_balance,
            previous_ending_balance,
            money_given,
            money_turned_in,
            vehicle_spending_previous_day,
            expected_vs_actual_difference,
            net_unexplained,
            ending_balance
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
                <Badge variant={flow.net_unexplained >= 0 ? "default" : "destructive"}>
                  {flow.net_unexplained >= 0 ? '+' : ''}${flow.net_unexplained.toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Expected Cash:</span>
                    <span className="font-medium">${flow.previous_ending_balance.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Actual Starting:</span>
                    <span className="font-medium">${flow.starting_balance.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-red-600">
                    <span className="text-muted-foreground">Missing Cash:</span>
                    <span className="font-medium">${flow.expected_vs_actual_difference.toFixed(2)}</span>
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
                      Vehicles (Prev Day):
                    </span>
                    <span className="font-medium">${flow.vehicle_spending_previous_day.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between font-medium text-base pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Net Unexplained:
                    </span>
                    <span className={flow.net_unexplained === 0 ? 'text-green-600' : 'text-red-600'}>
                      ${flow.net_unexplained.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-medium text-base pt-1">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Ending Balance:
                    </span>
                    <span>${flow.ending_balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {flow.vehicle_spending_previous_day > 0 && (
                <div className="mt-3 p-2 bg-orange-50 rounded text-xs text-orange-800">
                  💡 ${flow.vehicle_spending_previous_day.toFixed(2)} spent on vehicles yesterday explains some cash reduction
                </div>
              )}

              {flow.net_unexplained === 0 && flow.expected_vs_actual_difference !== 0 && (
                <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800">
                  ✅ All missing cash explained by vehicle purchases
                </div>
              )}

              {flow.net_unexplained !== 0 && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-800">
                  ⚠️ ${Math.abs(flow.net_unexplained).toFixed(2)} still unexplained
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