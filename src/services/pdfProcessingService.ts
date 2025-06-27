
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with fallback options
try {
  // Try to use local worker first
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} catch (error) {
  console.warn('Failed to set local worker, falling back to CDN:', error);
  // Fallback to CDN worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';
}

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

      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('File too large. Please upload a PDF smaller than 100MB.');
      }

      const arrayBuffer = await file.arrayBuffer();
      console.log('📖 Loading PDF document...');
      
      // Enhanced PDF loading with proper configuration
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        // Disable font face to avoid potential issues
        disableFontFace: true,
        // Use system fonts for better compatibility
        useSystemFonts: true
      });
      
      const pdf = await loadingTask.promise;
      console.log('✅ PDF loaded! Total pages:', pdf.numPages);
      
      if (pdf.numPages === 0) {
        throw new Error('PDF contains no pages');
      }

      if (pdf.numPages > 100) {
        throw new Error(`PDF has too many pages (${pdf.numPages}). Maximum 100 pages allowed.`);
      }

      const pages: ProcessedPage[] = [];
      
      // Process each page sequentially to avoid memory issues
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`🔄 Processing page ${pageNum}/${pdf.numPages}...`);
        
        try {
          const page = await pdf.getPage(pageNum);
          
          // Create thumbnail (300px max dimension for better quality)
          const thumbnailBlob = await this.renderPageToBlob(page, 300);
          
          // Create full page (1200px max dimension)
          const fullPageBlob = await this.renderPageToBlob(page, 1200);
          
          pages.push({
            pageNumber: pageNum,
            thumbnailBlob,
            fullPageBlob
          });
          
          console.log(`✅ Page ${pageNum} processed successfully`);
          
          // Add small delay to prevent overwhelming the browser
          if (pageNum % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
        } catch (pageError) {
          console.error(`❌ Failed to process page ${pageNum}:`, pageError);
          // Continue with other pages instead of failing completely
        }
      }
      
      if (pages.length === 0) {
        throw new Error('No pages could be processed successfully');
      }
      
      console.log(`🎉 PDF processing completed! ${pages.length} pages processed out of ${pdf.numPages}`);
      return pages;
      
    } catch (error) {
      console.error('❌ PDF Processing failed:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Setting up fake worker failed')) {
          throw new Error('PDF worker setup failed. Please try refreshing the page and uploading again.');
        } else if (error.message.includes('Invalid PDF structure')) {
          throw new Error('The PDF file appears to be corrupted or invalid. Please try a different PDF file.');
        } else if (error.message.includes('Password')) {
          throw new Error('This PDF is password protected. Please provide an unprotected PDF file.');
        }
        throw new Error(`PDF processing failed: ${error.message}`);
      }
      
      throw new Error('PDF processing failed: Unknown error occurred');
    }
  }

  private static async renderPageToBlob(page: any, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Get original viewport
        const originalViewport = page.getViewport({ scale: 1 });
        
        // Calculate scale to fit within maxSize while maintaining aspect ratio
        const scale = Math.min(
          maxSize / originalViewport.width,
          maxSize / originalViewport.height
        );
        
        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        
        // Set white background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Enhanced render options
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          // Enable text layer for better quality
          textLayer: null,
          // Optimize for quality
          intent: 'display'
        };
        
        // Render page
        const renderTask = page.render(renderContext);
        
        renderTask.promise
          .then(() => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob from canvas'));
              }
            }, 'image/jpeg', 0.9); // Higher quality
          })
          .catch((error) => {
            console.error('Render task failed:', error);
            reject(error);
          });
          
      } catch (error) {
        console.error('Canvas rendering failed:', error);
        reject(error);
      }
    });
  }
}
