
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { useBuyers, Buyer } from "@/hooks/useBuyers";
import { BuyerCard } from "./BuyerCard";
import { BuyerForm } from "./BuyerForm";
import { BuyerEditForm } from "./BuyerEditForm";

interface BuyerSelectorProps {
  onBuyerSelect: (buyer: { first_name: string; last_name: string; address: string; city?: string | null; state?: string | null; zip_code?: string | null; }) => void;
  selectedBuyer?: { first_name: string; last_name: string; address: string; city?: string | null; state?: string | null; zip_code?: string | null; } | null;
}

export function BuyerSelector({ onBuyerSelect, selectedBuyer }: BuyerSelectorProps) {
  const { buyers, isLoading, addBuyer, updateBuyer } = useBuyers();
  const [showNewBuyerForm, setShowNewBuyerForm] = useState(false);
  const [editingBuyerId, setEditingBuyerId] = useState<string | null>(null);

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

  const handleAddNewBuyer = async (buyerData: {
    first_name: string;
    last_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
  }) => {
    const newBuyer = await addBuyer(buyerData);
    onBuyerSelect({
      first_name: newBuyer.first_name,
      last_name: newBuyer.last_name,
      address: newBuyer.address,
      city: newBuyer.city,
      state: newBuyer.state,
      zip_code: newBuyer.zip_code
    });
    setShowNewBuyerForm(false);
  };

  const handleEditBuyer = (buyer: Buyer) => {
    setEditingBuyerId(buyer.id);
  };

  const handleSaveEdit = async (buyerId: string, buyerData: {
    first_name: string;
    last_name: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
  }) => {
    await updateBuyer(buyerId, buyerData);
    setEditingBuyerId(null);
  };

  const handleCancelEdit = () => {
    setEditingBuyerId(null);
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
        <BuyerForm
          onSubmit={handleAddNewBuyer}
          onCancel={() => setShowNewBuyerForm(false)}
        />
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
                    <BuyerEditForm
                      buyer={buyer}
                      onSave={handleSaveEdit}
                      onCancel={handleCancelEdit}
                    />
                  ) : (
                    <BuyerCard
                      buyer={buyer}
                      isSelected={isSelected(buyer)}
                      isEditing={editingBuyerId === buyer.id}
                      onClick={() => handleBuyerClick(buyer)}
                      onEdit={() => handleEditBuyer(buyer)}
                    />
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
