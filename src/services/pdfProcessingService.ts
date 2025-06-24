
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
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: ProcessedPage[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Create thumbnail (150px width)
      const thumbnailScale = 150 / page.getViewport({ scale: 1 }).width;
      const thumbnailViewport = page.getViewport({ scale: thumbnailScale });
      
      // Create full-size image (800px width)
      const fullScale = 800 / page.getViewport({ scale: 1 }).width;
      const fullViewport = page.getViewport({ scale: fullScale });
      
      // Render thumbnail
      const thumbnailCanvas = document.createElement('canvas');
      const thumbnailContext = thumbnailCanvas.getContext('2d')!;
      thumbnailCanvas.width = thumbnailViewport.width;
      thumbnailCanvas.height = thumbnailViewport.height;
      
      await page.render({
        canvasContext: thumbnailContext,
        viewport: thumbnailViewport
      }).promise;
      
      // Render full-size
      const fullCanvas = document.createElement('canvas');
      const fullContext = fullCanvas.getContext('2d')!;
      fullCanvas.width = fullViewport.width;
      fullCanvas.height = fullViewport.height;
      
      await page.render({
        canvasContext: fullContext,
        viewport: fullViewport
      }).promise;
      
      // Convert to blobs
      const thumbnailBlob = await new Promise<Blob>((resolve) => {
        thumbnailCanvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      });
      
      const fullPageBlob = await new Promise<Blob>((resolve) => {
        fullCanvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
      });
      
      pages.push({
        pageNumber: pageNum,
        thumbnailBlob,
        fullPageBlob
      });
    }
    
    return pages;
  }
  
  static async uploadToStorage(blob: Blob, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('pdf-documents')
      .upload(path, blob, {
        contentType: blob.type,
        upsert: true
      });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('pdf-documents')
      .getPublicUrl(path);
    
    return urlData.publicUrl;
  }
  
  static async deleteFromStorage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('pdf-documents')
      .remove([path]);
    
    if (error) throw error;
  }
}
