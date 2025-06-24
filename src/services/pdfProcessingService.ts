
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfBatch {
  id: string;
  filename: string;
  totalPages: number;
}

class PdfProcessingService {
  async processPdf(file: File): Promise<string> {
    try {
      // Create PDF batch record
      const { data: batch, error: batchError } = await supabase
        .from('pdf_batches')
        .insert({
          filename: file.name,
          status: 'processing'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf: PDFDocumentProxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      // Update batch with total pages
      await supabase
        .from('pdf_batches')
        .update({ total_pages: totalPages })
        .eq('id', batch.id);

      // Process each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page: PDFPageProxy = await pdf.getPage(pageNum);
        
        // Generate thumbnail
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        // Convert canvas to data URL
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);

        // Create page record
        await supabase
          .from('pdf_pages')
          .insert({
            batch_id: batch.id,
            page_number: pageNum,
            thumbnail_url: thumbnailDataUrl,
            status: 'ready'
          });
      }

      // Update batch status
      await supabase
        .from('pdf_batches')
        .update({ 
          status: 'completed',
          processed_pages: totalPages
        })
        .eq('id', batch.id);

      return batch.id;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  async getBatchPages(batchId: string) {
    const { data, error } = await supabase
      .from('pdf_pages')
      .select('*')
      .eq('batch_id', batchId)
      .order('page_number');

    if (error) throw error;
    return data;
  }

  async assignPagesToVehicle(pageIds: string[], vehicleId?: string) {
    const { error } = await supabase
      .from('pdf_pages')
      .update({ 
        assigned_vehicle_id: vehicleId,
        status: vehicleId ? 'assigned' : 'unassigned'
      })
      .in('id', pageIds);

    if (error) throw error;
  }
}

export const pdfProcessingService = new PdfProcessingService();
