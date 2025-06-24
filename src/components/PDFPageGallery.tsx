
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { PagePreviewModal } from './PagePreviewModal';

interface PDFPage {
  id: string;
  page_number: number;
  thumbnail_url: string | null;
  full_page_url: string | null;
  pdf_batches: {
    filename: string;
  } | null;
}

interface PDFPageGalleryProps {
  pages: PDFPage[];
  selectedPages: string[];
  onPageSelect: (pageId: string) => void;
  onPageDelete?: (pageId: string) => void;
}

export function PDFPageGallery({ 
  pages, 
  selectedPages, 
  onPageSelect,
  onPageDelete 
}: PDFPageGalleryProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<PDFPage | null>(null);

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

  const handleDeleteClick = (pageId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setPageToDelete(pageId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (pageToDelete && onPageDelete) {
      onPageDelete(pageToDelete);
    }
    setDeleteDialogOpen(false);
    setPageToDelete(null);
  };

  const handlePreviewClick = (page: PDFPage, event: React.MouseEvent) => {
    event.stopPropagation();
    setPreviewPage(page);
  };

  if (pages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No pages to display
      </div>
    );
  }

  const pageToDeleteData = pages.find(p => p.id === pageToDelete);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {pages.map((page) => {
          const isSelected = selectedPages.includes(page.id);
          
          return (
            <Card
              key={page.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md relative group",
                isSelected && "ring-2 ring-primary bg-primary/5"
              )}
              onClick={(e) => handleShiftClick(page.id, e)}
            >
              <CardContent className="p-3">
                <div className="aspect-[3/4] bg-muted rounded flex items-center justify-center mb-2 relative overflow-hidden">
                  {page.thumbnail_url ? (
                    <img
                      src={page.thumbnail_url}
                      alt={`Page ${page.page_number}`}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  )}
                  
                  {/* Action buttons - shown on hover */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handlePreviewClick(page, e)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    {onPageDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleDeleteClick(page.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Page"
        description={`Are you sure you want to delete page ${pageToDeleteData?.page_number}? This action cannot be undone.`}
        confirmText="Delete Page"
      />

      {/* Page Preview Modal */}
      <PagePreviewModal
        isOpen={!!previewPage}
        onClose={() => setPreviewPage(null)}
        page={previewPage}
      />
    </>
  );
}
