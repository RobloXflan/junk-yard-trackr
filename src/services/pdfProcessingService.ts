
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js to use the local worker
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

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File too large. Please upload a PDF smaller than 50MB.');
      }

      const arrayBuffer = await file.arrayBuffer();
      console.log('📖 Loading PDF document...');
      
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        disableWorker: false
      }).promise;
      
      console.log('✅ PDF loaded! Total pages:', pdf.numPages);
      
      if (pdf.numPages === 0) {
        throw new Error('PDF contains no pages');
      }

      if (pdf.numPages > 50) {
        throw new Error(`PDF has too many pages (${pdf.numPages}). Maximum 50 pages allowed.`);
      }

      const pages: ProcessedPage[] = [];
      
      // Process each page sequentially to avoid memory issues
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`🔄 Processing page ${pageNum}/${pdf.numPages}...`);
        
        try {
          const page = await pdf.getPage(pageNum);
          
          // Create thumbnail (200px max dimension)
          const thumbnailBlob = await this.renderPageToBlob(page, 200);
          
          // Create full page (800px max dimension)
          const fullPageBlob = await this.renderPageToBlob(page, 800);
          
          pages.push({
            pageNumber: pageNum,
            thumbnailBlob,
            fullPageBlob
          });
          
          console.log(`✅ Page ${pageNum} processed successfully`);
          
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
      throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                reject(new Error('Failed to create blob from canvas'));
              }
            }, 'image/jpeg', 0.85);
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
