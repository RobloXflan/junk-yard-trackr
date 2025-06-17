
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, DollarSign, FileText, TrendingUp } from "lucide-react";
import { useVehicleStore } from "@/hooks/useVehicleStore";

export function DashboardStats() {
  const { getTotalVehicles, getTotalRevenue, getPendingDocuments, getAverageProfit, getVehiclesAddedToday } = useVehicleStore();
  
  const totalVehicles = getTotalVehicles();
  const totalRevenue = getTotalRevenue();
  const pendingDocuments = getPendingDocuments();
  const avgProfit = getAverageProfit();
  const vehiclesAddedToday = getVehiclesAddedToday();

  const stats = [
    {
      title: "Total Vehicles",
      value: totalVehicles.toString(),
      change: totalVehicles === 0 ? "No vehicles yet" : `${totalVehicles} vehicle${totalVehicles !== 1 ? 's' : ''} in inventory`,
      icon: Car,
      color: "text-primary",
    },
    {
      title: "Revenue",
      value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "$0",
      change: totalRevenue === 0 ? "No sales yet" : `Total from sales`,
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Pending Documents",
      value: pendingDocuments.toString(),
      change: pendingDocuments === 0 ? "No pending documents" : `${pendingDocuments} vehicle${pendingDocuments !== 1 ? 's' : ''} need paperwork`,
      icon: FileText,
      color: "text-warning",
    },
    {
      title: "Added Today",
      value: vehiclesAddedToday.toString(),
      change: vehiclesAddedToday === 0 ? "No vehicles added today" : `${vehiclesAddedToday} vehicle${vehiclesAddedToday !== 1 ? 's' : ''} added today`,
      icon: TrendingUp,
      color: "text-info",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-business hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
