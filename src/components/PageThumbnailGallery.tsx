
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, FileText, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageThumbnailData {
  id: string;
  pageNumber: number;
  thumbnailUrl: string;
  fullPageUrl: string;
  filename: string;
  status: 'unassigned' | 'assigned';
  assignedVehicleId?: string;
  assignedVehicleInfo?: string;
}

interface PageThumbnailGalleryProps {
  pages: PageThumbnailData[];
  selectedPages: string[];
  onPageSelect: (pageId: string) => void;
  onPreview: (page: PageThumbnailData) => void;
  showOnlyUnassigned?: boolean;
}

export function PageThumbnailGallery({ 
  pages, 
  selectedPages, 
  onPageSelect, 
  onPreview,
  showOnlyUnassigned = false 
}: PageThumbnailGalleryProps) {
  
  const filteredPages = showOnlyUnassigned 
    ? pages.filter(page => page.status === 'unassigned')
    : pages;

  const handlePageClick = (pageId: string, event: React.MouseEvent) => {
    // Only allow selection of unassigned pages
    const page = pages.find(p => p.id === pageId);
    if (page?.status === 'unassigned') {
      onPageSelect(pageId);
    }
  };

  const handlePreviewClick = (page: PageThumbnailData, event: React.MouseEvent) => {
    event.stopPropagation();
    onPreview(page);
  };

  if (filteredPages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">
          {pages.length === 0 ? 'No pages available' : 'No unassigned pages'}
        </p>
        <p className="text-sm">
          {pages.length === 0 
            ? 'Upload a PDF to see page thumbnails here' 
            : 'All pages have been assigned to vehicles'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {filteredPages.map((page) => {
        const isSelected = selectedPages.includes(page.id);
        const isAssigned = page.status === 'assigned';
        
        return (
          <Card
            key={page.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md relative group border-2",
              isSelected && "border-primary bg-primary/5",
              isAssigned && "opacity-60 cursor-not-allowed"
            )}
            onClick={(e) => handlePageClick(page.id, e)}
          >
            <CardContent className="p-3">
              {/* Selection checkbox - only for unassigned pages */}
              {!isAssigned && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onPageSelect(page.id)}
                    className="bg-white shadow-sm"
                  />
                </div>
              )}

              {/* Preview button */}
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-6 w-6 p-0"
                  onClick={(e) => handlePreviewClick(page, e)}
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
                  {isAssigned ? (
                    <Badge variant="default" className="text-xs flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      Assigned
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Available
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground truncate">
                  {page.filename}
                </p>
                
                {page.assignedVehicleInfo && (
                  <p className="text-xs text-blue-600 truncate">
                    Vehicle: {page.assignedVehicleInfo}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
