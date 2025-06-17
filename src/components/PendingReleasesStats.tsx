
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";
import { useVehicleStore } from "@/hooks/useVehicleStore";

export function PendingReleasesStats() {
  const { vehicles } = useVehicleStore();
  
  const soldVehicles = vehicles.filter(v => v.status === 'sold');
  const totalSoldValue = soldVehicles.reduce((sum, v) => sum + parseFloat(v.salePrice || '0'), 0);
  const avgDaysToSell = soldVehicles.length > 0 ? Math.round(
    soldVehicles.reduce((sum, v) => {
      if (v.purchaseDate && v.saleDate) {
        const purchaseDate = new Date(v.purchaseDate);
        const saleDate = new Date(v.saleDate);
        const daysDiff = Math.floor((saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + daysDiff;
      }
      return sum;
    }, 0) / soldVehicles.length
  ) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="shadow-business">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending Releases
          </CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{soldVehicles.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {soldVehicles.length === 0 ? "No vehicles pending release" : `${soldVehicles.length} vehicle${soldVehicles.length !== 1 ? 's' : ''} awaiting documentation`}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-business">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Sales Value
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalSoldValue > 0 ? `$${totalSoldValue.toLocaleString()}` : "$0"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {soldVehicles.length === 0 ? "No sales yet" : `From ${soldVehicles.length} sold vehicle${soldVehicles.length !== 1 ? 's' : ''}`}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-business">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg. Days to Sell
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-info" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgDaysToSell}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {avgDaysToSell === 0 ? "No data available" : "Average time from purchase to sale"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
