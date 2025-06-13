
import { DashboardStats } from "@/components/DashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, AlertTriangle } from "lucide-react";

export function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-black">
          Overview of your junk car business operations
        </p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-business">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black font-bold">
              <TrendingUp className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">2015 Honda Civic sold</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <span className="text-sm font-medium text-success">+$1,000</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-info rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">DMV form submitted</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New vehicle added</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-business">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black font-bold">
              <AlertTriangle className="w-5 h-5" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-warning/10 border border-warning rounded-lg">
                <Clock className="w-4 h-4 text-warning" />
                <div className="flex-1">
                  <p className="text-sm font-medium">3 DMV forms need submission</p>
                  <p className="text-xs text-muted-foreground">Due today</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-info/10 border border-info rounded-lg">
                <BarChart3 className="w-4 h-4 text-info" />
                <div className="flex-1">
                  <p className="text-sm font-medium">5 vehicles ready for PYP</p>
                  <p className="text-xs text-muted-foreground">Can be processed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent rounded-lg">
                <TrendingUp className="w-4 h-4 text-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Monthly report available</p>
                  <p className="text-xs text-muted-foreground">Ready for review</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
