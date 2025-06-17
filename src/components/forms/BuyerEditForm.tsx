
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import { Buyer } from "@/hooks/useBuyers";

interface BuyerEditFormData {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface BuyerEditFormProps {
  buyer: Buyer;
  onSave: (buyerId: string, data: BuyerEditFormData) => Promise<void>;
  onCancel: () => void;
}

export function BuyerEditForm({ buyer, onSave, onCancel }: BuyerEditFormProps) {
  const [formData, setFormData] = useState<BuyerEditFormData>({
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });

  useEffect(() => {
    setFormData({
      first_name: buyer.first_name,
      last_name: buyer.last_name,
      address: buyer.address,
      city: buyer.city || "",
      state: buyer.state || "",
      zip_code: buyer.zip_code || ""
    });
  }, [buyer]);

  const handleSave = async () => {
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.zip_code
    ) {
      return;
    }

    try {
      await onSave(buyer.id, formData);
    } catch (error) {
      console.error('Error updating buyer:', error);
    }
  };

  const isFormValid = 
    formData.first_name &&
    formData.last_name &&
    formData.address &&
    formData.city &&
    formData.state &&
    formData.zip_code;

  return (
    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">First Name</Label>
          <Input
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Last Name</Label>
          <Input
            value={formData.last_name}
            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            className="h-7 text-xs"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Street Address</Label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="h-7 text-xs"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">City</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">State</Label>
          <Input
            value={formData.state}
            maxLength={2}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">ZIP Code</Label>
          <Input
            value={formData.zip_code}
            onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
            className="h-7 text-xs"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isFormValid}
          className="h-6 px-2 text-xs"
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="h-6 px-2 text-xs"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
