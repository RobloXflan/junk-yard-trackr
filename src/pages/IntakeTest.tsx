import { VehicleIntakeForm } from "@/components/VehicleIntakeForm";

export function IntakeTest() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Intake (Test Version)</h1>
        <p className="text-black">
          Test version - Changes here won't affect the main intake
        </p>
      </div>

      <VehicleIntakeForm />
    </div>
  );
}
