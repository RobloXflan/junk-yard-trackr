
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface PagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: {
    id: string;
    page_number: number;
    full_page_url: string | null;
    pdf_batches: {
      filename: string;
    } | null;
  } | null;
}

export function PagePreviewModal({ isOpen, onClose, page }: PagePreviewModalProps) {
  if (!page) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="secondary">Page {page.page_number}</Badge>
            {page.pdf_batches && (
              <span className="text-sm text-muted-foreground">
                {page.pdf_batches.filename}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          {page.full_page_url ? (
            <img
              src={page.full_page_url}
              alt={`Page ${page.page_number}`}
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
