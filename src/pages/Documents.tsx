import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, Trash2, AlertCircle, Loader2 } from 'lucide-react';
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
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [temporaryPages, setTemporaryPages] = useState<any[]>([]);

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
    setProcessingStatus(`Processing ${file.name}...`);
    setTemporaryPages([]);

    try {
      console.log('🚀 Starting PDF upload process for:', file.name);
      
      toast({
        title: "Processing PDF",
        description: `Processing ${file.name}... This may take a moment.`,
      });

      setProcessingStatus(`Extracting pages from ${file.name}...`);
      const processedPages = await PDFProcessingService.processPDF(file);
      console.log(`🎉 PDF processed: ${processedPages.length} pages extracted`);
      
      setProcessingStatus('Creating page thumbnails...');
      
      // Create temporary page objects for immediate display
      const tempPages = processedPages.map((page, index) => {
        const thumbnailUrl = URL.createObjectURL(page.thumbnailBlob);
        const fullPageUrl = URL.createObjectURL(page.fullPageBlob);
        
        return {
          id: `temp_${Date.now()}_${index}`,
          page_number: page.pageNumber,
          thumbnail_url: thumbnailUrl,
          full_page_url: fullPageUrl,
          pdf_batches: { filename: file.name },
          status: 'unassigned'
        };
      });

      setTemporaryPages(tempPages);
      setProcessingStatus('');

      toast({
        title: "PDF Processed Successfully! 🎉",
        description: `${processedPages.length} pages extracted from ${file.name} and ready for viewing.`,
      });
      
    } catch (error) {
      console.error('❌ PDF upload process failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during PDF processing';
      
      toast({
        title: "PDF Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setTemporaryPages([]);
    } finally {
      setUploadingPDFs(prev => prev.filter(id => id !== uploadId));
      setProcessingStatus('');
    }
  }, [toast]);

  const handlePageSelect = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const handlePageDelete = async (pageId: string) => {
    // Remove from temporary pages
    setTemporaryPages(prev => prev.filter(p => p.id !== pageId));
    setSelectedPages(prev => prev.filter(id => id !== pageId));
    
    toast({
      title: "Page Removed",
      description: "Page has been removed from the current session.",
    });
  };

  const handleDeleteAllPages = async () => {
    setTemporaryPages([]);
    setSelectedPages([]);
    
    toast({
      title: "All Pages Cleared",
      description: "All temporary pages have been cleared.",
    });
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
    toast({
      title: "Feature Coming Soon",
      description: "Vehicle assignment will be implemented next.",
    });
    setShowIntakeDialog(false);
  };

  const isUploading = uploadingPDFs.length > 0;
  const allPages = [...(unassignedPages || []), ...temporaryPages];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Upload and process vehicle paperwork PDFs - extract individual pages
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            PDF Upload & Page Extraction
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PDFUploadZone onUpload={handlePDFUpload} />
          {processingStatus && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-sm text-blue-700 font-medium">{processingStatus}</p>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Processing each page individually - this may take some time for large PDFs
              </p>
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
              Extracted Pages ({allPages.length})
            </div>
            <div className="flex items-center gap-2">
              {allPages.length > 0 && (
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
          ) : allPages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No pages available</p>
              <p className="text-sm">Upload a PDF to extract and view individual pages</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Each page from your PDF is displayed below as a separate thumbnail. Click to select pages.
              </p>
              <PDFPageGallery
                pages={allPages}
                selectedPages={selectedPages}
                onPageSelect={handlePageSelect}
                onPageDelete={handlePageDelete}
              />
            </div>
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
        title="Clear All Pages"
        description={`Are you sure you want to clear all ${allPages.length} pages? This action cannot be undone.`}
        confirmText="Clear All"
      />
    </div>
  );
}
