
import { VehicleInventory } from "@/components/VehicleInventory";
import { DataImporter } from "@/components/DataImporter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, List } from "lucide-react";

interface InventoryProps {
  onNavigate: (page: string) => void;
}

export function Inventory({ onNavigate }: InventoryProps) {
  const [showImporter, setShowImporter] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Inventory</h1>
          <p className="text-muted-foreground">
            Manage your vehicle inventory and track sales
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => setShowImporter(!showImporter)}
        >
          {showImporter ? (
            <>
              <List className="w-4 h-4 mr-2" />
              Show Inventory
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </>
          )}
        </Button>
      </div>

      {showImporter ? (
        <DataImporter />
      ) : (
        <VehicleInventory onNavigate={onNavigate} />
      )}
    </div>
  );
}
