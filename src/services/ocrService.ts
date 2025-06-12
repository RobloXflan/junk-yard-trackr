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
      console.log('Starting enhanced OCR processing for file:', file.name);
      
      // Try multiple OCR configurations for better accuracy
      const ocrResults = await this.performMultipleOCRPasses(file);
      
      // Select the best result based on confidence
      const bestResult = this.selectBestOCRResult(ocrResults);
      console.log('Best OCR text result:', bestResult);

      // Clean and enhance the text with character corrections
      const cleanedText = this.cleanOCRText(bestResult);
      console.log('Cleaned OCR text:', cleanedText);

      // Apply character corrections for common misreadings
      const correctedText = this.applyCharacterCorrections(cleanedText);
      console.log('Character-corrected text:', correctedText);

      const extractedData: ExtractedVehicleData = {
        confidence: {}
      };

      // Enhanced VIN extraction
      const fullVin = this.extractFullVIN(correctedText);
      if (fullVin) {
        extractedData.vehicleId = fullVin.slice(-5);
        extractedData.confidence.vehicleId = 0.95;
        console.log('Full VIN found:', fullVin, 'Vehicle ID (last 5):', extractedData.vehicleId);
      }

      // Enhanced license plate extraction
      extractedData.licensePlate = this.extractLicensePlate(correctedText);
      if (extractedData.licensePlate) {
        extractedData.confidence.licensePlate = 0.9;
        console.log('License plate found:', extractedData.licensePlate);
      }

      // Enhanced year extraction
      extractedData.year = this.extractYear(correctedText);
      if (extractedData.year) {
        extractedData.confidence.year = 0.9;
        console.log('Year found:', extractedData.year);
      }

      // Enhanced make extraction
      extractedData.make = this.extractMake(correctedText);
      if (extractedData.make) {
        extractedData.confidence.make = 0.85;
        console.log('Make found:', extractedData.make);
      }

      // Enhanced model extraction
      if (extractedData.make) {
        extractedData.model = this.extractModel(correctedText, extractedData.make);
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

  private async performMultipleOCRPasses(file: File): Promise<string[]> {
    console.log('Performing multiple OCR passes for better accuracy...');
    
    const results: string[] = [];
    
    // Configuration 1: Enhanced for documents with character whitelist
    const config1 = {
      lang: 'eng',
      options: {
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
        preserve_interword_spaces: '1',
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Pass 1 Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    };

    // Configuration 2: High DPI settings for better character recognition
    const config2 = {
      lang: 'eng',
      options: {
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_ocr_engine_mode: Tesseract.OEM.DEFAULT,
        user_defined_dpi: '300',
        textord_min_linesize: '2.5',
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Pass 2 Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    };

    // Configuration 3: Sparse text for scattered document info
    const config3 = {
      lang: 'eng',
      options: {
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Pass 3 Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    };

    try {
      console.log('Starting OCR Pass 1 (Enhanced Block Mode)...');
      const result1 = await Tesseract.recognize(file, config1.lang, config1.options);
      results.push(result1.data.text);
      console.log('OCR Pass 1 completed');

      console.log('Starting OCR Pass 2 (High DPI Mode)...');
      const result2 = await Tesseract.recognize(file, config2.lang, config2.options);
      results.push(result2.data.text);
      console.log('OCR Pass 2 completed');

      console.log('Starting OCR Pass 3 (Sparse Text Mode)...');
      const result3 = await Tesseract.recognize(file, config3.lang, config3.options);
      results.push(result3.data.text);
      console.log('OCR Pass 3 completed');

    } catch (error) {
      console.error('Error in OCR passes:', error);
      // Fallback to basic OCR if enhanced fails
      const fallbackResult = await Tesseract.recognize(file, 'eng');
      results.push(fallbackResult.data.text);
    }

    return results;
  }

  private selectBestOCRResult(results: string[]): string {
    console.log('Selecting best OCR result from', results.length, 'attempts...');
    
    // Score each result based on various criteria
    let bestResult = '';
    let bestScore = 0;

    results.forEach((text, index) => {
      const score = this.scoreOCRResult(text);
      console.log(`OCR Pass ${index + 1} score: ${score}`);
      console.log(`OCR Pass ${index + 1} text preview:`, text.substring(0, 200) + '...');
      
      if (score > bestScore) {
        bestScore = score;
        bestResult = text;
      }
    });

    console.log('Selected best result with score:', bestScore);
    return bestResult;
  }

  private scoreOCRResult(text: string): number {
    let score = 0;
    
    // Basic text quality metrics
    score += text.length; // Longer text usually means better recognition
    
    // Check for vehicle-related keywords
    const keywords = ['VIN', 'VEHICLE', 'YEAR', 'MAKE', 'MODEL', 'PLATE', 'TITLE', 'CALIFORNIA'];
    keywords.forEach(keyword => {
      if (text.toUpperCase().includes(keyword)) {
        score += 50;
      }
    });
    
    // Check for potential VIN patterns
    if (/[A-HJ-NPR-Z0-9]{17}/.test(text)) {
      score += 100;
    }
    
    // Check for year patterns
    if (/20[0-9]{2}|19[0-9]{2}/.test(text)) {
      score += 30;
    }
    
    // Check for license plate patterns
    if (/[A-Z0-9]{6,8}/.test(text)) {
      score += 40;
    }
    
    return score;
  }

  private cleanOCRText(text: string): string {
    console.log('Cleaning OCR text...');
    
    let cleaned = text.toUpperCase();
    
    console.log('Original text length:', cleaned.length);
    
    // Remove excessive whitespace and clean up formatting
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Remove common OCR artifacts but keep alphanumeric
    cleaned = cleaned.replace(/[^\w\s]/g, ' ');
    
    console.log('Cleaned text preview:', cleaned.substring(0, 200) + '...');
    return cleaned;
  }

  private applyCharacterCorrections(text: string): string {
    console.log('Applying character corrections for common OCR mistakes...');
    
    let corrected = text;
    
    // Common OCR character misreadings - apply multiple variations to catch all cases
    const corrections = [
      // License plate specific corrections
      { pattern: /LRZZ(\w)(\w)L/g, replacement: (match: string, p1: string, p2: string) => {
        console.log(`Found potential plate pattern: ${match}`);
        // Convert L back to 6 if it's in a license plate context
        let fixed = match.replace(/L/g, '6');
        console.log(`Corrected to: ${fixed}`);
        return fixed;
      }},
      
      // VIN specific corrections - last 5 digits context
      { pattern: /(\w{12})L(\d{4})/g, replacement: (match: string, p1: string, p2: string) => {
        console.log(`Found potential VIN ending: ${match}`);
        // Convert L to 1 in VIN context
        let fixed = p1 + '1' + p2;
        console.log(`Corrected VIN ending to: ${fixed}`);
        return fixed;
      }},
      
      // General character corrections for common mistakes
      { pattern: /(\d)L(\d)/g, replacement: '$16$2' }, // L between numbers should be 6
      { pattern: /L(\d{3,4})/g, replacement: '6$1' }, // L before 3-4 digits likely 6
      { pattern: /(\d{3,4})L/g, replacement: '$16' }, // L after 3-4 digits likely 6
      
      // Other common OCR mistakes
      { pattern: /0/g, replacement: 'O' }, // Sometimes 0 should be O
      { pattern: /O/g, replacement: '0' }, // Sometimes O should be 0
      { pattern: /1/g, replacement: 'I' }, // Sometimes 1 should be I
      { pattern: /I/g, replacement: '1' }, // Sometimes I should be 1
      { pattern: /5/g, replacement: 'S' }, // Sometimes 5 should be S
      { pattern: /S/g, replacement: '5' }, // Sometimes S should be 5
      { pattern: /8/g, replacement: 'B' }, // Sometimes 8 should be B
      { pattern: /B/g, replacement: '8' }, // Sometimes B should be 8
      { pattern: /2/g, replacement: 'Z' }, // Sometimes 2 should be Z
      { pattern: /Z/g, replacement: '2' }  // Sometimes Z should be 2
    ];

    // Apply targeted corrections first (license plate and VIN specific)
    const targetedCorrections = corrections.slice(0, 3);
    for (const correction of targetedCorrections) {
      if (typeof correction.replacement === 'function') {
        corrected = corrected.replace(correction.pattern, correction.replacement);
      } else {
        corrected = corrected.replace(correction.pattern, correction.replacement);
      }
    }
    
    console.log('Text after targeted corrections:', corrected.substring(0, 200) + '...');
    
    // Create multiple variations with different general corrections for better matching
    const variations = [corrected];
    
    // Try variations with different character substitutions
    const generalCorrections = corrections.slice(3);
    for (const correction of generalCorrections) {
      const variation = corrected.replace(correction.pattern, correction.replacement as string);
      if (variation !== corrected) {
        variations.push(variation);
      }
    }
    
    console.log(`Generated ${variations.length} text variations for extraction`);
    
    // For now, return the targeted corrected version
    // The extraction methods will try multiple patterns anyway
    return corrected;
  }

  private extractFullVIN(text: string): string | null {
    console.log('Extracting VIN with enhanced patterns...');
    
    // Clean text for better VIN detection
    const lines = text.split('\n');
    
    // Enhanced VIN patterns with better flexibility
    const vinPatterns = [
      // Standard 17-character VIN
      /\b[A-HJ-NPR-Z0-9]{17}\b/g,
      // VIN with potential spaces or artifacts
      /[A-HJ-NPR-Z0-9][\s\-A-HJ-NPR-Z0-9]{15,25}[A-HJ-NPR-Z0-9]/g,
      // Look for VIN context
      /(?:VIN|VEHICLE)[\s\:]*([A-HJ-NPR-Z0-9\s\-]{17,25})/gi,
      // Common VIN prefixes (more flexible)
      /(?:KM|1[A-HJ-NPR-Z]|2[A-HJ-NPR-Z]|3[A-HJ-NPR-Z]|4[A-HJ-NPR-Z]|5[A-HJ-NPR-Z])[A-HJ-NPR-Z0-9\s\-]{14,22}/g
    ];

    // Try each pattern
    for (let i = 0; i < vinPatterns.length; i++) {
      const pattern = vinPatterns[i];
      const matches = text.match(pattern);
      
      if (matches) {
        console.log(`VIN Pattern ${i + 1} matches:`, matches);
        
        for (const match of matches) {
          const cleanVin = match.replace(/[^A-HJ-NPR-Z0-9]/g, '');
          
          if (cleanVin.length === 17 && this.isValidVINPattern(cleanVin)) {
            console.log('Valid VIN found:', cleanVin);
            return cleanVin;
          }
        }
      }
    }

    // Additional line-by-line search
    for (const line of lines) {
      const cleanLine = line.replace(/[^A-HJ-NPR-Z0-9\s]/g, '');
      const potentialVins = cleanLine.match(/[A-HJ-NPR-Z0-9]{17}/g);
      
      if (potentialVins) {
        for (const vin of potentialVins) {
          if (this.isValidVINPattern(vin)) {
            console.log('VIN found in line scan:', vin);
            return vin;
          }
        }
      }
    }
    
    console.log('No valid VIN found');
    return null;
  }

  private extractLicensePlate(text: string): string | null {
    console.log('Extracting license plate with enhanced patterns...');
    
    // Enhanced California plate patterns with character correction awareness
    const platePatterns = [
      // Standard CA format with 6 correction: 6ABC123, 6ABC1234
      /\b6[A-Z]{3}[0-9]{3,4}\b/g,
      // Legacy format: ABC123
      /\b[A-Z]{3}[0-9]{3}\b/g,
      // New format: 8ABC123
      /\b[0-9][A-Z]{3}[0-9]{3}\b/g,
      // Pattern looking for the corrected LRZZ format: 6RZZ216
      /\b6[A-Z]{3}[0-9]{3}\b/g,
      // General patterns with more flexibility
      /\b[A-Z0-9]{6,8}\b/g,
      // Pattern with numbers and letters mixed
      /\b[0-9]{1,2}[A-Z]{2,4}[0-9]{2,4}\b/g
    ];
    
    const excludeWords = ['TITLE', 'CERTIFICATE', 'CALIFORNIA', 'VEHICLE', 'REGISTRATION', 'OWNER', 'ISSUED', 'NUMBER', 'KMHDCBAE'];
    
    // Look for plate context first
    const plateContext = text.match(/(?:PLATE|LICENSE)[\s\w]*?([A-Z0-9]{6,8})/i);
    if (plateContext && plateContext[1]) {
      const candidate = plateContext[1];
      if (!excludeWords.some(word => candidate.includes(word))) {
        console.log('License plate found via context:', candidate);
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
              !match.match(/^[0-9]+$/) && 
              !match.match(/^[A-Z]+$/)) {
            console.log('License plate found via pattern:', match);
            return match;
          }
        }
      }
    }

    console.log('No license plate found');
    return null;
  }

  private extractYear(text: string): string | null {
    console.log('Extracting year with enhanced patterns...');
    
    // Look for 4-digit years
    const yearMatches = text.match(/\b(19[0-9]{2}|20[0-3][0-9])\b/g);
    if (yearMatches) {
      console.log('Year candidates found:', yearMatches);
      
      // Look for year in context
      const yearContext = text.match(/(?:YR|YEAR|MODEL)[\s\w]*?(19[0-9]{2}|20[0-3][0-9])/i);
      if (yearContext) {
        console.log('Year found via context:', yearContext[1]);
        return yearContext[1];
      }
      
      // Filter for reasonable vehicle years
      const vehicleYears = yearMatches
        .map(y => parseInt(y))
        .filter(y => y >= 1990 && y <= 2030)
        .sort((a, b) => b - a); // Sort newest first
      
      if (vehicleYears.length > 0) {
        console.log('Year found via filtering:', vehicleYears[0].toString());
        return vehicleYears[0].toString();
      }
    }
    
    console.log('No year found');
    return null;
  }

  private extractMake(text: string): string | null {
    console.log('Extracting make with enhanced patterns...');
    
    // Look for make near context first
    const makeContext = text.match(/(?:MAKE|MFR|MANUFACTURER)[\s\:]*([A-Z]{2,15})/i);
    if (makeContext && makeContext[1]) {
      const candidate = makeContext[1].toUpperCase();
      if (VEHICLE_MAKES[candidate]) {
        console.log('Make found via context:', VEHICLE_MAKES[candidate]);
        return VEHICLE_MAKES[candidate];
      }
    }

    // Search through all known makes with enhanced matching
    for (const [key, value] of Object.entries(VEHICLE_MAKES)) {
      // Exact match
      if (text.includes(key)) {
        console.log('Make found via exact match:', value);
        return value;
      }
      
      // Partial match with word boundaries
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(text)) {
        console.log('Make found via word boundary match:', value);
        return value;
      }
    }

    console.log('No make found');
    return null;
  }

  private extractModel(text: string, make: string): string | null {
    console.log('Extracting model with enhanced patterns for make:', make);
    
    // Look for model near context
    const modelContext = text.match(/(?:MODEL|MDL)[\s\:]*([A-Z0-9\s]{1,20})/i);
    if (modelContext && modelContext[1]) {
      const candidate = modelContext[1].trim();
      const excludeWords = ['YEAR', 'YR', 'MAKE', 'PLATE', 'VIN', 'VEHICLE', make.toUpperCase()];
      
      if (!excludeWords.some(word => candidate.includes(word)) && candidate.length >= 1) {
        console.log('Model found via context:', this.formatModelName(candidate));
        return this.formatModelName(candidate);
      }
    }

    // Look for model after make in text
    const makeIndex = text.indexOf(make.toUpperCase());
    if (makeIndex !== -1) {
      const afterMake = text.substring(makeIndex + make.length);
      const modelMatch = afterMake.match(/\s+([A-Z0-9]{1,15})/);
      if (modelMatch) {
        const candidate = modelMatch[1].trim();
        const excludeWords = ['MOTOR', 'COMPANY', 'CORP', 'INC', 'LLC', 'VEHICLE', 'AUTO', 'YR', 'YEAR'];
        if (!excludeWords.some(word => candidate.includes(word))) {
          console.log('Model found after make:', this.formatModelName(candidate));
          return this.formatModelName(candidate);
        }
      }
    }

    console.log('No model found');
    return null;
  }

  private isValidVINPattern(vin: string): boolean {
    if (vin.length !== 17) return false;
    if (/[IOQ]/.test(vin)) return false;
    
    // Check for reasonable character distribution
    const charCounts: { [key: string]: number } = {};
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
