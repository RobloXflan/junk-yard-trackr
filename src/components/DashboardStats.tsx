
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, DollarSign, FileText, TrendingUp } from "lucide-react";

export function DashboardStats() {
  const stats = [
    {
      title: "Total Vehicles",
      value: "142",
      change: "+12 this month",
      icon: Car,
      color: "text-primary",
    },
    {
      title: "Revenue",
      value: "$18,450",
      change: "+8.2% from last month",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Pending DMV",
      value: "8",
      change: "3 need attention",
      icon: FileText,
      color: "text-warning",
    },
    {
      title: "Avg. Profit",
      value: "$285",
      change: "+5.4% improvement",
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
