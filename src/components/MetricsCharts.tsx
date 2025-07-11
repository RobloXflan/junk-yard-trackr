import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DollarSign, ShoppingCart, Car, TrendingUp } from "lucide-react";

const chartConfig = {
  vehicles: {
    label: "Vehicle Purchases",
    color: "hsl(var(--primary))",
  },
  business: {
    label: "Business Purchases", 
    color: "hsl(var(--secondary))",
  },
  amount: {
    label: "Amount",
    color: "hsl(var(--primary))",
  },
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function MetricsCharts() {
  const { vehicles } = useVehicleStore();

  // Fetch business purchases data
  const { data: businessPurchases = [], isLoading } = useQuery({
    queryKey: ['business-purchases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_purchases')
        .select('*')
        .order('purchase_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const chartData = useMemo(() => {
    // Calculate vehicle spending
    const vehicleSpending = vehicles
      .filter(v => v.purchasePrice && !isNaN(parseFloat(v.purchasePrice)))
      .reduce((sum, v) => sum + parseFloat(v.purchasePrice || '0'), 0);

    // Calculate business spending
    const businessSpending = businessPurchases
      .reduce((sum, p) => sum + (parseFloat(p.purchase_price?.toString() || '0') || 0), 0);

    // Category breakdown for business purchases
    const businessCategories = businessPurchases.reduce((acc, purchase) => {
      const category = purchase.category || 'Other';
      acc[category] = (acc[category] || 0) + (parseFloat(purchase.purchase_price?.toString() || '0') || 0);
      return acc;
    }, {} as Record<string, number>);

    // Monthly spending trends
    const monthlySpending = vehicles
      .filter(v => v.purchasePrice && v.purchaseDate && !isNaN(parseFloat(v.purchasePrice)))
      .reduce((acc, vehicle) => {
        const date = new Date(vehicle.purchaseDate!);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + parseFloat(vehicle.purchasePrice || '0');
        return acc;
      }, {} as Record<string, number>);

    return {
      totalSpending: [
        { category: "Vehicle Purchases", amount: vehicleSpending, color: chartConfig.vehicles.color },
        { category: "Business Purchases", amount: businessSpending, color: chartConfig.business.color },
      ],
      businessCategories: Object.entries(businessCategories).map(([category, amount]) => ({
        category,
        amount,
      })),
      monthlyTrends: Object.entries(monthlySpending)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12) // Last 12 months
        .map(([month, amount]) => ({
          month,
          amount,
        })),
      vehicleSpending,
      businessSpending,
      totalCombined: vehicleSpending + businessSpending,
    };
  }, [vehicles, businessPurchases]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading charts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Car className="h-4 w-4 text-primary" />
              Vehicle Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(chartData.vehicleSpending)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-secondary" />
              Business Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {formatCurrency(chartData.businessSpending)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Total Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(chartData.totalCombined)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Categories Breakdown - Now Full Width */}
      {chartData.businessCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Purchases by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.businessCategories}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="category" 
                    className="text-sm text-muted-foreground"
                  />
                  <YAxis 
                    className="text-sm text-muted-foreground"
                    tickFormatter={formatCurrency}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="var(--color-business)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Comparison Chart - Now in Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Spending Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.totalSpending}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="category" 
                    className="text-sm text-muted-foreground"
                  />
                  <YAxis 
                    className="text-sm text-muted-foreground"
                    tickFormatter={formatCurrency}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="var(--color-amount)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        {chartData.monthlyTrends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Purchases Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      className="text-sm text-muted-foreground"
                    />
                    <YAxis 
                      className="text-sm text-muted-foreground"
                      tickFormatter={formatCurrency}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="var(--color-vehicles)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}