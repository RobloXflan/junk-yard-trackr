
import Tesseract from 'tesseract.js';

export interface ExtractedVehicleData {
  vehicleId?: string; // Changed from vin to vehicleId (last 5 digits)
  licensePlate?: string;
  year?: string;
  make?: string;
  model?: string;
  confidence: {
    vehicleId?: number; // Changed from vin to vehicleId
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

      // Enhanced VIN extraction - extract last 5 digits only
      const fullVin = this.extractFullVIN(text);
      if (fullVin) {
        extractedData.vehicleId = fullVin.slice(-5); // Get last 5 digits
        extractedData.confidence.vehicleId = 0.9;
        console.log('Full VIN found:', fullVin, 'Vehicle ID (last 5):', extractedData.vehicleId);
      }

      // Extract license plate (various patterns) - excluding common document words
      const platePatterns = [
        /\b[A-Z0-9]{2,3}[-\s]?[A-Z0-9]{3,4}\b/g, // Standard format like ABC-1234
        /\b[0-9]{3}[-\s]?[A-Z]{3}\b/g, // Number-letter format like 123-ABC
        /\b[A-Z]{3}[-\s]?[0-9]{3,4}\b/g, // Letter-number format like ABC-123
        /\b[0-9][A-Z]{3}[0-9]{3}\b/g, // Format like 4RZZ216
      ];
      
      const excludePlateWords = ['TITLE', 'CERTIFICATE', 'CALIFORNIA', 'VEHICLE', 'REGISTRATION', 'OWNER', 'ISSUED'];
      
      for (const pattern of platePatterns) {
        const plateMatches = text.match(pattern);
        if (plateMatches) {
          for (const match of plateMatches) {
            const cleanMatch = match.replace(/[-\s]/g, '');
            if (!excludePlateWords.some(word => cleanMatch.includes(word)) && cleanMatch.length >= 5) {
              extractedData.licensePlate = cleanMatch;
              extractedData.confidence.licensePlate = 0.8;
              console.log('License plate found:', cleanMatch);
              break;
            }
          }
          if (extractedData.licensePlate) break;
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

  private extractFullVIN(text: string): string | null {
    // Clean the text for better VIN detection
    const cleanedText = text.replace(/\s+/g, ' ').replace(/[-_]/g, '');
    
    console.log('Searching for VIN in cleaned text:', cleanedText);
    
    // Multiple VIN detection strategies
    const vinStrategies = [
      // Strategy 1: Look for 17 consecutive valid VIN characters (no spaces)
      /\b[A-HJ-NPR-Z0-9]{17}\b/g,
      
      // Strategy 2: Look for VIN with spaces/formatting, then clean it
      /[A-HJ-NPR-Z0-9][\s\-A-HJ-NPR-Z0-9]{15,20}[A-HJ-NPR-Z0-9]/g,
      
      // Strategy 3: More flexible pattern for spaced VINs
      /(?:[A-HJ-NPR-Z0-9]\s*){17}/g
    ];
    
    for (let i = 0; i < vinStrategies.length; i++) {
      const strategy = vinStrategies[i];
      const matches = cleanedText.match(strategy);
      
      if (matches) {
        console.log(`VIN Strategy ${i + 1} found matches:`, matches);
        
        for (const match of matches) {
          // Clean the match by removing all non-VIN characters
          const cleanVin = match.replace(/[^A-HJ-NPR-Z0-9]/g, '');
          
          // Validate VIN length and characters
          if (cleanVin.length === 17 && this.isValidVINPattern(cleanVin)) {
            console.log('Valid VIN found:', cleanVin);
            return cleanVin;
          }
        }
      }
    }
    
    console.log('No valid VIN found');
    return null;
  }

  private isValidVINPattern(vin: string): boolean {
    // Basic VIN validation - no I, O, Q characters and proper length
    if (vin.length !== 17) return false;
    if (/[IOQ]/.test(vin)) return false;
    
    // Avoid obvious false positives (too many repeated characters)
    const charCounts = {};
    for (const char of vin) {
      charCounts[char] = (charCounts[char] || 0) + 1;
      if (charCounts[char] > 3) return false; // No character should appear more than 3 times
    }
    
    return true;
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
