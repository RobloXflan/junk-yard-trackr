
import { DashboardStats } from "@/components/DashboardStats";
import { PendingReleasesStats } from "@/components/PendingReleasesStats";

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
      
      <PendingReleasesStats />
    </div>
  );
}
