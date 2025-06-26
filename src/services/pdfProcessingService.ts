
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/integrations/supabase/client';

// Configure PDF.js worker with a simpler approach
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface ProcessedPage {
  pageNumber: number;
  thumbnailBlob: Blob;
  fullPageBlob: Blob;
}

export class PDFProcessingService {
  static async processPDF(file: File): Promise<ProcessedPage[]> {
    console.log('🔄 Starting PDF processing for:', file.name);
    
    try {
      // Basic validation
      if (!file || file.size === 0) {
        throw new Error('No file provided or file is empty');
      }

      if (file.type !== 'application/pdf') {
        throw new Error('Invalid file type. Please upload a PDF file.');
      }

      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        throw new Error('File too large. Please upload a PDF smaller than 20MB.');
      }

      // Convert file to array buffer
      console.log('📄 Converting file to ArrayBuffer...');
      const arrayBuffer = await file.arrayBuffer();
      console.log('✅ ArrayBuffer created, size:', arrayBuffer.byteLength);

      // Load PDF document
      console.log('📖 Loading PDF document...');
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        disableAutoFetch: true,
        disableStream: true
      });

      const pdf = await loadingTask.promise;
      console.log('✅ PDF loaded! Total pages:', pdf.numPages);

      if (pdf.numPages === 0) {
        throw new Error('PDF contains no pages');
      }

      if (pdf.numPages > 50) {
        throw new Error(`PDF has too many pages (${pdf.numPages}). Maximum 50 pages allowed.`);
      }

      const pages: ProcessedPage[] = [];
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`🔄 Processing page ${pageNum}/${pdf.numPages}...`);
        
        try {
          const page = await pdf.getPage(pageNum);
          
          // Render thumbnail (200px max)
          const thumbnailBlob = await this.renderPageToBlob(page, 200);
          
          // Render full page (800px max)
          const fullPageBlob = await this.renderPageToBlob(page, 800);
          
          pages.push({
            pageNumber: pageNum,
            thumbnailBlob,
            fullPageBlob
          });
          
          console.log(`✅ Page ${pageNum} processed successfully`);
          
        } catch (pageError) {
          console.error(`❌ Failed to process page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }
      
      if (pages.length === 0) {
        throw new Error('No pages could be processed successfully');
      }
      
      console.log(`🎉 PDF processing completed! ${pages.length} pages processed`);
      return pages;
      
    } catch (error) {
      console.error('❌ PDF Processing failed:', error);
      throw error;
    }
  }

  private static async renderPageToBlob(page: pdfjsLib.PDFPageProxy, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Get original viewport
        const originalViewport = page.getViewport({ scale: 1 });
        
        // Calculate scale to fit within maxSize
        const scale = Math.min(
          maxSize / originalViewport.width,
          maxSize / originalViewport.height,
          2 // Max scale of 2x
        );
        
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
            }, 'image/jpeg', 0.85);
          })
          .catch(reject);
          
      } catch (error) {
        reject(error);
      }
    });
  }
  
  static async uploadToStorage(blob: Blob, path: string): Promise<string> {
    console.log('📤 Uploading to storage:', path);
    
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    const { data, error } = await supabase.storage
      .from('pdf-documents')
      .upload(cleanPath, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('❌ Storage upload error:', error);
      throw error;
    }
    
    const { data: urlData } = supabase.storage
      .from('pdf-documents')
      .getPublicUrl(cleanPath);
    
    console.log('✅ File uploaded successfully');
    return urlData.publicUrl;
  }
}
