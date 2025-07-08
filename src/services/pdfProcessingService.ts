
export interface ProcessedPage {
  id: string;
  pageNumber: number;
  thumbnailUrl: string;
  fullPageUrl: string;
  batchId: string;
  status: 'unassigned' | 'assigned';
}

export interface ProcessedBatch {
  id: string;
  filename: string;
  totalPages: number;
  pages: ProcessedPage[];
}

export class PDFProcessingService {
  static async processPDF(file: File): Promise<ProcessedBatch> {
    console.log('🔄 Starting server-side PDF processing for:', file.name);
    
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

      // Send to backend for processing
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/functions/v1/process-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'PDF processing failed on server');
      }

      const result = await response.json();
      
      console.log(`✅ PDF processed successfully: ${result.pages.length} pages`);
      
      return {
        id: result.batch_id,
        filename: file.name,
        totalPages: result.pages.length,
        pages: result.pages.map((page: any) => ({
          id: page.id,
          pageNumber: page.page_number,
          thumbnailUrl: page.thumbnail_url,
          fullPageUrl: page.full_page_url,
          batchId: result.batch_id,
          status: page.status
        }))
      };
      
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      
      if (error instanceof Error) {
        throw new Error(`PDF processing failed: ${error.message}`);
      }
      
      throw new Error('PDF processing failed: Unknown error occurred');
    }
  }

  static async getProcessedPages(): Promise<ProcessedPage[]> {
    try {
      const response = await fetch('/api/pdf-pages');
      if (!response.ok) {
        throw new Error('Failed to fetch processed pages');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      return [];
    }
  }

  static async assignPagesToVehicle(pageIds: string[], vehicleId: string): Promise<void> {
    try {
      const response = await fetch('/api/assign-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageIds,
          vehicleId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign pages to vehicle');
      }
    } catch (error) {
      console.error('Failed to assign pages:', error);
      throw error;
    }
  }
}
