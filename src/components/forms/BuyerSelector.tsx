
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, User, MapPin } from "lucide-react";
import { useBuyers, Buyer } from "@/hooks/useBuyers";

interface BuyerSelectorProps {
  onBuyerSelect: (buyer: { first_name: string; last_name: string; address: string }) => void;
  selectedBuyer?: { first_name: string; last_name: string; address: string } | null;
}

export function BuyerSelector({ onBuyerSelect, selectedBuyer }: BuyerSelectorProps) {
  const { buyers, isLoading, addBuyer } = useBuyers();
  const [showNewBuyerForm, setShowNewBuyerForm] = useState(false);
  const [newBuyerData, setNewBuyerData] = useState({
    first_name: '',
    last_name: '',
    address: ''
  });

  const handleBuyerClick = (buyer: Buyer) => {
    onBuyerSelect({
      first_name: buyer.first_name,
      last_name: buyer.last_name,
      address: buyer.address
    });
  };

  const handleAddNewBuyer = async () => {
    if (!newBuyerData.first_name || !newBuyerData.last_name || !newBuyerData.address) {
      return;
    }

    try {
      const newBuyer = await addBuyer(newBuyerData);
      onBuyerSelect({
        first_name: newBuyer.first_name,
        last_name: newBuyer.last_name,
        address: newBuyer.address
      });
      setNewBuyerData({ first_name: '', last_name: '', address: '' });
      setShowNewBuyerForm(false);
    } catch (error) {
      console.error('Error adding buyer:', error);
    }
  };

  const isSelected = (buyer: Buyer) => {
    return selectedBuyer && 
           selectedBuyer.first_name === buyer.first_name &&
           selectedBuyer.last_name === buyer.last_name &&
           selectedBuyer.address === buyer.address;
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
              <Label htmlFor="new-address" className="text-xs">Address</Label>
              <Input
                id="new-address"
                placeholder="123 Main St, City, State, ZIP"
                value={newBuyerData.address}
                onChange={(e) => setNewBuyerData(prev => ({ ...prev, address: e.target.value }))}
                className="h-8"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                onClick={handleAddNewBuyer}
                disabled={!newBuyerData.first_name || !newBuyerData.last_name || !newBuyerData.address}
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
                  isSelected(buyer) ? 'ring-2 ring-primary bg-accent' : ''
                }`}
                onClick={() => handleBuyerClick(buyer)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {buyer.first_name} {buyer.last_name}
                      </div>
                      <div className="flex items-start gap-1 mt-1">
                        <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="text-xs text-muted-foreground break-words">
                          {buyer.address}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
