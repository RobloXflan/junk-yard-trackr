
import { VehicleIntakeForm } from "@/components/VehicleIntakeForm";

interface IntakeProps {
  pendingIntakeId?: string;
}

export function Intake({ pendingIntakeId }: IntakeProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Intake</h1>
        <p className="text-black">
          {pendingIntakeId ? "Process email intake with pre-loaded documents" : "Add new vehicles to your inventory"}
        </p>
      </div>

      <VehicleIntakeForm pendingIntakeId={pendingIntakeId} />
    </div>
  );
}
