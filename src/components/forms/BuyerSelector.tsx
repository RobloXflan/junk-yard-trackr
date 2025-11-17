import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, User, Pencil, Trash2 } from "lucide-react";
import { useBuyers, Buyer } from "@/hooks/useBuyers";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface BuyerSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBuyer: (buyer: Buyer, salePrice: string, saleDate: string) => void;
}

export function BuyerSelector({ open, onOpenChange, onSelectBuyer }: BuyerSelectorProps) {
  const { buyers, isLoading, addBuyer, updateBuyer, deleteBuyer } = useBuyers();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState<Buyer | null>(null);
  
  const [newBuyerForm, setNewBuyerForm] = useState({
    first_name: "",
    last_name: "",
    address: "",
    city: "",
    state: "CA",
    zip_code: ""
  });

  const [editBuyerForm, setEditBuyerForm] = useState({
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
    setEditingBuyer(null);
    setSelectedBuyer(null);
  };

  const handleEditBuyer = (buyer: Buyer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBuyer(buyer);
    setEditBuyerForm({
      first_name: buyer.first_name,
      last_name: buyer.last_name,
      address: buyer.address,
      city: buyer.city || "",
      state: buyer.state || "CA",
      zip_code: buyer.zip_code || ""
    });
    setShowAddForm(false);
    setSelectedBuyer(null);
  };

  const handleDeleteBuyer = (buyer: Buyer, e: React.MouseEvent) => {
    e.stopPropagation();
    setBuyerToDelete(buyer);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBuyer = async () => {
    if (!buyerToDelete) return;

    try {
      await deleteBuyer(buyerToDelete.id);
      toast.success("Buyer deleted successfully");
      setDeleteDialogOpen(false);
      setBuyerToDelete(null);
    } catch (error) {
      toast.error("Failed to delete buyer");
    }
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

  const handleSaveEditBuyer = async () => {
    if (!editingBuyer || !editBuyerForm.first_name || !editBuyerForm.last_name || !editBuyerForm.address) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await updateBuyer(editingBuyer.id, editBuyerForm);
      setEditingBuyer(null);
      setEditBuyerForm({
        first_name: "",
        last_name: "",
        address: "",
        city: "",
        state: "CA",
        zip_code: ""
      });
      toast.success("Buyer updated successfully");
    } catch (error) {
      toast.error("Failed to update buyer");
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
    setEditingBuyer(null);
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
    setEditBuyerForm({
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
          {!showAddForm && !editingBuyer && !selectedBuyer && (
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
                      className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
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
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => handleEditBuyer(buyer, e)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => handleDeleteBuyer(buyer, e)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

          {editingBuyer && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Edit Buyer</h4>
                <Button variant="outline" onClick={() => setEditingBuyer(null)}>
                  Cancel
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    value={editBuyerForm.first_name}
                    onChange={(e) => setEditBuyerForm(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    value={editBuyerForm.last_name}
                    onChange={(e) => setEditBuyerForm(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit_address">Address *</Label>
                <Input
                  id="edit_address"
                  value={editBuyerForm.address}
                  onChange={(e) => setEditBuyerForm(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_city">City</Label>
                  <Input
                    id="edit_city"
                    value={editBuyerForm.city}
                    onChange={(e) => setEditBuyerForm(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_state">State</Label>
                  <Input
                    id="edit_state"
                    value={editBuyerForm.state}
                    onChange={(e) => setEditBuyerForm(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_zip_code">Zip Code</Label>
                  <Input
                    id="edit_zip_code"
                    value={editBuyerForm.zip_code}
                    onChange={(e) => setEditBuyerForm(prev => ({ ...prev, zip_code: e.target.value }))}
                  />
                </div>
              </div>
              
              <Button onClick={handleSaveEditBuyer} className="w-full">
                Save Changes
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
          
          {!showAddForm && !editingBuyer && !selectedBuyer && buyers.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Buyer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {buyerToDelete?.first_name} {buyerToDelete?.last_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBuyer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
