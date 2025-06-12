
import Tesseract from 'tesseract.js';

export interface ExtractedVehicleData {
  vin?: string;
  licensePlate?: string;
  year?: string;
  make?: string;
  model?: string;
  confidence: {
    vin?: number;
    licensePlate?: number;
    year?: number;
    make?: number;
    model?: number;
  };
}

// Common vehicle manufacturers for pattern matching
const VEHICLE_MAKES = [
  'HONDA', 'TOYOTA', 'FORD', 'CHEVROLET', 'CHEVY', 'NISSAN', 'BMW', 'MERCEDES',
  'AUDI', 'VOLKSWAGEN', 'VW', 'HYUNDAI', 'KIA', 'MAZDA', 'SUBARU', 'LEXUS',
  'ACURA', 'INFINITI', 'CADILLAC', 'BUICK', 'GMC', 'JEEP', 'DODGE', 'RAM',
  'CHRYSLER', 'LINCOLN', 'MERCURY', 'PONTIAC', 'OLDSMOBILE', 'SATURN',
  'MITSUBISHI', 'SUZUKI', 'ISUZU', 'VOLVO', 'SAAB', 'PORSCHE', 'TESLA',
  'FIAT', 'ALFA ROMEO', 'MASERATI', 'FERRARI', 'LAMBORGHINI', 'BENTLEY',
  'ROLLS ROYCE', 'JAGUAR', 'LAND ROVER', 'MINI', 'SMART'
];

export class OCRService {
  private static instance: OCRService;
  
  private constructor() {}
  
  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async extractVehicleData(file: File): Promise<ExtractedVehicleData> {
    try {
      console.log('Starting OCR processing for file:', file.name);
      
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const text = result.data.text.toUpperCase();
      console.log('Extracted text:', text);

      const extractedData: ExtractedVehicleData = {
        confidence: {}
      };

      // Extract VIN (17 characters, alphanumeric, no I, O, Q)
      const vinMatch = text.match(/\b[A-HJ-NPR-Z0-9]{17}\b/g);
      if (vinMatch) {
        extractedData.vin = vinMatch[0];
        extractedData.confidence.vin = 0.9;
      }

      // Extract license plate (various patterns)
      const platePatterns = [
        /\b[A-Z0-9]{2,3}[-\s]?[A-Z0-9]{3,4}\b/g, // Standard format like ABC-1234
        /\b[0-9]{3}[-\s]?[A-Z]{3}\b/g, // Number-letter format like 123-ABC
        /\b[A-Z]{3}[-\s]?[0-9]{3,4}\b/g, // Letter-number format like ABC-123
      ];
      
      for (const pattern of platePatterns) {
        const plateMatch = text.match(pattern);
        if (plateMatch) {
          extractedData.licensePlate = plateMatch[0].replace(/[-\s]/g, '');
          extractedData.confidence.licensePlate = 0.8;
          break;
        }
      }

      // Extract year (1900-2030)
      const yearMatch = text.match(/\b(19[0-9]{2}|20[0-2][0-9]|2030)\b/g);
      if (yearMatch) {
        // Get the most recent year found
        const years = yearMatch.map(y => parseInt(y)).sort((a, b) => b - a);
        extractedData.year = years[0].toString();
        extractedData.confidence.year = 0.85;
      }

      // Extract make
      for (const make of VEHICLE_MAKES) {
        if (text.includes(make)) {
          extractedData.make = this.formatMakeName(make);
          extractedData.confidence.make = 0.7;
          break;
        }
      }

      // Extract model (look for common patterns near the make)
      if (extractedData.make) {
        const makeIndex = text.indexOf(extractedData.make.toUpperCase());
        if (makeIndex !== -1) {
          // Look for words after the make
          const afterMake = text.substring(makeIndex + extractedData.make.length);
          const modelMatch = afterMake.match(/\s+([A-Z][A-Z0-9\s]{1,15})/);
          if (modelMatch) {
            const potentialModel = modelMatch[1].trim();
            // Filter out common non-model words
            const excludeWords = ['MOTOR', 'COMPANY', 'CORP', 'INC', 'LLC', 'VEHICLE', 'AUTO'];
            if (!excludeWords.some(word => potentialModel.includes(word))) {
              extractedData.model = this.formatModelName(potentialModel);
              extractedData.confidence.model = 0.6;
            }
          }
        }
      }

      console.log('Extracted vehicle data:', extractedData);
      return extractedData;

    } catch (error) {
      console.error('OCR processing error:', error);
      return { confidence: {} };
    }
  }

  private formatMakeName(make: string): string {
    const formatted = make.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    // Handle special cases
    if (formatted === 'Vw') return 'Volkswagen';
    if (formatted === 'Chevy') return 'Chevrolet';
    return formatted;
  }

  private formatModelName(model: string): string {
    return model.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).trim();
  }
}
