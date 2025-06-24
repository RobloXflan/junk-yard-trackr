
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageThumbnail } from './PageThumbnail';
import { pdfProcessingService } from '@/services/pdfProcessingService';

interface PdfPage {
  id: string;
  page_number: number;
  thumbnail_url: string | null;
  status: string;
  assigned_vehicle_id: string | null;
}

interface PageGalleryProps {
  batchId: string;
  selectedPages: string[];
  onSelectionChange: (pageIds: string[]) => void;
}

export function PageGallery({ batchId, selectedPages, onSelectionChange }: PageGalleryProps) {
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadPages = async () => {
    setIsLoading(true);
    try {
      const pagesData = await pdfProcessingService.getBatchPages(batchId);
      setPages(pagesData);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (batchId) {
      loadPages();
    }
  }, [batchId]);

  const handlePageClick = (pageId: string, isShiftClick: boolean) => {
    if (isShiftClick && selectedPages.length > 0) {
      // Handle range selection
      const currentIndex = pages.findIndex(p => p.id === pageId);
      const lastSelectedIndex = pages.findIndex(p => p.id === selectedPages[selectedPages.length - 1]);
      
      const start = Math.min(currentIndex, lastSelectedIndex);
      const end = Math.max(currentIndex, lastSelectedIndex);
      
      const rangeIds = pages.slice(start, end + 1).map(p => p.id);
      const newSelection = [...new Set([...selectedPages, ...rangeIds])];
      onSelectionChange(newSelection);
    } else {
      // Handle single selection
      if (selectedPages.includes(pageId)) {
        onSelectionChange(selectedPages.filter(id => id !== pageId));
      } else {
        onSelectionChange([...selectedPages, pageId]);
      }
    }
  };

  const unassignedPages = pages.filter(page => page.status === 'ready' || page.status === 'unassigned');

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading pages...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Document Pages</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              {selectedPages.length} selected
            </Badge>
            <Badge variant="secondary">
              {unassignedPages.length} unassigned
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {unassignedPages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No unassigned pages available
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {unassignedPages.map((page) => (
              <PageThumbnail
                key={page.id}
                page={page}
                isSelected={selectedPages.includes(page.id)}
                onClick={(isShiftClick) => handlePageClick(page.id, isShiftClick)}
              />
            ))}
          </div>
        )}
        
        {selectedPages.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => onSelectionChange([])}
            >
              Clear Selection
            </Button>
            <p className="text-sm text-muted-foreground">
              Click pages to select, Shift+click for range selection
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
