
import { WorkerManagement } from "@/components/cash/WorkerManagement";
import { WorkerCheckinStatus } from "@/components/WorkerCheckinStatus";

export function Workers() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <WorkerCheckinStatus />
      <WorkerManagement />
    </div>
  );
}
