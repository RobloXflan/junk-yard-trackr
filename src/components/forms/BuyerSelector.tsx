
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, User, MapPin, Edit2, Check, X } from "lucide-react";
import { useBuyers, Buyer } from "@/hooks/useBuyers";

interface BuyerSelectorProps {
  onBuyerSelect: (buyer: { first_name: string; last_name: string; address: string; city?: string | null; state?: string | null; zip_code?: string | null; }) => void;
  selectedBuyer?: { first_name: string; last_name: string; address: string; city?: string | null; state?: string | null; zip_code?: string | null; } | null;
}

export function BuyerSelector({ onBuyerSelect, selectedBuyer }: BuyerSelectorProps) {
  const { buyers, isLoading, addBuyer, updateBuyer } = useBuyers();
  const [showNewBuyerForm, setShowNewBuyerForm] = useState(false);
  const [editingBuyerId, setEditingBuyerId] = useState<string | null>(null);
  const [newBuyerData, setNewBuyerData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });
  const [editBuyerData, setEditBuyerData] = useState({
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: ''
  });

  const handleBuyerClick = (buyer: Buyer) => {
    if (editingBuyerId === buyer.id) return; // Don't select if editing

    onBuyerSelect({
      first_name: buyer.first_name,
      last_name: buyer.last_name,
      address: buyer.address,
      city: buyer.city,
      state: buyer.state,
      zip_code: buyer.zip_code
    });
  };

  const handleAddNewBuyer = async () => {
    if (
      !newBuyerData.first_name ||
      !newBuyerData.last_name ||
      !newBuyerData.address ||
      !newBuyerData.city ||
      !newBuyerData.state ||
      !newBuyerData.zip_code
    ) {
      return;
    }

    try {
      const newBuyer = await addBuyer(newBuyerData);
      onBuyerSelect({
        first_name: newBuyer.first_name,
        last_name: newBuyer.last_name,
        address: newBuyer.address,
        city: newBuyer.city,
        state: newBuyer.state,
        zip_code: newBuyer.zip_code
      });
      setNewBuyerData({ first_name: '', last_name: '', address: '', city: '', state: '', zip_code: '' });
      setShowNewBuyerForm(false);
    } catch (error) {
      console.error('Error adding buyer:', error);
    }
  };

  const handleEditBuyer = (buyer: Buyer) => {
    setEditingBuyerId(buyer.id);
    setEditBuyerData({
      first_name: buyer.first_name,
      last_name: buyer.last_name,
      address: buyer.address,
      city: buyer.city || "",
      state: buyer.state || "",
      zip_code: buyer.zip_code || ""
    });
  };

  const handleSaveEdit = async (buyerId: string) => {
    if (
      !editBuyerData.first_name ||
      !editBuyerData.last_name ||
      !editBuyerData.address ||
      !editBuyerData.city ||
      !editBuyerData.state ||
      !editBuyerData.zip_code
    ) {
      return;
    }

    try {
      await updateBuyer(buyerId, editBuyerData);
      setEditingBuyerId(null);
    } catch (error) {
      console.error('Error updating buyer:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingBuyerId(null);
    setEditBuyerData({ first_name: '', last_name: '', address: '', city: '', state: '', zip_code: '' });
  };

  const isSelected = (buyer: Buyer) => {
    return selectedBuyer && 
           selectedBuyer.first_name === buyer.first_name &&
           selectedBuyer.last_name === buyer.last_name &&
           selectedBuyer.address === buyer.address &&
           (selectedBuyer.city ?? "") === (buyer.city ?? "") &&
           (selectedBuyer.state ?? "") === (buyer.state ?? "") &&
           (selectedBuyer.zip_code ?? "") === (buyer.zip_code ?? "");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">Select Buyer</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowNewBuyerForm(!showNewBuyerForm)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add New Buyer
        </Button>
      </div>

      {showNewBuyerForm && (
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
                  value={newBuyerData.first_name}
                  onChange={(e) => setNewBuyerData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="new-last-name" className="text-xs">Last Name</Label>
                <Input
                  id="new-last-name"
                  placeholder="Smith"
                  value={newBuyerData.last_name}
                  onChange={(e) => setNewBuyerData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="new-address" className="text-xs">Street Address</Label>
              <Input
                id="new-address"
                placeholder="123 Main St"
                value={newBuyerData.address}
                onChange={(e) => setNewBuyerData(prev => ({ ...prev, address: e.target.value }))}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="new-city" className="text-xs">City</Label>
                <Input
                  id="new-city"
                  placeholder="Los Angeles"
                  value={newBuyerData.city}
                  onChange={(e) => setNewBuyerData(prev => ({ ...prev, city: e.target.value }))}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="new-state" className="text-xs">State</Label>
                <Input
                  id="new-state"
                  placeholder="CA"
                  value={newBuyerData.state}
                  onChange={(e) => setNewBuyerData(prev => ({ ...prev, state: e.target.value }))}
                  maxLength={2}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor="new-zip" className="text-xs">ZIP Code</Label>
                <Input
                  id="new-zip"
                  placeholder="90001"
                  value={newBuyerData.zip_code}
                  onChange={(e) => setNewBuyerData(prev => ({ ...prev, zip_code: e.target.value }))}
                  className="h-8"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAddNewBuyer}
                disabled={
                  !newBuyerData.first_name ||
                  !newBuyerData.last_name ||
                  !newBuyerData.address ||
                  !newBuyerData.city ||
                  !newBuyerData.state ||
                  !newBuyerData.zip_code
                }
              >
                Add Buyer
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewBuyerForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-48 border rounded-md">
        <div className="p-2 space-y-2">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              Loading buyers...
            </div>
          ) : buyers.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              No saved buyers yet. Add one above to get started.
            </div>
          ) : (
            buyers.map((buyer) => (
              <Card 
                key={buyer.id} 
                className={`cursor-pointer transition-colors hover:bg-accent ${
                  isSelected(buyer) && editingBuyerId !== buyer.id ? 'ring-2 ring-primary bg-accent' : ''
                } ${editingBuyerId === buyer.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleBuyerClick(buyer)}
              >
                <CardContent className="p-3">
                  {editingBuyerId === buyer.id ? (
                    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">First Name</Label>
                          <Input
                            value={editBuyerData.first_name}
                            onChange={(e) => setEditBuyerData(prev => ({ ...prev, first_name: e.target.value }))}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Last Name</Label>
                          <Input
                            value={editBuyerData.last_name}
                            onChange={(e) => setEditBuyerData(prev => ({ ...prev, last_name: e.target.value }))}
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Street Address</Label>
                        <Input
                          value={editBuyerData.address}
                          onChange={(e) => setEditBuyerData(prev => ({ ...prev, address: e.target.value }))}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">City</Label>
                          <Input
                            value={editBuyerData.city}
                            onChange={(e) => setEditBuyerData(prev => ({ ...prev, city: e.target.value }))}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">State</Label>
                          <Input
                            value={editBuyerData.state}
                            maxLength={2}
                            onChange={(e) => setEditBuyerData(prev => ({ ...prev, state: e.target.value }))}
                            className="h-7 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">ZIP Code</Label>
                          <Input
                            value={editBuyerData.zip_code}
                            onChange={(e) => setEditBuyerData(prev => ({ ...prev, zip_code: e.target.value }))}
                            className="h-7 text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(buyer.id)}
                          disabled={
                            !editBuyerData.first_name ||
                            !editBuyerData.last_name ||
                            !editBuyerData.address ||
                            !editBuyerData.city ||
                            !editBuyerData.state ||
                            !editBuyerData.zip_code
                          }
                          className="h-6 px-2 text-xs"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="h-6 px-2 text-xs"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {buyer.first_name} {buyer.last_name}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-muted-foreground break-words">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span>
                              {buyer.address}
                              {buyer.city ? `, ${buyer.city}` : ""}
                              {buyer.state ? `, ${buyer.state}` : ""}
                              {buyer.zip_code ? ` ${buyer.zip_code}` : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditBuyer(buyer);
                        }}
                        className="h-6 w-6 p-0 hover:bg-muted"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
