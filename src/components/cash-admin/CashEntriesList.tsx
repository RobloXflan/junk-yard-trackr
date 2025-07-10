import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

interface CashEntriesListProps {
  dailyEntries: DailyCashEntry[];
  selectedDate: Date;
  onRemoveEntry: (workerId: string) => void;
}

export function CashEntriesList({ dailyEntries, selectedDate, onRemoveEntry }: CashEntriesListProps) {
  return (
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
                  onClick={() => onRemoveEntry(entry.worker_id)}
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
  );
}