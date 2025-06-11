
import { VehicleIntakeForm } from "@/components/VehicleIntakeForm";

export function Intake() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Intake</h1>
        <p className="text-muted-foreground">
          Add new vehicles to your inventory
        </p>
      </div>

      <VehicleIntakeForm />
    </div>
  );
}
