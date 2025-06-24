
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFUploadZone } from '@/components/PDFUploadZone';
import { PDFPageGallery } from '@/components/PDFPageGallery';
import { VehicleIntakeDialog } from '@/components/VehicleIntakeDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { PDFProcessingService } from '@/services/pdfProcessingService';

export function Documents() {
  const { toast } = useToast();
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showIntakeDialog, setShowIntakeDialog] = useState(false);
  const [uploadingPDFs, setUploadingPDFs] = useState<string[]>([]);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  // Fetch unassigned PDF pages
  const { data: unassignedPages, isLoading, refetch } = useQuery({
    queryKey: ['pdf-pages', 'unassigned'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_pages')
        .select('*, pdf_batches(filename)')
        .eq('status', 'unassigned')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handlePDFUpload = useCallback(async (file: File) => {
    const uploadId = `${file.name}_${Date.now()}`;
    setUploadingPDFs(prev => [...prev, uploadId]);

    try {
      console.log('Starting PDF upload:', file.name);
      toast({
        title: "Processing PDF",
        description: `Uploading and processing ${file.name}...`,
      });

      // Create batch record
      const { data: batch, error: batchError } = await supabase
        .from('pdf_batches')
        .insert({
          filename: file.name,
          total_pages: 0,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Process the PDF to extract pages
      const processedPages = await PDFProcessingService.processPDF(file);
      
      // Upload original PDF file
      const pdfPath = `pdfs/${batch.id}/${file.name}`;
      const pdfUrl = await PDFProcessingService.uploadToStorage(file, pdfPath);

      // Upload each page
      const pageInserts = [];
      for (const processedPage of processedPages) {
        const thumbnailPath = `thumbnails/${batch.id}/page-${processedPage.pageNumber}.jpg`;
        const fullPagePath = `pages/${batch.id}/page-${processedPage.pageNumber}.jpg`;
        
        const [thumbnailUrl, fullPageUrl] = await Promise.all([
          PDFProcessingService.uploadToStorage(processedPage.thumbnailBlob, thumbnailPath),
          PDFProcessingService.uploadToStorage(processedPage.fullPageBlob, fullPagePath)
        ]);

        pageInserts.push({
          batch_id: batch.id,
          page_number: processedPage.pageNumber,
          thumbnail_url: thumbnailUrl,
          full_page_url: fullPageUrl,
          status: 'unassigned',
          file_size: processedPage.fullPageBlob.size
        });
      }

      // Insert all pages
      const { error: pagesError } = await supabase
        .from('pdf_pages')
        .insert(pageInserts);

      if (pagesError) throw pagesError;

      // Update batch with completion info
      await supabase
        .from('pdf_batches')
        .update({ 
          total_pages: processedPages.length,
          processed_pages: processedPages.length,
          status: 'completed',
          file_path: pdfPath
        })
        .eq('id', batch.id);

      toast({
        title: "PDF Processed Successfully",
        description: `${processedPages.length} pages are ready for assignment.`,
      });

      refetch();
    } catch (error) {
      console.error('PDF upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingPDFs(prev => prev.filter(id => id !== uploadId));
    }
  }, [toast, refetch]);

  const handlePageSelect = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const handlePageDelete = async (pageId: string) => {
    try {
      const pageToDelete = unassignedPages?.find(p => p.id === pageId);
      if (!pageToDelete) return;

      // Delete from storage
      if (pageToDelete.thumbnail_url) {
        const thumbnailPath = new URL(pageToDelete.thumbnail_url).pathname.split('/').pop();
        if (thumbnailPath) {
          await PDFProcessingService.deleteFromStorage(`thumbnails/${pageToDelete.batch_id}/${thumbnailPath}`);
        }
      }
      
      if (pageToDelete.full_page_url) {
        const fullPagePath = new URL(pageToDelete.full_page_url).pathname.split('/').pop();
        if (fullPagePath) {
          await PDFProcessingService.deleteFromStorage(`pages/${pageToDelete.batch_id}/${fullPagePath}`);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('pdf_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      // Remove from selected pages if it was selected
      setSelectedPages(prev => prev.filter(id => id !== pageId));

      toast({
        title: "Page Deleted",
        description: "Page has been successfully removed.",
      });

      refetch();
    } catch (error) {
      console.error('Page deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete page. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllPages = async () => {
    try {
      if (!unassignedPages || unassignedPages.length === 0) return;

      // Delete all files from storage
      const deletePromises = unassignedPages.flatMap(page => {
        const promises = [];
        if (page.thumbnail_url) {
          const thumbnailPath = new URL(page.thumbnail_url).pathname.split('/').pop();
          if (thumbnailPath) {
            promises.push(PDFProcessingService.deleteFromStorage(`thumbnails/${page.batch_id}/${thumbnailPath}`));
          }
        }
        if (page.full_page_url) {
          const fullPagePath = new URL(page.full_page_url).pathname.split('/').pop();
          if (fullPagePath) {
            promises.push(PDFProcessingService.deleteFromStorage(`pages/${page.batch_id}/${fullPagePath}`));
          }
        }
        return promises;
      });

      await Promise.all(deletePromises);

      // Delete all pages from database
      const { error } = await supabase
        .from('pdf_pages')
        .delete()
        .eq('status', 'unassigned');

      if (error) throw error;

      setSelectedPages([]);
      
      toast({
        title: "All Pages Deleted",
        description: `${unassignedPages.length} pages have been removed.`,
      });

      refetch();
    } catch (error) {
      console.error('Bulk deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete all pages. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendToIntake = () => {
    if (selectedPages.length === 0) {
      toast({
        title: "No Pages Selected",
        description: "Please select at least one page to send to intake.",
        variant: "destructive",
      });
      return;
    }
    setShowIntakeDialog(true);
  };

  const handleIntakeComplete = async (vehicleId: string) => {
    try {
      // Mark selected pages as assigned to the vehicle
      const { error } = await supabase
        .from('pdf_pages')
        .update({ 
          status: 'assigned',
          assigned_vehicle_id: vehicleId 
        })
        .in('id', selectedPages);

      if (error) throw error;

      toast({
        title: "Pages Assigned Successfully",
        description: `${selectedPages.length} pages assigned to vehicle.`,
      });

      setSelectedPages([]);
      setShowIntakeDialog(false);
      refetch();
    } catch (error) {
      console.error('Page assignment error:', error);
      toast({
        title: "Assignment Failed", 
        description: "Failed to assign pages to vehicle.",
        variant: "destructive",
      });
    }
  };

  const isUploading = uploadingPDFs.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Upload and process vehicle paperwork PDFs
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            PDF Upload
            {isUploading && (
              <span className="text-sm text-muted-foreground">
                Processing {uploadingPDFs.length} PDF(s)...
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PDFUploadZone onUpload={handlePDFUpload} />
        </CardContent>
      </Card>

      {/* Page Gallery Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Unassigned Pages ({unassignedPages?.length || 0})
            </div>
            <div className="flex items-center gap-2">
              {unassignedPages && unassignedPages.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => setDeleteAllDialogOpen(true)}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              )}
              {selectedPages.length > 0 && (
                <Button onClick={handleSendToIntake} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Send to Intake ({selectedPages.length})
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading pages...</div>
          ) : !unassignedPages || unassignedPages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No unassigned pages. Upload a PDF to get started.
            </div>
          ) : (
            <PDFPageGallery
              pages={unassignedPages}
              selectedPages={selectedPages}
              onPageSelect={handlePageSelect}
              onPageDelete={handlePageDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Vehicle Intake Dialog */}
      {showIntakeDialog && (
        <VehicleIntakeDialog
          isOpen={showIntakeDialog}
          onClose={() => setShowIntakeDialog(false)}
          onComplete={handleIntakeComplete}
          selectedPages={selectedPages.length}
        />
      )}

      {/* Delete All Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
        onConfirm={handleDeleteAllPages}
        title="Delete All Pages"
        description={`Are you sure you want to delete all ${unassignedPages?.length || 0} unassigned pages? This action cannot be undone.`}
        confirmText="Delete All"
      />
    </div>
  );
}
