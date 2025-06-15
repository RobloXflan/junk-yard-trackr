
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BuyerSelector } from "./BuyerSelector";

interface SoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { 
    buyerFirstName: string; 
    buyerLastName: string; 
    buyerAddress: string;
    buyerCity?: string;
    buyerState?: string;
    buyerZipCode?: string;
    salePrice: string; 
    saleDate: string 
  }) => void;
  initialData?: {
    buyerFirstName: string;
    buyerLastName: string;
    buyerAddress?: string;
    buyerCity?: string;
    buyerState?: string;
    buyerZipCode?: string;
    salePrice: string;
    saleDate: string;
  };
}

export function SoldDialog({ open, onOpenChange, onConfirm, initialData }: SoldDialogProps) {
  const [formData, setFormData] = useState({
    buyerFirstName: initialData?.buyerFirstName || "",
    buyerLastName: initialData?.buyerLastName || "",
    buyerAddress: initialData?.buyerAddress || "",
    buyerCity: initialData?.buyerCity || "",
    buyerState: initialData?.buyerState || "",
    buyerZipCode: initialData?.buyerZipCode || "",
    salePrice: initialData?.salePrice || "",
    saleDate: initialData?.saleDate || new Date().toISOString().split('T')[0]
  });

  const [selectedBuyer, setSelectedBuyer] = useState<{
    first_name: string;
    last_name: string;
    address: string;
    city?: string;
    state?: string;
    zip_code?: string;
  } | null>(null);

  // Initialize selected buyer from initial data
  useEffect(() => {
    if (initialData?.buyerFirstName && initialData?.buyerLastName) {
      setSelectedBuyer({
        first_name: initialData.buyerFirstName,
        last_name: initialData.buyerLastName,
        address: initialData.buyerAddress || "",
        city: initialData.buyerCity,
        state: initialData.buyerState,
        zip_code: initialData.buyerZipCode
      });
    }
  }, [initialData]);

  // Update form data when buyer is selected
  useEffect(() => {
    if (selectedBuyer) {
      setFormData(prev => ({
        ...prev,
        buyerFirstName: selectedBuyer.first_name,
        buyerLastName: selectedBuyer.last_name,
        buyerAddress: selectedBuyer.address,
        buyerCity: selectedBuyer.city || "",
        buyerState: selectedBuyer.state || "",
        buyerZipCode: selectedBuyer.zip_code || ""
      }));
    }
  }, [selectedBuyer]);

  const handleBuyerSelect = (buyer: { 
    first_name: string; 
    last_name: string; 
    address: string;
    city?: string;
    state?: string;
    zip_code?: string;
  }) => {
    setSelectedBuyer(buyer);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.buyerFirstName && formData.buyerLastName && formData.salePrice) {
      onConfirm({
        buyerFirstName: formData.buyerFirstName,
        buyerLastName: formData.buyerLastName,
        buyerAddress: formData.buyerAddress,
        buyerCity: formData.buyerCity,
        buyerState: formData.buyerState,
        buyerZipCode: formData.buyerZipCode,
        salePrice: formData.salePrice,
        saleDate: formData.saleDate
      });
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      buyerFirstName: "",
      buyerLastName: "",
      buyerAddress: "",
      buyerCity: "",
      buyerState: "",
      buyerZipCode: "",
      salePrice: "",
      saleDate: new Date().toISOString().split('T')[0]
    });
    setSelectedBuyer(null);
    onOpenChange(false);
  };

  const formatFullAddress = () => {
    if (!selectedBuyer) return "";
    const parts = [selectedBuyer.address];
    if (selectedBuyer.city) parts.push(selectedBuyer.city);
    if (selectedBuyer.state) parts.push(selectedBuyer.state);
    if (selectedBuyer.zip_code) parts.push(selectedBuyer.zip_code);
    return parts.join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <BuyerSelector
            onBuyerSelect={handleBuyerSelect}
            selectedBuyer={selectedBuyer}
          />
          
          {selectedBuyer && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Selected Buyer:</h4>
              <p className="text-sm">{selectedBuyer.first_name} {selectedBuyer.last_name}</p>
              {formatFullAddress() && (
                <p className="text-xs text-muted-foreground mt-1">{formatFullAddress()}</p>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!formData.buyerFirstName || !formData.buyerLastName || !formData.salePrice}
            >
              Confirm Sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
