
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="destination" className="text-foreground font-medium">Vehicle Destination</Label>
        <Select value={formData.destination} onValueChange={(value) => onInputChange("destination", value)}>
          <SelectTrigger className="border-border focus:border-primary text-foreground">
            <SelectValue placeholder="Select destination" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yard">Still in Yard</SelectItem>
            <SelectItem value="sold">Sold to Buyer</SelectItem>
            <SelectItem value="pick-your-part">Send to Pick Your Part</SelectItem>
            <SelectItem value="sa-recycling">SA Recycling</SelectItem>
            <SelectItem value="blank-bill-sale">Blank Bill of Sale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(formData.destination === "buyer" || formData.destination === "sold") && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-card border border-border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="buyerFirstName" className="text-foreground font-medium">First Name</Label>
            <Input
              id="buyerFirstName"
              placeholder="John"
              value={formData.buyerFirstName}
              onChange={(e) => onInputChange("buyerFirstName", e.target.value)}
              className="border-border focus:border-primary text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyerLastName" className="text-foreground font-medium">Last Name</Label>
            <Input
              id="buyerLastName"
              placeholder="Smith"
              value={formData.buyerLastName}
              onChange={(e) => onInputChange("buyerLastName", e.target.value)}
              className="border-border focus:border-primary text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="saleDate" className="text-foreground font-medium">Date of Sale</Label>
            <Input
              id="saleDate"
              type="date"
              value={formData.saleDate}
              onChange={(e) => onInputChange("saleDate", e.target.value)}
              className="border-border focus:border-primary text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salePrice" className="text-foreground font-medium">Sale Price</Label>
            <Input
              id="salePrice"
              type="number"
              placeholder="1500"
              value={formData.salePrice}
              onChange={(e) => onInputChange("salePrice", e.target.value)}
              className="border-border focus:border-primary text-foreground"
            />
          </div>
        </div>
      )}

      {formData.destination === "pick-your-part" && (
        <div className="p-4 bg-card border border-border rounded-lg">
          <p className="text-sm text-foreground font-medium">
            📋 Pick Your Part bill of sale will be auto-generated with vehicle details
          </p>
        </div>
      )}

      {formData.destination === "sa-recycling" && (
        <div className="p-4 bg-card border border-border rounded-lg">
          <p className="text-sm text-foreground font-medium">
            ♻️ SA Recycling paperwork will be prepared with vehicle information
          </p>
        </div>
      )}

      {formData.destination === "blank-bill-sale" && (
        <div className="p-4 bg-card border border-border rounded-lg">
          <p className="text-sm text-foreground font-medium">
            📝 Blank bill of sale will be generated for manual completion and handwriting
          </p>
        </div>
      )}
    </div>
  );
}
