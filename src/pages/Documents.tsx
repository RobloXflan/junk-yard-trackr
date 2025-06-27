
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, Trash2, Filter, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ServerPDFUploadZone } from '@/components/ServerPDFUploadZone';
import { PageThumbnailGallery, PageThumbnailData } from '@/components/PageThumbnailGallery';
import { PagePreviewDialog } from '@/components/PagePreviewDialog';
import { VehicleAssignmentDialog } from '@/components/VehicleAssignmentDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { PDFProcessingService } from '@/services/pdfProcessingService';
import { supabase } from '@/integrations/supabase/client';

export function Documents() {
  const { toast } = useToast();
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewPage, setPreviewPage] = useState<PageThumbnailData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [documentPages, setDocumentPages] = useState<PageThumbnailData[]>([]);
  const [processingError, setProcessingError] = useState<string>('');
  
  // Filters
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'page'>('date');

  // Load existing pages on component mount
  useEffect(() => {
    loadExistingPages();
  }, []);

  const loadExistingPages = async () => {
    try {
      const { data: pages, error } = await supabase
        .from('pdf_pages')
        .select(`
          *,
          pdf_batches(filename)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedPages: PageThumbnailData[] = pages.map(page => ({
        id: page.id,
        pageNumber: page.page_number,
        thumbnailUrl: page.thumbnail_url || '',
        fullPageUrl: page.full_page_url || '',
        filename: page.pdf_batches?.filename || 'Unknown',
        status: page.status as 'unassigned' | 'assigned',
        assignedVehicleId: page.assigned_vehicle_id || undefined,
      }));

      setDocumentPages(transformedPages);
    } catch (error) {
      console.error('Failed to load existing pages:', error);
      toast({
        title: "Error Loading Pages",
        description: "Failed to load existing document pages.",
        variant: "destructive",
      });
    }
  };

  const handlePDFUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setProcessingStatus(`Processing ${file.name}...`);
    setProcessingError('');

    try {
      console.log('🚀 Starting server-side PDF upload process for:', file.name);
      
      toast({
        title: "Processing PDF",
        description: `Processing ${file.name}... This may take a moment.`,
      });

      const processedBatch = await PDFProcessingService.processPDF(file);
      console.log(`🎉 PDF processed: ${processedBatch.pages.length} pages extracted`);
      
      // Convert to PageThumbnailData format
      const newPages: PageThumbnailData[] = processedBatch.pages.map(page => ({
        id: page.id,
        pageNumber: page.pageNumber,
        thumbnailUrl: page.thumbnailUrl,
        fullPageUrl: page.fullPageUrl,
        filename: processedBatch.filename,
        status: page.status,
        assignedVehicleId: undefined,
      }));

      setDocumentPages(prev => [...newPages, ...prev]);
      setProcessingStatus('');

      toast({
        title: "PDF Processed Successfully! 🎉",
        description: `${processedBatch.pages.length} pages extracted from ${file.name} and ready for assignment.`,
      });
      
    } catch (error) {
      console.error('❌ PDF upload process failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during PDF processing';
      setProcessingError(errorMessage);
      
      toast({
        title: "PDF Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setProcessingStatus('');
    }
  }, [toast]);

  const retryProcessing = () => {
    setProcessingError('');
    // Reset any failed state if needed
  };

  const handlePageSelect = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const handlePagePreview = (page: PageThumbnailData) => {
    setPreviewPage(page);
    setShowPreviewDialog(true);
  };

  const handleAssignPages = async (vehicleId: string, vehicleInfo: string) => {
    try {
      // Update pages in database
      const { error } = await supabase
        .from('pdf_pages')
        .update({
          status: 'assigned',
          assigned_vehicle_id: vehicleId,
        })
        .in('id', selectedPages);

      if (error) throw error;

      // Update local state
      setDocumentPages(prev => prev.map(page => 
        selectedPages.includes(page.id) 
          ? { 
              ...page, 
              status: 'assigned' as const,
              assignedVehicleId: vehicleId,
              assignedVehicleInfo: vehicleInfo
            }
          : page
      ));

      // Clear selection
      setSelectedPages([]);
      setShowAssignmentDialog(false);

      toast({
        title: "Pages Assigned Successfully",
        description: `${selectedPages.length} page(s) assigned to ${vehicleInfo}`,
      });
    } catch (error) {
      console.error('Failed to assign pages:', error);
      toast({
        title: "Assignment Failed",
        description: "Failed to assign pages to vehicle.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllPages = async () => {
    try {
      // Delete from database
      const { error } = await supabase
        .from('pdf_pages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      setDocumentPages([]);
      setSelectedPages([]);
      setDeleteAllDialogOpen(false);
      
      toast({
        title: "All Pages Cleared",
        description: "All document pages have been cleared.",
      });
    } catch (error) {
      console.error('Failed to delete pages:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to clear pages.",
        variant: "destructive",
      });
    }
  };

  // Filter and sort pages
  const filteredPages = documentPages
    .filter(page => showOnlyUnassigned ? page.status === 'unassigned' : true)
    .sort((a, b) => {
      if (sortBy === 'page') {
        return a.pageNumber - b.pageNumber;
      }
      // Sort by date (based on ID timestamp)
      return b.id.localeCompare(a.id);
    });

  const unassignedCount = documentPages.filter(p => p.status === 'unassigned').length;
  const assignedCount = documentPages.filter(p => p.status === 'assigned').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Intake</h1>
          <p className="text-muted-foreground">
            Upload PDFs and assign pages to vehicles - Powered by server-side processing
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            PDF Upload & Auto-Split (Server-Side)
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ServerPDFUploadZone onUpload={handlePDFUpload} isUploading={isUploading} />
          
          {/* Processing Status */}
          {processingStatus && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-sm text-blue-700 font-medium">{processingStatus}</p>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Server-side processing ensures reliable PDF splitting without browser compatibility issues
              </p>
            </div>
          )}

          {/* Processing Error */}
          {processingError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium">PDF Processing Failed</p>
                  <p className="text-sm text-red-600 mt-1">{processingError}</p>
                  <div className="mt-3 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={retryProcessing}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Pages Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Pages ({filteredPages.length})
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-green-600">{assignedCount} assigned</span>
                <span className="text-blue-600">{unassignedCount} unassigned</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Filters */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <Select value={showOnlyUnassigned ? 'unassigned' : 'all'} onValueChange={(value) => setShowOnlyUnassigned(value === 'unassigned')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pages</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={(value: 'date' | 'page') => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">By Date</SelectItem>
                    <SelectItem value="page">By Page #</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {documentPages.length > 0 && (
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
                <Button onClick={() => setShowAssignmentDialog(true)} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Assign to Vehicle ({selectedPages.length})
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click pages to select them, then assign to vehicles. Use the eye button to preview full-size pages.
            </p>
            <PageThumbnailGallery
              pages={filteredPages}
              selectedPages={selectedPages}
              onPageSelect={handlePageSelect}
              onPreview={handlePagePreview}
              showOnlyUnassigned={showOnlyUnassigned}
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Assignment Dialog */}
      <VehicleAssignmentDialog
        isOpen={showAssignmentDialog}
        onClose={() => setShowAssignmentDialog(false)}
        onAssign={handleAssignPages}
        selectedPagesCount={selectedPages.length}
      />

      {/* Page Preview Dialog */}
      <PagePreviewDialog
        isOpen={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        page={previewPage}
      />

      {/* Delete All Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
        onConfirm={handleDeleteAllPages}
        title="Clear All Pages"
        description={`Are you sure you want to clear all ${documentPages.length} pages? This action cannot be undone.`}
        confirmText="Clear All"
      />
    </div>
  );
}
