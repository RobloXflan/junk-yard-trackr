
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { buyerFirstName: string; buyerLastName: string; salePrice: string; saleDate: string }) => void;
  initialData?: {
    buyerFirstName: string;
    buyerLastName: string;
    salePrice: string;
    saleDate: string;
  };
}

export function SoldDialog({ open, onOpenChange, onConfirm, initialData }: SoldDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sale Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyerFirstName">First Name *</Label>
              <Input
                id="buyerFirstName"
                placeholder="John"
                value={formData.buyerFirstName}
                onChange={(e) => setFormData(prev => ({ ...prev, buyerFirstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerLastName">Last Name *</Label>
              <Input
                id="buyerLastName"
                placeholder="Smith"
                value={formData.buyerLastName}
                onChange={(e) => setFormData(prev => ({ ...prev, buyerLastName: e.target.value }))}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="saleDate">Date of Sale</Label>
            <Input
              id="saleDate"
              type="date"
              value={formData.saleDate}
              onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="salePrice">Sale Price *</Label>
            <Input
              id="salePrice"
              type="number"
              placeholder="1500"
              value={formData.salePrice}
              onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
              required
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Confirm Sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
