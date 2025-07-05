import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Filter, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  notes: string | null;
  created_at: string;
  worker: {
    name: string;
  };
}

interface TransactionHistoryProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TransactionHistory({ selectedDate, onDateChange }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    fetchTransactions();
  }, [selectedDate, dateRange]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('cash_transactions')
        .select(`
          *,
          workers:worker_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (dateRange === "today") {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('transaction_date', dateStr);
      } else if (dateRange === "week") {
        const weekAgo = new Date(selectedDate);
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query
          .gte('transaction_date', format(weekAgo, 'yyyy-MM-dd'))
          .lte('transaction_date', format(selectedDate, 'yyyy-MM-dd'));
      } else if (dateRange === "month") {
        const monthAgo = new Date(selectedDate);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query
          .gte('transaction_date', format(monthAgo, 'yyyy-MM-dd'))
          .lte('transaction_date', format(selectedDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = (data || []).map(transaction => ({
        ...transaction,
        worker: {
          name: (transaction.workers as any)?.name || 'Unknown Worker'
        }
      }));

      setTransactions(transformedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'turn_in':
        return 'Turned In';
      case 'give_money':
        return 'Given Out';
      case 'starting_balance':
        return 'Starting Balance';
      default:
        return type;
    }
  };

  const getTransactionTypeVariant = (type: string) => {
    switch (type) {
      case 'turn_in':
        return 'destructive';
      case 'give_money':
        return 'default';
      case 'starting_balance':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const exportTransactions = () => {
    if (transactions.length === 0) return;

    const csvContent = [
      ['Date', 'Worker', 'Type', 'Amount', 'Balance After', 'Notes'].join(','),
      ...transactions.map(tx => [
        tx.transaction_date,
        tx.worker.name,
        getTransactionTypeLabel(tx.transaction_type),
        tx.amount.toFixed(2),
        tx.balance_after.toFixed(2),
        tx.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-transactions-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Transaction History</h2>
          <p className="text-muted-foreground">
            View and export cash transaction records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={dateRange === "today" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("today")}
              className="rounded-r-none"
            >
              Today
            </Button>
            <Button
              variant={dateRange === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("week")}
              className="rounded-none border-x"
            >
              Week
            </Button>
            <Button
              variant={dateRange === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDateRange("month")}
              className="rounded-l-none"
            >
              Month
            </Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "MM/dd/yyyy")}
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

          <Button variant="outline" onClick={exportTransactions} disabled={transactions.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `${transactions.length} transactions found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found for the selected period.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Worker</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance After</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.transaction_date), "MM/dd/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.worker.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTransactionTypeVariant(transaction.transaction_type) as any}>
                        {getTransactionTypeLabel(transaction.transaction_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={
                        transaction.transaction_type === 'turn_in' ? 'text-red-600' : 'text-green-600'
                      }>
                        {transaction.transaction_type === 'turn_in' ? '−' : '+'}
                        ${transaction.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${transaction.balance_after.toFixed(2)}
                    </TableCell>
                    <TableCell>{transaction.notes || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(transaction.created_at), "h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}