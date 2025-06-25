
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Set up PDF.js worker with better error handling
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
} catch (error) {
  console.error('Failed to set PDF.js worker:', error);
  // Fallback worker URL
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export interface ProcessedPage {
  pageNumber: number;
  thumbnailBlob: Blob;
  fullPageBlob: Blob;
}

export class PDFProcessingService {
  static async processPDF(file: File): Promise<ProcessedPage[]> {
    console.log('Starting PDF processing for:', file.name, 'Size:', file.size, 'bytes');
    
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please upload a PDF file.');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File too large. Please upload a PDF smaller than 50MB.');
    }

    try {
      // Convert file to array buffer with better error handling
      let arrayBuffer: ArrayBuffer;
      try {
        arrayBuffer = await file.arrayBuffer();
        console.log('File converted to ArrayBuffer, size:', arrayBuffer.byteLength);
      } catch (error) {
        console.error('Failed to read file:', error);
        throw new Error('Failed to read PDF file. The file may be corrupted.');
      }

      // Load PDF document
      let pdf: pdfjsLib.PDFDocumentProxy;
      try {
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: 0 // Reduce console spam
        });
        pdf = await loadingTask.promise;
        console.log('PDF loaded successfully, pages:', pdf.numPages);
      } catch (error) {
        console.error('Failed to load PDF:', error);
        throw new Error('Failed to load PDF. The file may be corrupted or password-protected.');
      }

      if (pdf.numPages === 0) {
        throw new Error('PDF has no pages to process.');
      }

      if (pdf.numPages > 100) {
        throw new Error('PDF has too many pages. Maximum 100 pages allowed.');
      }

      const pages: ProcessedPage[] = [];
      
      // Process each page with individual error handling
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`Processing page ${pageNum} of ${pdf.numPages}...`);
          
          const page = await pdf.getPage(pageNum);
          const originalViewport = page.getViewport({ scale: 1 });
          
          console.log(`Page ${pageNum} dimensions: ${originalViewport.width}x${originalViewport.height}`);
          
          // Calculate scales for thumbnail and full image
          const thumbnailScale = Math.min(150 / originalViewport.width, 150 / originalViewport.height);
          const fullScale = Math.min(800 / originalViewport.width, 800 / originalViewport.height);
          
          const thumbnailViewport = page.getViewport({ scale: thumbnailScale });
          const fullViewport = page.getViewport({ scale: fullScale });
          
          // Create and render thumbnail
          const thumbnailBlob = await this.renderPageToBlob(page, thumbnailViewport, 0.7);
          console.log(`Page ${pageNum} thumbnail created, size:`, thumbnailBlob.size);
          
          // Create and render full-size image
          const fullPageBlob = await this.renderPageToBlob(page, fullViewport, 0.85);
          console.log(`Page ${pageNum} full image created, size:`, fullPageBlob.size);
          
          pages.push({
            pageNumber: pageNum,
            thumbnailBlob,
            fullPageBlob
          });
          
          console.log(`Page ${pageNum} processed successfully`);
          
        } catch (pageError) {
          console.error(`Failed to process page ${pageNum}:`, pageError);
          // Continue with next page instead of failing completely
          continue;
        }
      }
      
      if (pages.length === 0) {
        throw new Error('No pages could be processed from the PDF.');
      }
      
      console.log(`PDF processing completed. Successfully processed ${pages.length} of ${pdf.numPages} pages.`);
      return pages;
      
    } catch (error) {
      console.error('PDF processing failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while processing the PDF.');
    }
  }
  
  private static async renderPageToBlob(
    page: pdfjsLib.PDFPageProxy, 
    viewport: pdfjsLib.PageViewport, 
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          reject(new Error('Failed to get canvas 2D context'));
          return;
        }
        
        // Set canvas dimensions
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        
        // Clear canvas with white background
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render page
        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport
        });
        
        renderTask.promise
          .then(() => {
            // Convert canvas to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Failed to create blob from canvas'));
                }
              },
              'image/jpeg',
              quality
            );
          })
          .catch((renderError) => {
            console.error('Render error:', renderError);
            reject(new Error(`Failed to render page: ${renderError.message}`));
          });
          
      } catch (error) {
        console.error('Canvas creation error:', error);
        reject(new Error(`Failed to create canvas: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }
  
  static async uploadToStorage(blob: Blob, path: string): Promise<string> {
    if (!blob || blob.size === 0) {
      throw new Error('Invalid blob for upload');
    }
    
    try {
      console.log('Uploading to storage:', path, 'Size:', blob.size);
      
      // Ensure path doesn't start with slash
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      
      const { data, error } = await supabase.storage
        .from('pdf-documents')
        .upload(cleanPath, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: true,
          cacheControl: '3600'
        });
      
      if (error) {
        console.error('Storage upload error:', error);
        throw new Error(`Storage upload failed: ${error.message}`);
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pdf-documents')
        .getPublicUrl(cleanPath);
      
      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }
      
      console.log('Upload successful, URL:', urlData.publicUrl);
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error uploading to storage:', error);
      throw new Error(`Failed to upload to storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  static async deleteFromStorage(path: string): Promise<void> {
    if (!path) {
      console.warn('Empty path provided for deletion');
      return;
    }
    
    try {
      // Clean the path
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      
      console.log('Deleting from storage:', cleanPath);
      
      const { error } = await supabase.storage
        .from('pdf-documents')
        .remove([cleanPath]);
      
      if (error) {
        console.error('Storage deletion error:', error);
        throw new Error(`Storage deletion failed: ${error.message}`);
      }
      
      console.log('File deleted successfully:', cleanPath);
      
    } catch (error) {
      console.error('Error deleting from storage:', error);
      throw new Error(`Failed to delete from storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
