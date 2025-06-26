import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Simple local worker setup - no external dependencies
const setupWorker = () => {
  console.log('Setting up PDF.js worker with local fallback...');
  
  // Use local worker file directly
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  console.log('PDF.js worker configured to use local worker');
};

// Initialize worker setup immediately
setupWorker();

export interface ProcessedPage {
  pageNumber: number;
  thumbnailBlob: Blob;
  fullPageBlob: Blob;
}

export class PDFProcessingService {
  static async processPDF(file: File): Promise<ProcessedPage[]> {
    console.log('=== PDF Processing Started ===');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    // Enhanced file validation
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size === 0) {
      throw new Error('File is empty');
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('Invalid file type. Please upload a PDF file.');
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      throw new Error('File too large. Please upload a PDF smaller than 100MB.');
    }

    try {
      // Ensure worker is set up
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        console.log('Worker not set up, configuring...');
        setupWorker();
      }

      // Convert file to array buffer
      console.log('Converting file to ArrayBuffer...');
      const arrayBuffer = await this.fileToArrayBuffer(file);
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);

      // Validate the ArrayBuffer contains PDF data
      const uint8Array = new Uint8Array(arrayBuffer);
      if (uint8Array.length < 4) {
        throw new Error('File is too small to be a valid PDF');
      }

      // Check PDF header
      const header = String.fromCharCode(...uint8Array.slice(0, 4));
      if (header !== '%PDF') {
        console.warn('PDF header not found, attempting to process anyway...');
      }

      // Load PDF document
      console.log('Loading PDF document...');
      const pdf = await this.loadPDFDocument(arrayBuffer);
      console.log('PDF loaded successfully:', {
        numPages: pdf.numPages,
        fingerprints: pdf.fingerprints
      });

      if (pdf.numPages === 0) {
        throw new Error('PDF contains no pages');
      }

      if (pdf.numPages > 200) {
        throw new Error(`PDF has too many pages (${pdf.numPages}). Maximum 200 pages allowed.`);
      }

      const pages: ProcessedPage[] = [];
      console.log(`Processing ${pdf.numPages} pages...`);
      
      // Process pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`Processing page ${pageNum}/${pdf.numPages}...`);
          const processedPage = await this.processPage(pdf, pageNum);
          pages.push(processedPage);
          console.log(`Page ${pageNum} processed successfully`);
        } catch (pageError) {
          console.error(`Failed to process page ${pageNum}:`, pageError);
          continue;
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
      console.error('Error details:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('An unexpected error occurred while processing the PDF.');
    }
  }

  private static async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error: ' + reader.error?.message));
      };
      
      reader.onabort = () => {
        reject(new Error('File reading was aborted'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  private static async loadPDFDocument(arrayBuffer: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0,
      useSystemFonts: true,
      disableAutoFetch: false,
      disableStream: false,
      disableRange: false,
      maxImageSize: 16777216, // 16MB max image size
      isEvalSupported: false,
      disableFontFace: false
    });

    return loadingTask.promise;
  }

  private static async processPage(pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<ProcessedPage> {
    const page = await pdf.getPage(pageNum);
    
    // Get the original viewport
    const originalViewport = page.getViewport({ scale: 1 });
    console.log(`Page ${pageNum} dimensions: ${originalViewport.width}x${originalViewport.height}`);
    
    // Calculate optimal scales
    const maxThumbnailSize = 200;
    const maxFullSize = 1200;
    
    const thumbnailScale = Math.min(
      maxThumbnailSize / originalViewport.width, 
      maxThumbnailSize / originalViewport.height,
      2 // Cap at 2x scale
    );
    
    const fullScale = Math.min(
      maxFullSize / originalViewport.width, 
      maxFullSize / originalViewport.height,
      3 // Cap at 3x scale
    );
    
    const thumbnailViewport = page.getViewport({ scale: thumbnailScale });
    const fullViewport = page.getViewport({ scale: fullScale });
    
    console.log(`Page ${pageNum} scales - thumbnail: ${thumbnailScale.toFixed(2)}, full: ${fullScale.toFixed(2)}`);
    
    // Render both images in parallel for better performance
    const [thumbnailBlob, fullPageBlob] = await Promise.all([
      this.renderPageToBlob(page, thumbnailViewport, 0.8, 'thumbnail'),
      this.renderPageToBlob(page, fullViewport, 0.9, 'full')
    ]);
    
    return {
      pageNumber: pageNum,
      thumbnailBlob,
      fullPageBlob
    };
  }
  
  private static async renderPageToBlob(
    page: pdfjsLib.PDFPageProxy, 
    viewport: pdfjsLib.PageViewport, 
    quality: number,
    type: 'thumbnail' | 'full'
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Rendering timeout for ${type} image`));
      }, 30000); // 30 second timeout

      try {
        // Create canvas with proper dimensions
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { 
          alpha: false,
          willReadFrequently: false 
        });
        
        if (!context) {
          clearTimeout(timeoutId);
          reject(new Error('Failed to get 2D rendering context'));
          return;
        }
        
        // Set canvas size
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        
        // Set white background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Configure rendering context
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        
        // Render the page
        const renderTask = page.render({
          canvasContext: context,
          viewport: viewport,
          background: 'white'
        });
        
        renderTask.promise
          .then(() => {
            clearTimeout(timeoutId);
            
            // Convert to blob with error handling
            canvas.toBlob(
              (blob) => {
                if (blob && blob.size > 0) {
                  console.log(`${type} blob created: ${blob.size} bytes`);
                  resolve(blob);
                } else {
                  reject(new Error(`Failed to create ${type} blob or blob is empty`));
                }
              },
              'image/jpeg',
              quality
            );
          })
          .catch((renderError) => {
            clearTimeout(timeoutId);
            console.error(`Render error for ${type}:`, renderError);
            reject(new Error(`Failed to render ${type}: ${renderError.message}`));
          });
          
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Canvas error for ${type}:`, error);
        reject(new Error(`Canvas creation failed for ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }
  
  static async uploadToStorage(blob: Blob, path: string): Promise<string> {
    if (!blob || blob.size === 0) {
      throw new Error('Invalid blob for upload - blob is empty or null');
    }
    
    try {
      console.log('Uploading to storage:', path, 'Size:', blob.size, 'Type:', blob.type);
      
      // Clean the path
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
