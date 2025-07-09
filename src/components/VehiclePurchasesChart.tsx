import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { format, parseISO, startOfMonth, eachDayOfInterval, eachMonthOfInterval, subDays, subMonths } from "date-fns";

interface ChartDataPoint {
  date: string;
  count: number;
  formattedDate: string;
}

type ViewMode = 'daily' | 'monthly';

const chartConfig = {
  count: {
    label: "Vehicles Purchased",
    color: "hsl(var(--primary))",
  },
};

export function VehiclePurchasesChart() {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const { vehicles } = useVehicleStore();

  const chartData = useMemo(() => {
    if (!vehicles.length) return [];

    // Filter vehicles with valid purchase dates
    const vehiclesWithDates = vehicles.filter(v => v.purchaseDate && v.purchaseDate.trim() !== '');

    if (vehiclesWithDates.length === 0) return [];

    const today = new Date();
    let dateRange: Date[];
    let groupBy: (date: Date) => string;
    let formatLabel: (date: Date) => string;

    if (viewMode === 'daily') {
      // Show last 30 days
      const thirtyDaysAgo = subDays(today, 29);
      dateRange = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
      groupBy = (date: Date) => format(date, 'yyyy-MM-dd');
      formatLabel = (date: Date) => format(date, 'MMM dd');
    } else {
      // Show last 12 months
      const twelveMonthsAgo = subMonths(startOfMonth(today), 11);
      dateRange = eachMonthOfInterval({ start: twelveMonthsAgo, end: today });
      groupBy = (date: Date) => format(date, 'yyyy-MM');
      formatLabel = (date: Date) => format(date, 'MMM yyyy');
    }

    // Group vehicles by date
    const dateGroups = vehiclesWithDates.reduce((acc, vehicle) => {
      try {
        const purchaseDate = parseISO(vehicle.purchaseDate!);
        const key = groupBy(purchaseDate);
        acc[key] = (acc[key] || 0) + 1;
      } catch (error) {
        console.warn('Invalid purchase date:', vehicle.purchaseDate);
      }
      return acc;
    }, {} as Record<string, number>);

    // Create chart data for all dates in range
    return dateRange.map(date => {
      const key = groupBy(date);
      return {
        date: key,
        count: dateGroups[key] || 0,
        formattedDate: formatLabel(date),
      };
    });
  }, [vehicles, viewMode]);

  const totalVehicles = chartData.reduce((sum, point) => sum + point.count, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-medium">Vehicle Purchases Over Time</CardTitle>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('daily')}
          >
            <CalendarDays className="h-4 w-4 mr-1" />
            Daily
          </Button>
          <Button
            variant={viewMode === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('monthly')}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Monthly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No vehicle purchase data available
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-2xl font-bold">{totalVehicles}</p>
              <p className="text-xs text-muted-foreground">
                Total vehicles in {viewMode === 'daily' ? 'last 30 days' : 'last 12 months'}
              </p>
            </div>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formattedDate"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-count)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}