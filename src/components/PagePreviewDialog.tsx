
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DocumentPageData } from './DocumentPage';

interface PagePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  page: DocumentPageData | null;
}

export function PagePreviewDialog({ isOpen, onClose, page }: PagePreviewDialogProps) {
  if (!page) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="secondary">Page {page.pageNumber}</Badge>
            <span className="text-sm text-muted-foreground">
              {page.filename}
            </span>
            {page.assignedVehicleInfo && (
              <Badge variant="default" className="text-xs">
                {page.assignedVehicleInfo}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          {page.fullPageUrl ? (
            <img
              src={page.fullPageUrl}
              alt={`Page ${page.pageNumber}`}
              className="max-w-full h-auto border rounded"
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No preview available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
