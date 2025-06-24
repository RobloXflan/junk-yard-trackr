
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFPage {
  id: string;
  page_number: number;
  thumbnail_url: string | null;
  pdf_batches: {
    filename: string;
  } | null;
}

interface PDFPageGalleryProps {
  pages: PDFPage[];
  selectedPages: string[];
  onPageSelect: (pageId: string) => void;
}

export function PDFPageGallery({ pages, selectedPages, onPageSelect }: PDFPageGalleryProps) {
  const handlePageClick = (pageId: string, event: React.MouseEvent) => {
    event.preventDefault();
    onPageSelect(pageId);
  };

  const handleShiftClick = (pageId: string, event: React.MouseEvent) => {
    if (event.shiftKey) {
      event.preventDefault();
      // Find the range of pages to select
      const pageIds = pages.map(p => p.id);
      const currentIndex = pageIds.indexOf(pageId);
      const lastSelectedIndex = selectedPages.length > 0 
        ? pageIds.indexOf(selectedPages[selectedPages.length - 1])
        : -1;

      if (lastSelectedIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(currentIndex, lastSelectedIndex);
        const end = Math.max(currentIndex, lastSelectedIndex);
        const rangeIds = pageIds.slice(start, end + 1);
        
        // Select all pages in range
        rangeIds.forEach(id => {
          if (!selectedPages.includes(id)) {
            onPageSelect(id);
          }
        });
      } else {
        onPageSelect(pageId);
      }
    } else {
      onPageSelect(pageId);
    }
  };

  if (pages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pages to display
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {pages.map((page) => {
        const isSelected = selectedPages.includes(page.id);
        
        return (
          <Card
            key={page.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isSelected && "ring-2 ring-primary bg-primary/5"
            )}
            onClick={(e) => handleShiftClick(page.id, e)}
          >
            <CardContent className="p-3">
              <div className="aspect-[3/4] bg-muted rounded flex items-center justify-center mb-2">
                {page.thumbnail_url ? (
                  <img
                    src={page.thumbnail_url}
                    alt={`Page ${page.page_number}`}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <FileText className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    Page {page.page_number}
                  </Badge>
                  {isSelected && (
                    <Badge variant="default" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
                
                {page.pdf_batches && (
                  <p className="text-xs text-muted-foreground truncate">
                    {page.pdf_batches.filename}
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
