import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  status: string;
}

interface WorkerCheckin {
  worker_id: string;
  starting_cash: number;
  money_added: number;
  money_subtracted: number;
  final_total: number;
  created_at: string;
}

interface WorkerWithCheckin extends Worker {
  checkin?: WorkerCheckin;
}

export function WorkerCheckinStatus() {
  const [workers, setWorkers] = useState<WorkerWithCheckin[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkersAndCheckins();
  }, [selectedDate]);

  const fetchWorkersAndCheckins = async () => {
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Fetch all active workers
      const { data: workersData, error: workersError } = await supabase
        .from("workers")
        .select("id, name, status")
        .eq("status", "active")
        .order("name");

      if (workersError) throw workersError;

      // Fetch check-ins for the selected date
      const { data: checkinsData, error: checkinsError } = await supabase
        .from("worker_checkins")
        .select("worker_id, starting_cash, money_added, money_subtracted, final_total, created_at")
        .eq("checkin_date", formattedDate);

      if (checkinsError) throw checkinsError;

      // Combine workers with their check-ins
      const workersWithCheckins: WorkerWithCheckin[] = (workersData || []).map(worker => ({
        ...worker,
        checkin: checkinsData?.find(checkin => checkin.worker_id === worker.id)
      }));

      setWorkers(workersWithCheckins);
    } catch (error) {
      console.error("Error fetching workers and check-ins:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (worker: WorkerWithCheckin) => {
    if (!worker.checkin) {
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusBadge = (worker: WorkerWithCheckin) => {
    if (!worker.checkin) {
      return <Badge variant="secondary">No Report</Badge>;
    }
    
    const { starting_cash, money_added, money_subtracted, final_total } = worker.checkin;
    let mathDisplay = `$${starting_cash.toFixed(2)}`;
    
    if (money_added > 0) {
      mathDisplay += ` + $${money_added.toFixed(2)} = $${final_total.toFixed(2)}`;
    } else if (money_subtracted > 0) {
      mathDisplay += ` - $${money_subtracted.toFixed(2)} = $${final_total.toFixed(2)}`;
    } else {
      mathDisplay = `$${final_total.toFixed(2)}`;
    }
    
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
      {mathDisplay}
    </Badge>;
  };

  const getCheckinTime = (worker: WorkerWithCheckin) => {
    if (!worker.checkin) return null;
    return format(new Date(worker.checkin.created_at), 'h:mm a');
  };

  const todayStats = {
    total: workers.length,
    reported: workers.filter(w => w.checkin).length,
    totalCash: workers.reduce((sum, w) => sum + (w.checkin?.final_total || 0), 0),
    totalStarting: workers.reduce((sum, w) => sum + (w.checkin?.starting_cash || 0), 0)
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
        <div>
          <CardTitle>Worker Cash Reports</CardTitle>
          <CardDescription>
            Track daily worker cash reports and totals
          </CardDescription>
        </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[240px] pl-3 text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{todayStats.total}</div>
            <div className="text-sm text-blue-600">Total Workers</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{todayStats.reported}</div>
            <div className="text-sm text-gray-600">Reported</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">${todayStats.totalCash.toFixed(2)}</div>
            <div className="text-sm text-green-600">Total Final Cash</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">${todayStats.totalStarting.toFixed(2)}</div>
            <div className="text-sm text-purple-600">Total Starting Cash</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-3">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(worker)}
                  <div>
                    <div className="font-medium">{worker.name}</div>
                    {getCheckinTime(worker) && (
                      <div className="text-sm text-gray-500">
                        Reported at {getCheckinTime(worker)}
                      </div>
                    )}
                    {worker.checkin && (
                      <div className="text-xs text-gray-400">
                        Start: ${worker.checkin.starting_cash.toFixed(2)} | 
                        {worker.checkin.money_subtracted > 0 && `Gave Company: $${worker.checkin.money_subtracted.toFixed(2)} (${worker.checkin.starting_cash.toFixed(2)} - ${worker.checkin.money_subtracted.toFixed(2)} = ${worker.checkin.final_total.toFixed(2)}) | `}
                        {worker.checkin.money_added > 0 && `Company Gave: $${worker.checkin.money_added.toFixed(2)} (${worker.checkin.starting_cash.toFixed(2)} + ${worker.checkin.money_added.toFixed(2)} = ${worker.checkin.final_total.toFixed(2)}) | `}
                        Final: ${worker.checkin.final_total.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  {getStatusBadge(worker)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}