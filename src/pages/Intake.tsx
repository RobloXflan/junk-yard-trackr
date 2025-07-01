
import { VehicleIntakeForm } from "@/components/VehicleIntakeForm";
import { toast } from "sonner";

export function Intake() {
  const handleSuccess = () => {
    toast.success("Vehicle added successfully!");
    // Optionally refresh the page or redirect
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Intake</h1>
        <p className="text-black">
          Add new vehicles to your inventory
        </p>
      </div>

      <VehicleIntakeForm onSuccess={handleSuccess} />
    </div>
  );
}
