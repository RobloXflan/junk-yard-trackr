
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PdfPage {
  id: string;
  page_number: number;
  thumbnail_url: string | null;
  status: string;
  assigned_vehicle_id: string | null;
}

interface PageThumbnailProps {
  page: PdfPage;
  isSelected: boolean;
  onClick: (isShiftClick: boolean) => void;
}

export function PageThumbnail({ page, isSelected, onClick }: PageThumbnailProps) {
  const handleClick = (e: React.MouseEvent) => {
    onClick(e.shiftKey);
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className="p-2">
        <div className="aspect-[3/4] bg-muted rounded mb-2 overflow-hidden">
          {page.thumbnail_url ? (
            <img 
              src={page.thumbnail_url}
              alt={`Page ${page.page_number}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Page {page.page_number}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Page {page.page_number}
          </Badge>
          {isSelected && (
            <Badge className="text-xs">
              Selected
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
