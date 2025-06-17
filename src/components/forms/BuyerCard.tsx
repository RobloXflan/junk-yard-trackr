
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, Edit2 } from "lucide-react";
import { Buyer } from "@/hooks/useBuyers";

interface BuyerCardProps {
  buyer: Buyer;
  isSelected: boolean;
  isEditing: boolean;
  onClick: () => void;
  onEdit: () => void;
}

export function BuyerCard({ buyer, isSelected, isEditing, onClick, onEdit }: BuyerCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-accent ${
        isSelected && !isEditing ? 'ring-2 ring-primary bg-accent' : ''
      } ${isEditing ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
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
              onEdit();
            }}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
