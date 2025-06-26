
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Simple, direct worker setup
console.log('Setting up PDF.js worker...');
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
console.log('PDF.js worker configured with version:', pdfjsLib.version);

export interface ProcessedPage {
  pageNumber: number;
  thumbnailBlob: Blob;
  fullPageBlob: Blob;
}

export class PDFProcessingService {
  static async processPDF(file: File): Promise<ProcessedPage[]> {
    console.log('=== PDF Processing Started ===');
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Basic validation
    if (!file || file.size === 0) {
      throw new Error('No file provided or file is empty');
    }

    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please upload a PDF file.');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File too large. Please upload a PDF smaller than 50MB.');
    }

    try {
      // Convert file to array buffer
      console.log('Converting file to ArrayBuffer...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);

      // Load PDF document with minimal config
      console.log('Loading PDF document...');
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 1 // Show more logs for debugging
      });

      const pdf = await loadingTask.promise;
      console.log('PDF loaded successfully! Pages:', pdf.numPages);

      if (pdf.numPages === 0) {
        throw new Error('PDF contains no pages');
      }

      if (pdf.numPages > 100) {
        throw new Error(`PDF has too many pages (${pdf.numPages}). Maximum 100 pages allowed.`);
      }

      const pages: ProcessedPage[] = [];
      
      // Process pages one by one
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`Processing page ${pageNum}/${pdf.numPages}...`);
        
        try {
          const page = await pdf.getPage(pageNum);
          console.log(`Got page ${pageNum}, rendering...`);
          
          // Get viewport
          const viewport = page.getViewport({ scale: 1 });
          
          // Calculate scales
          const thumbnailScale = Math.min(200 / viewport.width, 200 / viewport.height, 1);
          const fullScale = Math.min(800 / viewport.width, 800 / viewport.height, 2);
          
          // Render both versions
          const [thumbnailBlob, fullPageBlob] = await Promise.all([
            this.renderPage(page, thumbnailScale),
            this.renderPage(page, fullScale)
          ]);
          
          pages.push({
            pageNumber: pageNum,
            thumbnailBlob,
            fullPageBlob
          });
          
          console.log(`Page ${pageNum} processed successfully`);
          
        } catch (pageError) {
          console.error(`Failed to process page ${pageNum}:`, pageError);
          // Continue with other pages instead of failing completely
        }
      }
      
      if (pages.length === 0) {
        throw new Error('No pages could be processed successfully');
      }
      
      console.log(`=== PDF Processing Completed ===`);
      console.log(`Successfully processed ${pages.length} of ${pdf.numPages} pages`);
      return pages;
      
    } catch (error) {
      console.error('=== PDF Processing Failed ===');
      console.error('Error:', error);
      throw error;
    }
  }

  private static async renderPage(page: pdfjsLib.PDFPageProxy, scale: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Set white background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render page
        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        });
        
        renderTask.promise
          .then(() => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            }, 'image/jpeg', 0.8);
          })
          .catch(reject);
          
      } catch (error) {
        reject(error);
      }
    });
  }
  
  static async uploadToStorage(blob: Blob, path: string): Promise<string> {
    console.log('Uploading to storage:', path);
    
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    const { data, error } = await supabase.storage
      .from('pdf-documents')
      .upload(cleanPath, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }
    
    const { data: urlData } = supabase.storage
      .from('pdf-documents')
      .getPublicUrl(cleanPath);
    
    return urlData.publicUrl;
  }
  
  static async deleteFromStorage(path: string): Promise<void> {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    const { error } = await supabase.storage
      .from('pdf-documents')
      .remove([cleanPath]);
    
    if (error) {
      console.error('Storage deletion error:', error);
      throw error;
    }
  }
}
