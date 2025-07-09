
import { supabase } from "@/integrations/supabase/client";

export interface AIAnalysisResult {
  year?: string | null;
  make?: string | null;
  model?: string | null;
  vehicleId?: string | null;
  licensePlate?: string | null;
  sellerName?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: string | null;
  titlePresent?: boolean;
  billOfSale?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  documentAnalysis?: any[];
  error?: string;
  details?: string;
  suggestion?: string;
}

export class AIDocumentAnalysisService {
  static async analyzeDocuments(documentUrls: string[]): Promise<AIAnalysisResult> {
    try {
      console.log('🤖 Starting AI document analysis for', documentUrls.length, 'documents');
      
      const { data, error } = await supabase.functions.invoke('analyze-vehicle-documents', {
        body: { documentUrls }
      });

      if (error) {
        console.error('❌ AI analysis failed:', error);
        throw new Error(`AI analysis failed: ${error.message}`);
      }

      console.log('✅ AI analysis completed:', data);
      return data;
      
    } catch (error) {
      console.error('❌ AI document analysis error:', error);
      throw new Error(`Failed to analyze documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
