
import { useState, useCallback } from 'react';
import { OCRService, ExtractedVehicleData } from '@/services/ocrService';

export interface OCRState {
  isProcessing: boolean;
  extractedData: ExtractedVehicleData | null;
  error: string | null;
  progress: number;
}

export function useOCR() {
  const [state, setState] = useState<OCRState>({
    isProcessing: false,
    extractedData: null,
    error: null,
    progress: 0,
  });

  const processFile = useCallback(async (file: File) => {
    setState({
      isProcessing: true,
      extractedData: null,
      error: null,
      progress: 0,
    });

    try {
      const ocrService = OCRService.getInstance();
      const extractedData = await ocrService.extractVehicleData(file);
      
      setState({
        isProcessing: false,
        extractedData,
        error: null,
        progress: 100,
      });

      return extractedData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OCR processing failed';
      setState({
        isProcessing: false,
        extractedData: null,
        error: errorMessage,
        progress: 0,
      });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      extractedData: null,
      error: null,
      progress: 0,
    });
  }, []);

  return {
    ...state,
    processFile,
    reset,
  };
}
