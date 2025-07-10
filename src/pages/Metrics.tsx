import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { useMemo, useState } from "react";
import { format, parseISO, isValid, startOfDay, endOfDay } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function Metrics() {
  const { vehicles } = useVehicleStore();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const financialData = useMemo(() => {
    // Filter vehicles that have valid purchase prices and dates
    const vehiclesWithPurchaseData = vehicles.filter(v => 
      v.purchasePrice && 
      v.purchaseDate && 
      !isNaN(parseFloat(v.purchasePrice))
    );

    // Calculate grand total
    const grandTotal = vehiclesWithPurchaseData.reduce((sum, v) => {
      return sum + parseFloat(v.purchasePrice || '0');
    }, 0);

    // Group by purchase date
    const dailyBreakdown = vehiclesWithPurchaseData.reduce((acc, vehicle) => {
      const purchaseDate = vehicle.purchaseDate;
      const purchaseAmount = parseFloat(vehicle.purchasePrice || '0');
      
      if (!acc[purchaseDate]) {
        acc[purchaseDate] = {
          total: 0,
          vehicles: []
        };
      }
      
      acc[purchaseDate].total += purchaseAmount;
      acc[purchaseDate].vehicles.push({
        id: vehicle.id,
        vehicleId: vehicle.vehicleId,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        purchasePrice: purchaseAmount
      });
      
      return acc;
    }, {} as Record<string, { total: number; vehicles: Array<{ id: string; vehicleId: string; year: string; make: string; model: string; purchasePrice: number }> }>);

    // Sort dates in descending order (most recent first)
    const sortedDates = Object.keys(dailyBreakdown).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    });

    return {
      grandTotal,
      dailyBreakdown,
      sortedDates,
      totalVehicles: vehiclesWithPurchaseData.length
    };
  }, [vehicles]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'MMMM d, yyyy');
      }
    } catch (error) {
      // Fallback for different date formats
    }
    return dateString;
  };

  const toggleDateExpansion = (date: string) => {
    const newExpandedDates = new Set(expandedDates);
    if (newExpandedDates.has(date)) {
      newExpandedDates.delete(date);
    } else {
      newExpandedDates.add(date);
    }
    setExpandedDates(newExpandedDates);
  };

  // Filter dates based on selected date
  const filteredDates = selectedDate 
    ? financialData.sortedDates.filter(date => date.includes(selectedDate))
    : financialData.sortedDates;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Financial Metrics</h2>
        <p className="text-muted-foreground">
          Track total spending based on vehicle purchase data
        </p>
      </div>

      {/* Grand Total Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Grand Total Spent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary mb-2">
            {formatCurrency(financialData.grandTotal)}
          </div>
          <p className="text-muted-foreground">
            Across {financialData.totalVehicles} vehicle purchases
          </p>
        </CardContent>
      </Card>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Purchase Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Input
              type="date"
              placeholder="Filter by date (YYYY-MM-DD)"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
            {selectedDate && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedDate("")}
                size="sm"
              >
                Clear Filter
              </Button>
            )}
          </div>

          {filteredDates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedDate ? "No purchases found for the selected date." : "No purchase data available."}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredDates.map((date) => {
                const dayData = financialData.dailyBreakdown[date];
                const isExpanded = expandedDates.has(date);
                
                return (
                  <Collapsible key={date}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto"
                        onClick={() => toggleDateExpansion(date)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">
                            {date}
                          </Badge>
                          <span className="font-medium">
                            {formatDate(date)}
                          </span>
                          <span className="text-muted-foreground">
                            ({dayData.vehicles.length} vehicle{dayData.vehicles.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            {formatCurrency(dayData.total)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="space-y-2 border-l-2 border-muted pl-4 ml-2">
                        {dayData.vehicles.map((vehicle) => (
                          <div key={vehicle.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <div className="text-sm">
                              <span className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</span>
                              <span className="text-muted-foreground ml-2">#{vehicle.vehicleId}</span>
                            </div>
                            <span className="font-medium">
                              {formatCurrency(vehicle.purchasePrice)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}