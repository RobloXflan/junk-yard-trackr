
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Vehicle } from "@/stores/vehicleStore";

interface SoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  onConfirm: (data: { 
    buyerFirstName: string; 
    buyerLastName: string; 
    salePrice: string; 
    saleDate: string;
    buyerAddress?: string;
    buyerCity?: string;
    buyerState?: string;
    buyerZip?: string;
  }) => void;
  initialData?: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  };
}

export function SoldDialog({ open, onOpenChange, vehicle, onConfirm, initialData }: SoldDialogProps) {
  const [formData, setFormData] = useState({
    buyerFirstName: initialData?.buyerFirstName || "",
    buyerLastName: initialData?.buyerLastName || "",
    salePrice: initialData?.salePrice || "",
    saleDate: initialData?.saleDate || new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.buyerFirstName && formData.buyerLastName && formData.salePrice) {
      onConfirm(formData);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      buyerFirstName: "",
      buyerLastName: "",
      salePrice: "",
      saleDate: new Date().toISOString().split('T')[0]
    });
    onOpenChange(false);
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sale Information</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Vehicle Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </div>
            <div className="text-sm text-muted-foreground">
              VIN: {vehicle.vehicleId}
            </div>
          </div>

          {/* Buyer Information List */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Buyer Information</h4>
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">First Name:</span>
                <Input
                  placeholder="John"
                  value={formData.buyerFirstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyerFirstName: e.target.value }))}
                  className="w-32 h-8 text-sm"
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Name:</span>
                <Input
                  placeholder="Smith"
                  value={formData.buyerLastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, buyerLastName: e.target.value }))}
                  className="w-32 h-8 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sale Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Sale Details</h4>
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sale Date:</span>
                <Input
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                  className="w-36 h-8 text-sm"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sale Price:</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm">$</span>
                  <Input
                    type="number"
                    placeholder="1500"
                    value={formData.salePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
                    className="w-24 h-8 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Save Sale Info
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
