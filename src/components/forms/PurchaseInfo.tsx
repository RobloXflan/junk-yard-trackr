
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PurchaseInfoProps {
  formData: {
    sellerName: string;
    purchaseDate: string;
    purchasePrice: string;
  };
  onInputChange: (field: string, value: any) => void;
}

export function PurchaseInfo({ formData, onInputChange }: PurchaseInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="sellerName" className="text-foreground font-medium">Seller Name</Label>
        <Input
          id="sellerName"
          placeholder="John Doe"
          value={formData.sellerName}
          onChange={(e) => onInputChange("sellerName", e.target.value)}
          className="border-border focus:border-primary text-foreground"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="purchaseDate" className="text-foreground font-medium">Purchase Date</Label>
        <Input
          id="purchaseDate"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => onInputChange("purchaseDate", e.target.value)}
          className="border-border focus:border-primary text-foreground"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="purchasePrice" className="text-foreground font-medium">Purchase Price</Label>
        <Input
          id="purchasePrice"
          type="number"
          placeholder="500"
          value={formData.purchasePrice}
          onChange={(e) => onInputChange("purchasePrice", e.target.value)}
          className="border-border focus:border-primary text-foreground"
        />
      </div>
    </div>
  );
}
