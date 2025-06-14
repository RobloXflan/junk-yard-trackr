
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SoldDialog } from "./SoldDialog";

interface DestinationSelectorProps {
  formData: {
    destination: string;
    buyerName: string;
    buyerFirstName: string;
    buyerLastName: string;
    saleDate: string;
    salePrice: string;
  };
  onInputChange: (field: string, value: any) => void;
}

export function DestinationSelector({ formData, onInputChange }: DestinationSelectorProps) {
  const [soldDialogOpen, setSoldDialogOpen] = useState(false);

  const handleDestinationChange = (value: string) => {
    onInputChange("destination", value);
    
    if (value === "sold") {
      setSoldDialogOpen(true);
    } else {
      // Clear sale data if not sold
      onInputChange("buyerFirstName", "");
      onInputChange("buyerLastName", "");
      onInputChange("salePrice", "");
      onInputChange("saleDate", "");
    }
  };

  const handleSoldConfirm = (data: { buyerFirstName: string; buyerLastName: string; salePrice: string; saleDate: string }) => {
    onInputChange("buyerFirstName", data.buyerFirstName);
    onInputChange("buyerLastName", data.buyerLastName);
    onInputChange("salePrice", data.salePrice);
    onInputChange("saleDate", data.saleDate);
  };

  const handleSoldDialogClose = (open: boolean) => {
    if (!open && formData.destination === "sold" && (!formData.buyerFirstName || !formData.buyerLastName || !formData.salePrice)) {
      // If dialog is closed without completing the form, reset destination
      onInputChange("destination", "");
    }
    setSoldDialogOpen(open);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="destination" className="text-foreground font-medium">Vehicle Destination</Label>
        <Select value={formData.destination} onValueChange={handleDestinationChange}>
          <SelectTrigger className="border-border focus:border-primary text-foreground">
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yard">Still in Yard</SelectItem>
            <SelectItem value="sold">Sold to Buyer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.destination === "sold" && formData.buyerFirstName && formData.buyerLastName && formData.salePrice && (
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Sale Details:</p>
            <p className="text-sm text-foreground">Buyer: {formData.buyerFirstName} {formData.buyerLastName}</p>
            <p className="text-sm text-foreground">Sale Price: ${formData.salePrice}</p>
            {formData.saleDate && <p className="text-sm text-foreground">Date: {formData.saleDate}</p>}
          </div>
        </div>
      )}

      <SoldDialog
        open={soldDialogOpen}
        onOpenChange={handleSoldDialogClose}
        onConfirm={handleSoldConfirm}
        initialData={{
          buyerFirstName: formData.buyerFirstName,
          buyerLastName: formData.buyerLastName,
          salePrice: formData.salePrice,
          saleDate: formData.saleDate
        }}
      />
    </div>
  );
}
