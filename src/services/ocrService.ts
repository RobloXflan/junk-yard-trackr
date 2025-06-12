import Tesseract from 'tesseract.js';

export interface ExtractedVehicleData {
  vehicleId?: string; // Last 5 digits of VIN
  licensePlate?: string;
  year?: string;
  make?: string;
  model?: string;
  confidence: {
    vehicleId?: number;
    licensePlate?: number;
    year?: number;
    make?: number;
    model?: number;
  };
}

// Enhanced vehicle manufacturers mapping for better recognition
const VEHICLE_MAKES = {
  'HYUN': 'HYUNDAI',
  'HYUNDAI': 'HYUNDAI',
  'HONDA': 'HONDA',
  'TOYOTA': 'TOYOTA',
  'FORD': 'FORD',
  'CHEVROLET': 'CHEVROLET',
  'CHEVY': 'CHEVROLET',
  'CHEV': 'CHEVROLET',
  'NISSAN': 'NISSAN',
  'BMW': 'BMW',
  'MERCEDES': 'MERCEDES',
  'BENZ': 'MERCEDES',
  'AUDI': 'AUDI',
  'VOLKSWAGEN': 'VOLKSWAGEN',
  'VW': 'VOLKSWAGEN',
  'VOLKS': 'VOLKSWAGEN',
  'KIA': 'KIA',
  'MAZDA': 'MAZDA',
  'SUBARU': 'SUBARU',
  'LEXUS': 'LEXUS',
  'ACURA': 'ACURA',
  'INFINITI': 'INFINITI',
  'CADILLAC': 'CADILLAC',
  'BUICK': 'BUICK',
  'GMC': 'GMC',
  'JEEP': 'JEEP',
  'DODGE': 'DODGE',
  'RAM': 'RAM',
  'CHRYSLER': 'CHRYSLER',
  'LINCOLN': 'LINCOLN',
  'MERCURY': 'MERCURY',
  'PONTIAC': 'PONTIAC',
  'OLDSMOBILE': 'OLDSMOBILE',
  'SATURN': 'SATURN',
  'MITSUBISHI': 'MITSUBISHI',
  'SUZUKI': 'SUZUKI',
  'ISUZU': 'ISUZU',
  'VOLVO': 'VOLVO',
  'SAAB': 'SAAB',
  'PORSCHE': 'PORSCHE',
  'TESLA': 'TESLA',
  'FIAT': 'FIAT'
};

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

      // Enhanced VIN extraction for title documents
      const fullVin = this.extractFullVIN(text);
      if (fullVin) {
        extractedData.vehicleId = fullVin.slice(-5); // Get last 5 digits
        extractedData.confidence.vehicleId = 0.95;
        console.log('Full VIN found:', fullVin, 'Vehicle ID (last 5):', extractedData.vehicleId);
      }

      // Enhanced license plate extraction for California titles
      extractedData.licensePlate = this.extractLicensePlate(text);
      if (extractedData.licensePlate) {
        extractedData.confidence.licensePlate = 0.9;
        console.log('License plate found:', extractedData.licensePlate);
      }

      // Enhanced year extraction for title documents
      extractedData.year = this.extractYear(text);
      if (extractedData.year) {
        extractedData.confidence.year = 0.9;
        console.log('Year found:', extractedData.year);
      }

      // Enhanced make extraction
      extractedData.make = this.extractMake(text);
      if (extractedData.make) {
        extractedData.confidence.make = 0.85;
        console.log('Make found:', extractedData.make);
      }

      // Enhanced model extraction
      if (extractedData.make) {
        extractedData.model = this.extractModel(text, extractedData.make);
        if (extractedData.model) {
          extractedData.confidence.model = 0.75;
          console.log('Model found:', extractedData.model);
        }
      }

      console.log('Final extracted vehicle data:', extractedData);
      return extractedData;

    } catch (error) {
      console.error('OCR processing error:', error);
      return { confidence: {} };
    }
  }

  private extractFullVIN(text: string): string | null {
    // Clean text for better VIN detection on titles
    const lines = text.split('\n');
    
    // Look for VIN patterns in title documents
    const vinPatterns = [
      // Pattern 1: 17 consecutive alphanumeric characters (standard VIN)
      /\b[A-HJ-NPR-Z0-9]{17}\b/g,
      
      // Pattern 2: VIN with spaces or dashes (common on titles)
      /[A-HJ-NPR-Z0-9][\s\-A-HJ-NPR-Z0-9]{15,25}[A-HJ-NPR-Z0-9]/g,
      
      // Pattern 3: Look specifically around "VIN" or "VEHICLE" keywords
      /(?:VIN|VEHICLE)[\s\:]*([A-HJ-NPR-Z0-9\s\-]{17,25})/gi,
      
      // Pattern 4: Look for patterns that start with common VIN prefixes
      /\b(?:KM|1[A-HJ-NPR-Z]|2[A-HJ-NPR-Z]|3[A-HJ-NPR-Z]|4[A-HJ-NPR-Z]|5[A-HJ-NPR-Z])[A-HJ-NPR-Z0-9\s\-]{14,22}\b/g
    ];

    for (let i = 0; i < vinPatterns.length; i++) {
      const pattern = vinPatterns[i];
      const matches = text.match(pattern);
      
      if (matches) {
        console.log(`VIN Pattern ${i + 1} found matches:`, matches);
        
        for (const match of matches) {
          // Clean the match
          const cleanVin = match.replace(/[^A-HJ-NPR-Z0-9]/g, '');
          
          if (cleanVin.length === 17 && this.isValidVINPattern(cleanVin)) {
            console.log('Valid VIN found:', cleanVin);
            return cleanVin;
          }
        }
      }
    }

    // Additional search in individual lines for title documents
    for (const line of lines) {
      const cleanLine = line.replace(/[^A-HJ-NPR-Z0-9\s]/g, '');
      const vinMatch = cleanLine.match(/[A-HJ-NPR-Z0-9]{17}/);
      if (vinMatch && this.isValidVINPattern(vinMatch[0])) {
        console.log('VIN found in line:', vinMatch[0]);
        return vinMatch[0];
      }
    }
    
    console.log('No valid VIN found');
    return null;
  }

  private extractLicensePlate(text: string): string | null {
    // California plate patterns and common formats
    const platePatterns = [
      // Standard CA format: 1ABC123, 1ABC1234
      /\b[0-9][A-Z]{3}[0-9]{3,4}\b/g,
      // Legacy format: ABC123
      /\b[A-Z]{3}[0-9]{3}\b/g,
      // New format: 8ABC123
      /\b[0-9][A-Z]{3}[0-9]{3}\b/g,
      // General alphanumeric patterns
      /\b[A-Z0-9]{6,8}\b/g
    ];
    
    const excludeWords = ['TITLE', 'CERTIFICATE', 'CALIFORNIA', 'VEHICLE', 'REGISTRATION', 'OWNER', 'ISSUED', 'NUMBER', 'KMHDCBAE'];
    
    // Look near "PLATE" keyword first
    const plateContext = text.match(/PLATE[\s\w]*?([A-Z0-9]{6,8})/i);
    if (plateContext && plateContext[1]) {
      const candidate = plateContext[1];
      if (!excludeWords.some(word => candidate.includes(word))) {
        return candidate;
      }
    }

    // Try each pattern
    for (const pattern of platePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (!excludeWords.some(word => match.includes(word)) && 
              match.length >= 6 && match.length <= 8 &&
              !match.match(/^[0-9]+$/) && // Not all numbers
              !match.match(/^[A-Z]+$/)) { // Not all letters
            return match;
          }
        }
      }
    }

    return null;
  }

  private extractYear(text: string): string | null {
    // Look for 4-digit years between 1900-2030
    const yearMatches = text.match(/\b(19[0-9]{2}|20[0-3][0-9])\b/g);
    if (yearMatches) {
      // Prefer years that appear near "YR", "YEAR", or "MODEL" keywords
      const yearContext = text.match(/(?:YR|YEAR|MODEL)[\s\w]*?(19[0-9]{2}|20[0-3][0-9])/i);
      if (yearContext) {
        return yearContext[1];
      }
      
      // Otherwise return the most recent reasonable year
      const years = yearMatches.map(y => parseInt(y)).filter(y => y >= 1990 && y <= 2030);
      if (years.length > 0) {
        return Math.max(...years).toString();
      }
    }
    return null;
  }

  private extractMake(text: string): string | null {
    // Look for make near "MAKE" keyword first
    const makeContext = text.match(/MAKE[\s\:]*([A-Z]{2,15})/i);
    if (makeContext && makeContext[1]) {
      const candidate = makeContext[1].toUpperCase();
      if (VEHICLE_MAKES[candidate]) {
        return VEHICLE_MAKES[candidate];
      }
    }

    // Search through all known makes
    for (const [key, value] of Object.entries(VEHICLE_MAKES)) {
      if (text.includes(key)) {
        return value;
      }
    }

    return null;
  }

  private extractModel(text: string, make: string): string | null {
    // Look for model near "MODEL" keyword
    const modelContext = text.match(/MODEL[\s\:]*([A-Z0-9\s]{1,20})/i);
    if (modelContext && modelContext[1]) {
      const candidate = modelContext[1].trim();
      const excludeWords = ['YEAR', 'YR', 'MAKE', 'PLATE', 'VIN', 'VEHICLE', make.toUpperCase()];
      
      if (!excludeWords.some(word => candidate.includes(word)) && candidate.length >= 1) {
        return this.formatModelName(candidate);
      }
    }

    // Look for model after make in the text
    const makeIndex = text.indexOf(make.toUpperCase());
    if (makeIndex !== -1) {
      const afterMake = text.substring(makeIndex + make.length);
      const modelMatch = afterMake.match(/\s+([A-Z0-9]{1,15})/);
      if (modelMatch) {
        const candidate = modelMatch[1].trim();
        const excludeWords = ['MOTOR', 'COMPANY', 'CORP', 'INC', 'LLC', 'VEHICLE', 'AUTO', 'YR', 'YEAR'];
        if (!excludeWords.some(word => candidate.includes(word))) {
          return this.formatModelName(candidate);
        }
      }
    }

    return null;
  }

  private isValidVINPattern(vin: string): boolean {
    if (vin.length !== 17) return false;
    if (/[IOQ]/.test(vin)) return false;
    
    // Check for reasonable character distribution
    const charCounts = {};
    for (const char of vin) {
      charCounts[char] = (charCounts[char] || 0) + 1;
      if (charCounts[char] > 4) return false;
    }
    
    // Must contain both letters and numbers
    const hasLetters = /[A-HJ-NPR-Z]/.test(vin);
    const hasNumbers = /[0-9]/.test(vin);
    
    return hasLetters && hasNumbers;
  }

  private formatModelName(model: string): string {
    return model.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()).trim();
  }
}
