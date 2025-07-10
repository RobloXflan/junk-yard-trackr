import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyCashEntry {
  worker_id: string;
  worker_name: string;
  reported_cash: number;
  dinero_dado?: number;
  dinero_recibido?: number;
  cash_given?: number;
  total_cash: number;
  source?: 'worker' | 'admin';
  entry_date?: string;
}

interface CashSummaryCardsProps {
  dailyEntries: DailyCashEntry[];
}

export function CashSummaryCards({ dailyEntries }: CashSummaryCardsProps) {
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
  );
}