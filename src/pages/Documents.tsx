import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
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
  const [processingError, setProcessingError] = useState<string | null>(null);

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
    setProcessingError(null);

    try {
      console.log('=== Starting PDF Upload Process ===');
      console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      toast({
        title: "Processing PDF",
        description: `Processing ${file.name}...`,
      });

      // Create batch record first
      console.log('Creating batch record...');
      const { data: batch, error: batchError } = await supabase
        .from('pdf_batches')
        .insert({
          filename: file.name,
          total_pages: 0,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) {
        console.error('Batch creation error:', batchError);
        throw new Error(`Failed to create batch: ${batchError.message}`);
      }

      console.log('Batch created:', batch.id);

      // Process the PDF
      console.log('Starting PDF processing...');
      const processedPages = await PDFProcessingService.processPDF(file);
      console.log(`PDF processed successfully: ${processedPages.length} pages`);
      
      // Upload original PDF file
      console.log('Uploading original PDF...');
      const pdfPath = `pdfs/${batch.id}/${file.name}`;
      const pdfUrl = await PDFProcessingService.uploadToStorage(file, pdfPath);
      console.log('Original PDF uploaded:', pdfUrl);

      // Upload each page with progress tracking
      const pageInserts = [];
      let successCount = 0;
      
      for (let i = 0; i < processedPages.length; i++) {
        const processedPage = processedPages[i];
        
        try {
          console.log(`Uploading page ${processedPage.pageNumber}...`);
          
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
          
          successCount++;
          console.log(`Page ${processedPage.pageNumber} uploaded successfully`);
          
        } catch (pageError) {
          console.error(`Failed to upload page ${processedPage.pageNumber}:`, pageError);
          // Continue with other pages
        }
      }

      if (pageInserts.length === 0) {
        throw new Error('No pages could be uploaded successfully');
      }

      // Insert all successfully processed pages
      console.log(`Inserting ${pageInserts.length} pages into database...`);
      const { error: pagesError } = await supabase
        .from('pdf_pages')
        .insert(pageInserts);

      if (pagesError) {
        console.error('Pages insertion error:', pagesError);
        throw new Error(`Failed to save pages: ${pagesError.message}`);
      }

      // Update batch with completion info
      await supabase
        .from('pdf_batches')
        .update({ 
          total_pages: processedPages.length,
          processed_pages: successCount,
          status: 'completed',
          file_path: pdfPath
        })
        .eq('id', batch.id);

      console.log('=== PDF Upload Process Completed Successfully ===');
      
      toast({
        title: "PDF Processed Successfully",
        description: `${successCount} pages are ready for assignment.`,
      });

      refetch();
      
    } catch (error) {
      console.error('=== PDF Upload Process Failed ===');
      console.error('Error details:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProcessingError(errorMessage);
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
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

  const extractFilePathFromUrl = (url: string, basePath: string): string | null => {
    try {
      if (!url) return null;
      
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'pdf-documents');
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        const pathParts = urlParts.slice(bucketIndex + 1);
        return pathParts.join('/');
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting file path from URL:', url, error);
      return null;
    }
  };

  const handlePageDelete = async (pageId: string) => {
    try {
      const pageToDelete = unassignedPages?.find(p => p.id === pageId);
      if (!pageToDelete) return;

      console.log('Deleting page:', pageToDelete);

      const filesToDelete = [];
      
      if (pageToDelete.thumbnail_url) {
        const thumbnailPath = extractFilePathFromUrl(pageToDelete.thumbnail_url, 'thumbnails');
        if (thumbnailPath) {
          filesToDelete.push(thumbnailPath);
        }
      }
      
      if (pageToDelete.full_page_url) {
        const fullPagePath = extractFilePathFromUrl(pageToDelete.full_page_url, 'pages');
        if (fullPagePath) {
          filesToDelete.push(fullPagePath);
        }
      }

      if (filesToDelete.length > 0) {
        console.log('Deleting files from storage:', filesToDelete);
        const { error: storageError } = await supabase.storage
          .from('pdf-documents')
          .remove(filesToDelete);
        
        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }
      }

      const { error } = await supabase
        .from('pdf_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

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

      const filesToDelete = [];
      
      unassignedPages.forEach(page => {
        if (page.thumbnail_url) {
          const thumbnailPath = extractFilePathFromUrl(page.thumbnail_url, 'thumbnails');
          if (thumbnailPath) filesToDelete.push(thumbnailPath);
        }
        if (page.full_page_url) {
          const fullPagePath = extractFilePathFromUrl(page.full_page_url, 'pages');
          if (fullPagePath) filesToDelete.push(fullPagePath);
        }
      });

      if (filesToDelete.length > 0) {
        console.log('Deleting all files from storage:', filesToDelete);
        const { error: storageError } = await supabase.storage
          .from('pdf-documents')
          .remove(filesToDelete);
        
        if (storageError) {
          console.error('Bulk storage deletion error:', storageError);
        }
      }

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
          {processingError && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Processing Error</p>
                  <p className="text-sm text-destructive/80">{processingError}</p>
                </div>
              </div>
            </div>
          )}
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
