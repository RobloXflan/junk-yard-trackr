
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PDFUploadZone } from '@/components/PDFUploadZone';
import { PDFPageGallery } from '@/components/PDFPageGallery';
import { VehicleIntakeDialog } from '@/components/VehicleIntakeDialog';

export function Documents() {
  const { toast } = useToast();
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [showIntakeDialog, setShowIntakeDialog] = useState(false);

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
          total_pages: 0, // Will be updated after processing
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // For demo purposes, create mock pages (in real implementation, you'd process the actual PDF)
      const mockPages = Array.from({ length: 5 }, (_, i) => ({
        batch_id: batch.id,
        page_number: i + 1,
        thumbnail_url: `/placeholder.svg`, // In real implementation, generate thumbnails
        full_page_url: `/placeholder.svg`,
        status: 'unassigned'
      }));

      const { error: pagesError } = await supabase
        .from('pdf_pages')
        .insert(mockPages);

      if (pagesError) throw pagesError;

      // Update batch with total pages
      await supabase
        .from('pdf_batches')
        .update({ 
          total_pages: mockPages.length,
          status: 'completed'
        })
        .eq('id', batch.id);

      toast({
        title: "PDF Processed Successfully",
        description: `${mockPages.length} pages are ready for assignment.`,
      });

      refetch();
    } catch (error) {
      console.error('PDF upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to process PDF. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, refetch]);

  const handlePageSelect = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
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
            {selectedPages.length > 0 && (
              <Button onClick={handleSendToIntake} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Send to Intake ({selectedPages.length})
              </Button>
            )}
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
    </div>
  );
}
