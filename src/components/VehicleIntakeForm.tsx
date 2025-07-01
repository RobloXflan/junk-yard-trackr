
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VehicleIntakeFormProps {
  onSuccess: () => void;
}

export function VehicleIntakeForm({ onSuccess }: VehicleIntakeFormProps) {
  const [formData, setFormData] = useState({
    year: "",
    make: "",
    model: "",
    vehicleId: "",
    licensePlate: "",
    sellerName: "",
    purchaseDate: "",
    purchasePrice: "",
    titlePresent: false,
    billOfSale: false,
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('vehicles')
        .insert([
          {
            year: formData.year,
            make: formData.make,
            model: formData.model,
            vehicle_id: formData.vehicleId,
            license_plate: formData.licensePlate || null,
            seller_name: formData.sellerName || null,
            purchase_date: formData.purchaseDate || null,
            purchase_price: formData.purchasePrice || null,
            title_present: formData.titlePresent,
            bill_of_sale: formData.billOfSale,
            notes: formData.notes || null,
            status: 'yard'
          }
        ]);

      if (error) throw error;

      toast.success("Vehicle added successfully!");
      onSuccess();
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error("Failed to add vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            value={formData.year}
            onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="make">Make *</Label>
          <Input
            id="make"
            value={formData.make}
            onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="vehicleId">Vehicle ID *</Label>
          <Input
            id="vehicleId"
            value={formData.vehicleId}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicleId: e.target.value }))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="licensePlate">License Plate</Label>
          <Input
            id="licensePlate"
            value={formData.licensePlate}
            onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="sellerName">Seller Name</Label>
          <Input
            id="sellerName"
            value={formData.sellerName}
            onChange={(e) => setFormData(prev => ({ ...prev, sellerName: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="purchasePrice">Purchase Price</Label>
          <Input
            id="purchasePrice"
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="titlePresent"
            checked={formData.titlePresent}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, titlePresent: checked as boolean }))}
          />
          <Label htmlFor="titlePresent">Title Present</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="billOfSale"
            checked={formData.billOfSale}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, billOfSale: checked as boolean }))}
          />
          <Label htmlFor="billOfSale">Bill of Sale</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adding..." : "Add Vehicle"}
      </Button>
    </form>
  );
}
