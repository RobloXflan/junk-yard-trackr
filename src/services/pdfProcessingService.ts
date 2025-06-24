
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ProcessedPage {
  pageNumber: number;
  thumbnailBlob: Blob;
  fullPageBlob: Blob;
}

export class PDFProcessingService {
  static async processPDF(file: File): Promise<ProcessedPage[]> {
    console.log('Processing PDF:', file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pages: ProcessedPage[] = [];
      
      console.log('PDF loaded, total pages:', pdf.numPages);
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Processing page ${pageNum}...`);
        const page = await pdf.getPage(pageNum);
        
        // Create thumbnail (150px width)
        const thumbnailScale = 150 / page.getViewport({ scale: 1 }).width;
        const thumbnailViewport = page.getViewport({ scale: thumbnailScale });
        
        // Create full-size image (800px width)
        const fullScale = 800 / page.getViewport({ scale: 1 }).width;
        const fullViewport = page.getViewport({ scale: fullScale });
        
        // Render thumbnail
        const thumbnailCanvas = document.createElement('canvas');
        const thumbnailContext = thumbnailCanvas.getContext('2d');
        if (!thumbnailContext) {
          throw new Error('Failed to get thumbnail canvas context');
        }
        
        thumbnailCanvas.width = thumbnailViewport.width;
        thumbnailCanvas.height = thumbnailViewport.height;
        
        await page.render({
          canvasContext: thumbnailContext,
          viewport: thumbnailViewport
        }).promise;
        
        // Render full-size
        const fullCanvas = document.createElement('canvas');
        const fullContext = fullCanvas.getContext('2d');
        if (!fullContext) {
          throw new Error('Failed to get full canvas context');
        }
        
        fullCanvas.width = fullViewport.width;
        fullCanvas.height = fullViewport.height;
        
        await page.render({
          canvasContext: fullContext,
          viewport: fullViewport
        }).promise;
        
        // Convert to blobs
        const thumbnailBlob = await new Promise<Blob>((resolve, reject) => {
          thumbnailCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          }, 'image/jpeg', 0.8);
        });
        
        const fullPageBlob = await new Promise<Blob>((resolve, reject) => {
          fullCanvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create full page blob'));
            }
          }, 'image/jpeg', 0.9);
        });
        
        pages.push({
          pageNumber: pageNum,
          thumbnailBlob,
          fullPageBlob
        });
        
        console.log(`Page ${pageNum} processed successfully`);
      }
      
      console.log('All pages processed successfully');
      return pages;
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  static async uploadToStorage(blob: Blob, path: string): Promise<string> {
    try {
      console.log('Uploading to storage:', path);
      
      const { data, error } = await supabase.storage
        .from('pdf-documents')
        .upload(path, blob, {
          contentType: blob.type || 'application/octet-stream',
          upsert: true
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }
      
      const { data: urlData } = supabase.storage
        .from('pdf-documents')
        .getPublicUrl(path);
      
      console.log('Upload successful, URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading to storage:', error);
      throw new Error(`Failed to upload to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  static async deleteFromStorage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('pdf-documents')
        .remove([path]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting from storage:', error);
      throw new Error(`Failed to delete from storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
