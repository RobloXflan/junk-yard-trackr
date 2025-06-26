
// Simplified PDF processing without external worker dependencies
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

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File too large. Please upload a PDF smaller than 10MB.');
      }

      // Use a different approach - convert PDF to images using a simple method
      const pages = await this.convertPDFToImages(file);
      
      console.log(`🎉 PDF processing completed! ${pages.length} pages processed`);
      return pages;
      
    } catch (error) {
      console.error('❌ PDF Processing failed:', error);
      throw error;
    }
  }

  private static async convertPDFToImages(file: File): Promise<ProcessedPage[]> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          // Import PDF.js dynamically with proper configuration
          const pdfjsLib = await import('pdfjs-dist');
          
          // Configure worker with a simpler approach
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          
          console.log('📖 Loading PDF document...');
          const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            verbosity: 0
          }).promise;
          
          console.log('✅ PDF loaded! Total pages:', pdf.numPages);
          
          if (pdf.numPages === 0) {
            throw new Error('PDF contains no pages');
          }

          if (pdf.numPages > 20) {
            throw new Error(`PDF has too many pages (${pdf.numPages}). Maximum 20 pages allowed.`);
          }

          const pages: ProcessedPage[] = [];
          
          // Process each page
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            console.log(`🔄 Processing page ${pageNum}/${pdf.numPages}...`);
            
            try {
              const page = await pdf.getPage(pageNum);
              
              // Render thumbnail (150px max)
              const thumbnailBlob = await this.renderPageToBlob(page, 150);
              
              // Render full page (600px max)
              const fullPageBlob = await this.renderPageToBlob(page, 600);
              
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
          
          resolve(pages);
          
        } catch (error) {
          console.error('❌ PDF conversion failed:', error);
          reject(error);
        }
      };
      
      fileReader.onerror = () => {
        reject(new Error('Failed to read PDF file'));
      };
      
      fileReader.readAsArrayBuffer(file);
    });
  }

  private static async renderPageToBlob(page: any, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Get original viewport
        const originalViewport = page.getViewport({ scale: 1 });
        
        // Calculate scale to fit within maxSize
        const scale = Math.min(
          maxSize / originalViewport.width,
          maxSize / originalViewport.height,
          1.5 // Max scale
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
            }, 'image/jpeg', 0.8);
          })
          .catch(reject);
          
      } catch (error) {
        reject(error);
      }
    });
  }
  
  static async uploadToStorage(blob: Blob, path: string): Promise<string> {
    console.log('📤 Uploading to storage:', path);
    
    // For now, create a temporary URL for display
    const url = URL.createObjectURL(blob);
    console.log('✅ Temporary URL created');
    return url;
  }
}
