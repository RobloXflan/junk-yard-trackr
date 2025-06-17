import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, User } from "lucide-react";
import { useBuyers, Buyer } from "@/hooks/useBuyers";
import { toast } from "sonner";

interface BuyerSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBuyer: (buyer: Buyer, salePrice: string, saleDate: string) => void;
}

export function BuyerSelector({ open, onOpenChange, onSelectBuyer }: BuyerSelectorProps) {
  const { buyers, isLoading, addBuyer } = useBuyers();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [newBuyerForm, setNewBuyerForm] = useState({
    first_name: "",
    last_name: "",
    address: "",
    city: "",
    state: "CA",
    zip_code: ""
  });

  const handleSelectBuyer = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setShowAddForm(false);
  };

  const handleAddNewBuyer = () => {
    setShowAddForm(true);
    setSelectedBuyer(null);
  };

  const handleSaveNewBuyer = async () => {
    if (!newBuyerForm.first_name || !newBuyerForm.last_name || !newBuyerForm.address) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const newBuyer = await addBuyer(newBuyerForm);
      setSelectedBuyer(newBuyer);
      setShowAddForm(false);
      setNewBuyerForm({
        first_name: "",
        last_name: "",
        address: "",
        city: "",
        state: "CA",
        zip_code: ""
      });
      toast.success("Buyer added successfully");
    } catch (error) {
      toast.error("Failed to add buyer");
    }
  };

  const handleConfirmSale = () => {
    if (!selectedBuyer || !salePrice) {
      toast.error("Please select a buyer and enter sale price");
      return;
    }

    // Pass the buyer with full address information
    onSelectBuyer(selectedBuyer, salePrice, saleDate);
    onOpenChange(false);
    setSelectedBuyer(null);
    setSalePrice("");
    setSaleDate(new Date().toISOString().split('T')[0]);
  };

  const handleCancel = () => {
    setSelectedBuyer(null);
    setShowAddForm(false);
    setSalePrice("");
    setSaleDate(new Date().toISOString().split('T')[0]);
    setNewBuyerForm({
      first_name: "",
      last_name: "",
      address: "",
      city: "",
      state: "CA",
      zip_code: ""
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Buyer</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!showAddForm && !selectedBuyer && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Saved Buyers</h4>
                <Button onClick={handleAddNewBuyer} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Buyer
                </Button>
              </div>
              
              {isLoading ? (
                <div className="text-center py-4">Loading buyers...</div>
              ) : buyers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No saved buyers yet</p>
                  <Button onClick={handleAddNewBuyer}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Buyer
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3">
                  {buyers.map((buyer) => (
                    <div
                      key={buyer.id}
                      onClick={() => handleSelectBuyer(buyer)}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    >
                      <div className="font-medium">
                        {buyer.first_name} {buyer.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {buyer.address}
                        {buyer.city && `, ${buyer.city}`}
                        {buyer.state && `, ${buyer.state}`}
                        {buyer.zip_code && ` ${buyer.zip_code}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showAddForm && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Add New Buyer</h4>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={newBuyerForm.first_name}
                    onChange={(e) => setNewBuyerForm(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={newBuyerForm.last_name}
                    onChange={(e) => setNewBuyerForm(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={newBuyerForm.address}
                  onChange={(e) => setNewBuyerForm(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newBuyerForm.city}
                    onChange={(e) => setNewBuyerForm(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newBuyerForm.state}
                    onChange={(e) => setNewBuyerForm(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code">Zip Code</Label>
                  <Input
                    id="zip_code"
                    value={newBuyerForm.zip_code}
                    onChange={(e) => setNewBuyerForm(prev => ({ ...prev, zip_code: e.target.value }))}
                  />
                </div>
              </div>
              
              <Button onClick={handleSaveNewBuyer} className="w-full">
                Save Buyer
              </Button>
            </div>
          )}

          {selectedBuyer && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Selected Buyer</h4>
                <Button variant="outline" onClick={() => setSelectedBuyer(null)} size="sm">
                  Change Buyer
                </Button>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="font-medium mb-2">
                  {selectedBuyer.first_name} {selectedBuyer.last_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedBuyer.address}
                  {selectedBuyer.city && `, ${selectedBuyer.city}`}
                  {selectedBuyer.state && `, ${selectedBuyer.state}`}
                  {selectedBuyer.zip_code && ` ${selectedBuyer.zip_code}`}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sale_price">Sale Price *</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">$</span>
                    <Input
                      id="sale_price"
                      type="number"
                      placeholder="1500"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="sale_date">Sale Date</Label>
                  <Input
                    id="sale_date"
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                </div>
              </div>
              
              <Button onClick={handleConfirmSale} className="w-full">
                Confirm Sale
              </Button>
            </div>
          )}
          
          {!showAddForm && !selectedBuyer && buyers.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
