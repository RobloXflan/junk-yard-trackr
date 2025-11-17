import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Configure pdf.js worker - use CDN directly
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';

interface ProcessedPage {
  id: string;
  pageNumber: number;
  thumbnailUrl: string;
  fullPageUrl: string;
  batchId: string;
  status: 'unassigned' | 'assigned';
}

interface ProcessedBatch {
  id: string;
  filename: string;
  totalPages: number;
  pages: ProcessedPage[];
}

export class ClientPDFProcessor {
  static async processPDF(file: File): Promise<ProcessedBatch> {
    console.log('🔄 Starting client-side PDF processing for:', file.name);
    
    try {
      // Validate file
      if (!file || file.size === 0) {
        throw new Error('No file provided or file is empty');
      }
      if (file.type !== 'application/pdf') {
        throw new Error('Invalid file type. Please upload a PDF file.');
      }
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File too large. Please upload a PDF smaller than 50MB.');
      }

      // Create batch record
      const batchId = crypto.randomUUID();
      const { error: batchError } = await supabase
        .from('pdf_batches')
        .insert({
          id: batchId,
          filename: file.name,
          status: 'processing',
          total_pages: 0,
          processed_pages: 0
        });

      if (batchError) throw batchError;

      // Load PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      // Update batch with total pages
      await supabase
        .from('pdf_batches')
        .update({ total_pages: totalPages })
        .eq('id', batchId);

      console.log(`📄 Processing ${totalPages} pages...`);

      // Process each page
      const pages: ProcessedPage[] = [];
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          console.log(`Processing page ${pageNum}/${totalPages}...`);
          const page = await pdf.getPage(pageNum);
          
          // Render full size
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          
          if (!context) throw new Error('Could not get canvas context');

          await page.render({ canvasContext: context, viewport }).promise;
          
          // Convert to blob
          const fullBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create full image blob'));
            }, 'image/jpeg', 0.9);
          });

          console.log(`Created full image for page ${pageNum}, size: ${fullBlob.size} bytes`);

          // Create thumbnail
          const thumbViewport = page.getViewport({ scale: 0.3 });
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbViewport.width;
          thumbCanvas.height = thumbViewport.height;
          const thumbContext = thumbCanvas.getContext('2d');
          
          if (!thumbContext) throw new Error('Could not get thumbnail canvas context');

          await page.render({ canvasContext: thumbContext, viewport: thumbViewport }).promise;
          
          const thumbBlob = await new Promise<Blob>((resolve, reject) => {
            thumbCanvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create thumbnail blob'));
            }, 'image/jpeg', 0.7);
          });

          console.log(`Created thumbnail for page ${pageNum}, size: ${thumbBlob.size} bytes`);

          // Upload to storage
          const pageId = `page_${batchId}_${pageNum}`;
          const timestamp = Date.now();
          const fullPath = `${batchId}/page_${pageNum}_${timestamp}.jpg`;
          const thumbPath = `${batchId}/thumb_${pageNum}_${timestamp}.jpg`;

          console.log(`Uploading full image to: ${fullPath}`);
          const { error: fullError } = await supabase.storage
            .from('pdf-documents')
            .upload(fullPath, fullBlob);

          if (fullError) {
            console.error('Full image upload error:', fullError);
            throw fullError;
          }

          console.log(`Uploading thumbnail to: ${thumbPath}`);
          const { error: thumbError } = await supabase.storage
            .from('pdf-documents')
            .upload(thumbPath, thumbBlob);

          if (thumbError) {
            console.error('Thumbnail upload error:', thumbError);
            throw thumbError;
          }

          // Get public URLs
          const { data: fullData } = supabase.storage
            .from('pdf-documents')
            .getPublicUrl(fullPath);

          const { data: thumbData } = supabase.storage
            .from('pdf-documents')
            .getPublicUrl(thumbPath);

          console.log(`Creating page record for page ${pageNum}`);
          // Create page record
          const { error: pageError } = await supabase
            .from('pdf_pages')
            .insert({
              id: pageId,
              batch_id: batchId,
              page_number: pageNum,
              full_page_url: fullData.publicUrl,
              thumbnail_url: thumbData.publicUrl,
              status: 'unassigned'
            });

          if (pageError) {
            console.error('Page record creation error:', pageError);
            throw pageError;
          }

          pages.push({
            id: pageId,
            pageNumber: pageNum,
            thumbnailUrl: thumbData.publicUrl,
            fullPageUrl: fullData.publicUrl,
            batchId,
            status: 'unassigned'
          });

          // Update progress
          await supabase
            .from('pdf_batches')
            .update({ processed_pages: pageNum })
            .eq('id', batchId);

          console.log(`✅ Processed page ${pageNum}/${totalPages}`);
        } catch (pageError) {
          console.error(`❌ Failed to process page ${pageNum}:`, pageError);
          // Mark batch as failed
          await supabase
            .from('pdf_batches')
            .update({ status: 'failed' })
            .eq('id', batchId);
          throw new Error(`Failed to process page ${pageNum}: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`);
        }
      }

      // Mark batch as complete
      await supabase
        .from('pdf_batches')
        .update({ status: 'completed' })
        .eq('id', batchId);

      console.log(`✅ PDF processing complete: ${pages.length} pages`);

      return {
        id: batchId,
        filename: file.name,
        totalPages: pages.length,
        pages
      };

    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      if (error instanceof Error) {
        throw new Error(`PDF processing failed: ${error.message}`);
      }
      throw new Error('PDF processing failed: Unknown error occurred');
    }
  }
}
