import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Car, Calendar, Target } from "lucide-react";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { useMemo } from "react";

export function Metrics() {
  const { vehicles } = useVehicleStore();

  const metrics = useMemo(() => {
    const totalVehicles = vehicles.length;
    const soldVehicles = vehicles.filter(v => v.status === 'sold');
    const yardVehicles = vehicles.filter(v => v.status === 'yard');
    const pypVehicles = vehicles.filter(v => v.status === 'pick-your-part');
    const saVehicles = vehicles.filter(v => v.status === 'sa-recycling');

    const totalRevenue = soldVehicles.reduce((sum, v) => {
      return sum + parseFloat(v.salePrice || '0');
    }, 0);

    const totalCost = vehicles.reduce((sum, v) => {
      return sum + parseFloat(v.purchasePrice || '0');
    }, 0);

    const profit = totalRevenue - soldVehicles.reduce((sum, v) => {
      return sum + parseFloat(v.purchasePrice || '0');
    }, 0);

    const averageProfit = soldVehicles.length > 0 ? profit / soldVehicles.length : 0;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Get vehicles added this month
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthVehicles = vehicles.filter(v => {
      const vehicleDate = new Date(v.createdAt);
      return vehicleDate.getMonth() === currentMonth && vehicleDate.getFullYear() === currentYear;
    });

    // Get vehicles sold this month
    const thisMonthSold = soldVehicles.filter(v => {
      if (!v.saleDate) return false;
      const saleDate = new Date(v.saleDate);
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
    });

    return {
      totalVehicles,
      soldVehicles: soldVehicles.length,
      yardVehicles: yardVehicles.length,
      pypVehicles: pypVehicles.length,
      saVehicles: saVehicles.length,
      totalRevenue,
      totalCost,
      profit,
      averageProfit,
      profitMargin,
      thisMonthAdded: thisMonthVehicles.length,
      thisMonthSold: thisMonthSold.length,
      thisMonthRevenue: thisMonthSold.reduce((sum, v) => sum + parseFloat(v.salePrice || '0'), 0),
    };
  }, [vehicles]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Metrics Dashboard</h2>
        <p className="text-muted-foreground">
          Track your business performance and key metrics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.thisMonthAdded} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.thisMonthRevenue)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.profit)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.profitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vehicles Sold</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.soldVehicles}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics.thisMonthSold} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">In Yard</span>
              <Badge variant="secondary">{metrics.yardVehicles}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sold</span>
              <Badge variant="default">{metrics.soldVehicles}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pick Your Part</span>
              <Badge variant="outline">{metrics.pypVehicles}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">SA Recycling</span>
              <Badge variant="outline">{metrics.saVehicles}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Average Profit per Sale</span>
              <span className="font-bold">{formatCurrency(metrics.averageProfit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Cost Basis</span>
              <span className="font-bold">{formatCurrency(metrics.totalCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profit Margin</span>
              <span className="font-bold flex items-center gap-1">
                {metrics.profitMargin.toFixed(1)}%
                {metrics.profitMargin > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Return on Investment</span>
              <span className="font-bold">
                {metrics.totalCost > 0 ? ((metrics.profit / metrics.totalCost) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This Month Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Month Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.thisMonthAdded}</div>
              <p className="text-sm text-muted-foreground">Vehicles Added</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.thisMonthSold}</div>
              <p className="text-sm text-muted-foreground">Vehicles Sold</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.thisMonthRevenue)}</div>
              <p className="text-sm text-muted-foreground">Revenue Generated</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}