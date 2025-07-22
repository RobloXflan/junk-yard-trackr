
export interface ExtractedVehicleData {
  vehicleId: string; // Last 5 digits of VIN
  year: string;
  make: string;
  model: string;
  licensePlate: string;
  confidence: {
    vehicleId: number;
    year: number;
    make: number;
    model: number;
    licensePlate: number;
  };
  documentImage?: string; // Base64 or URL of processed image
}

export class DocumentVisionService {
  static async extractVehicleData(imageBase64: string): Promise<ExtractedVehicleData> {
    try {
      console.log('🔍 Starting GPT-4 Vision extraction for vehicle document');
      
      const response = await fetch('/functions/v1/vehicle-document-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Vehicle data extraction failed');
      }

      const result = await response.json();
      console.log('✅ Vehicle data extracted successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Document vision extraction failed:', error);
      throw new Error(`Vehicle data extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async processDocumentToImage(file: File): Promise<string> {
    try {
      console.log('📄 Converting document to image:', file.name);
      
      if (file.type === 'application/pdf') {
        // For PDFs, use the existing PDF processing service to get first page
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/functions/v1/pdf-operations', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('PDF processing failed');
        }

        const result = await response.json();
        
        // Return the first page full image URL or thumbnail
        if (result.pages && result.pages.length > 0) {
          return result.pages[0].full_page_url || result.pages[0].thumbnail_url;
        }
        
        throw new Error('No pages found in PDF');
      } else if (file.type.startsWith('image/')) {
        // For images, convert to base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image file'));
          reader.readAsDataURL(file);
        });
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or image file.');
      }
    } catch (error) {
      console.error('❌ Document to image conversion failed:', error);
      throw error;
    }
  }
}
