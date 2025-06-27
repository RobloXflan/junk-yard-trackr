
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, Trash2, Filter, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFUploadZone } from '@/components/PDFUploadZone';
import { DocumentPage, DocumentPageData } from '@/components/DocumentPage';
import { PagePreviewDialog } from '@/components/PagePreviewDialog';
import { VehicleAssignmentDialog } from '@/components/VehicleAssignmentDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { PDFProcessingService } from '@/services/pdfProcessingService';

export function Documents() {
  const { toast } = useToast();
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewPage, setPreviewPage] = useState<DocumentPageData | null>(null);
  const [uploadingPDFs, setUploadingPDFs] = useState<string[]>([]);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [documentPages, setDocumentPages] = useState<DocumentPageData[]>([]);
  
  // Filters
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'page'>('date');

  const handlePDFUpload = useCallback(async (file: File) => {
    const uploadId = `${file.name}_${Date.now()}`;
    setUploadingPDFs(prev => [...prev, uploadId]);
    setProcessingStatus(`Processing ${file.name}...`);

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
      
      // Create document page objects for display
      const newPages: DocumentPageData[] = processedPages.map((page, index) => {
        const thumbnailUrl = URL.createObjectURL(page.thumbnailBlob);
        const fullPageUrl = URL.createObjectURL(page.fullPageBlob);
        
        return {
          id: `page_${Date.now()}_${index}`,
          pageNumber: page.pageNumber,
          thumbnailUrl,
          fullPageUrl,
          filename: file.name,
          isAssigned: false
        };
      });

      setDocumentPages(prev => [...prev, ...newPages]);
      setProcessingStatus('');

      toast({
        title: "PDF Processed Successfully! 🎉",
        description: `${processedPages.length} pages extracted from ${file.name} and ready for assignment.`,
      });
      
    } catch (error) {
      console.error('❌ PDF upload process failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during PDF processing';
      
      toast({
        title: "PDF Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
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

  const handlePagePreview = (page: DocumentPageData) => {
    setPreviewPage(page);
    setShowPreviewDialog(true);
  };

  const handleAssignPages = (vehicleId: string, vehicleInfo: string) => {
    // Update the selected pages as assigned
    setDocumentPages(prev => prev.map(page => 
      selectedPages.includes(page.id) 
        ? { 
            ...page, 
            isAssigned: true, 
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
  };

  const handleDeleteAllPages = () => {
    // Clean up blob URLs to prevent memory leaks
    documentPages.forEach(page => {
      URL.revokeObjectURL(page.thumbnailUrl);
      URL.revokeObjectURL(page.fullPageUrl);
    });
    
    setDocumentPages([]);
    setSelectedPages([]);
    setDeleteAllDialogOpen(false);
    
    toast({
      title: "All Pages Cleared",
      description: "All document pages have been cleared.",
    });
  };

  const handleUnassignPage = (pageId: string) => {
    setDocumentPages(prev => prev.map(page => 
      page.id === pageId 
        ? { 
            ...page, 
            isAssigned: false, 
            assignedVehicleId: undefined,
            assignedVehicleInfo: undefined
          }
        : page
    ));

    toast({
      title: "Page Unassigned",
      description: "Page has been unassigned and is now available for selection.",
    });
  };

  // Filter and sort pages
  const filteredPages = documentPages
    .filter(page => showOnlyUnassigned ? !page.isAssigned : true)
    .sort((a, b) => {
      if (sortBy === 'page') {
        return a.pageNumber - b.pageNumber;
      }
      // Sort by date (based on ID timestamp)
      return b.id.localeCompare(a.id);
    });

  const unassignedCount = documentPages.filter(p => !p.isAssigned).length;
  const assignedCount = documentPages.filter(p => p.isAssigned).length;
  const isUploading = uploadingPDFs.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Intake</h1>
          <p className="text-muted-foreground">
            Upload PDFs and assign pages to vehicles
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            PDF Upload & Auto-Split
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
                Each page is processed individually for optimal quality
              </p>
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
          {filteredPages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {documentPages.length === 0 ? 'No document pages available' : 'No pages match your filters'}
              </p>
              <p className="text-sm">
                {documentPages.length === 0 ? 'Upload a PDF to automatically split it into individual pages' : 'Try adjusting your filters to see more pages'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click pages to select them, then assign to vehicles. Use the eye button to preview full-size pages.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredPages.map((page) => (
                  <DocumentPage
                    key={page.id}
                    page={page}
                    isSelected={selectedPages.includes(page.id)}
                    onSelect={handlePageSelect}
                    onPreview={handlePagePreview}
                  />
                ))}
              </div>
            </div>
          )}
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
