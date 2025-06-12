
import { VehicleInventory } from "@/components/VehicleInventory";

interface InventoryProps {
  onNavigate: (page: string) => void;
}

export function Inventory({ onNavigate }: InventoryProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Inventory</h1>
        <p className="text-muted-foreground">
          Manage your vehicle inventory and track sales
        </p>
      </div>

      <VehicleInventory onNavigate={onNavigate} />
    </div>
  );
}
