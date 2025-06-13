
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface DocumentStatusProps {
  formData: {
    titlePresent: boolean;
    billOfSale: boolean;
  };
  onInputChange: (field: string, value: any) => void;
}

export function DocumentStatus({ formData, onInputChange }: DocumentStatusProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border">
        <Switch
          id="titlePresent"
          checked={formData.titlePresent}
          onCheckedChange={(checked) => onInputChange("titlePresent", checked)}
        />
        <Label htmlFor="titlePresent" className="text-foreground font-medium">Title Present</Label>
      </div>
      <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border">
        <Switch
          id="billOfSale"
          checked={formData.billOfSale}
          onCheckedChange={(checked) => onInputChange("billOfSale", checked)}
        />
        <Label htmlFor="billOfSale" className="text-foreground font-medium">Handwritten Bill of Sale</Label>
      </div>
    </div>
  );
}
