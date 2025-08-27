
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DocumentPageData {
  id: string;
  pageNumber: number;
  thumbnailUrl: string;
  fullPageUrl: string;
  filename: string;
  isAssigned?: boolean;
  assignedVehicleId?: string;
  assignedVehicleInfo?: string;
}

interface DocumentPageProps {
  page: DocumentPageData;
  isSelected: boolean;
  onSelect: (pageId: string) => void;
  onPreview: (page: DocumentPageData) => void;
}

export function DocumentPage({ page, isSelected, onSelect, onPreview }: DocumentPageProps) {
  const handleCheckboxChange = (checked: boolean) => {
    onSelect(page.id);
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(page);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md relative group border-2",
        isSelected && "border-primary bg-primary/5",
        page.isAssigned && "opacity-50"
      )}
      onClick={() => !page.isAssigned && onSelect(page.id)}
    >
      <CardContent className="p-3">
        {/* Selection checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            disabled={page.isAssigned}
            className="bg-white shadow-sm"
          />
        </div>

        {/* Preview button */}
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0"
            onClick={handlePreviewClick}
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>

        {/* Page thumbnail */}
        <div className="aspect-[3/4] bg-muted rounded flex items-center justify-center mb-2 relative overflow-hidden">
          {page.thumbnailUrl ? (
            <img
              src={page.thumbnailUrl}
              alt={`Page ${page.pageNumber}`}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <FileText className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        
        {/* Page info */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              Page {page.pageNumber}
            </Badge>
            {page.isAssigned && (
              <Badge variant="default" className="text-xs">
                Assigned
              </Badge>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground truncate">
            {page.filename}
          </p>
          
          {page.assignedVehicleInfo && (
            <p className="text-xs text-primary truncate">
              {page.assignedVehicleInfo}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
