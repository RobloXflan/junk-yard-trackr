
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BuyerFormData {
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface BuyerFormProps {
  onSubmit: (data: BuyerFormData) => Promise<void>;
  onCancel: () => void;
}

export function BuyerForm({ onSubmit, onCancel }: BuyerFormProps) {
  const [formData, setFormData] = useState<BuyerFormData>({
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });

  const handleSubmit = async () => {
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
      await onSubmit(formData);
      setFormData({ first_name: '', last_name: '', address: '', city: '', state: '', zip_code: '' });
    } catch (error) {
      console.error('Error adding buyer:', error);
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
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Add New Buyer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="new-first-name" className="text-xs">First Name</Label>
            <Input
              id="new-first-name"
              placeholder="John"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="new-last-name" className="text-xs">Last Name</Label>
            <Input
              id="new-last-name"
              placeholder="Smith"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              className="h-8"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="new-address" className="text-xs">Street Address</Label>
          <Input
            id="new-address"
            placeholder="123 Main St"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="h-8"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="new-city" className="text-xs">City</Label>
            <Input
              id="new-city"
              placeholder="Los Angeles"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="new-state" className="text-xs">State</Label>
            <Input
              id="new-state"
              placeholder="CA"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              maxLength={2}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="new-zip" className="text-xs">ZIP Code</Label>
            <Input
              id="new-zip"
              placeholder="90001"
              value={formData.zip_code}
              onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
              className="h-8"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!isFormValid}
          >
            Add Buyer
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
