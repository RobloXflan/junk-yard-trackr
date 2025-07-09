
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentUrls } = await req.json();
    
    if (!documentUrls || !Array.isArray(documentUrls)) {
      throw new Error('Document URLs are required');
    }

    console.log(`Analyzing ${documentUrls.length} documents with AI`);

    // Process multiple documents
    const analysisPromises = documentUrls.map(async (url: string) => {
      // Check if URL is a PDF, if so, return a helpful message without calling OpenAI
      const isPdf = url.toLowerCase().includes('.pdf');
      
      if (isPdf) {
        // Return a helpful message for PDFs without calling OpenAI
        return {
          error: "PDF files cannot be processed directly",
          suggestion: "Please upload images (JPG, PNG) of your documents instead of PDFs for AI analysis. You can take photos of the documents or convert PDF pages to images.",
          confidence: "low"
        };
      }

      // For images, use the Vision API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: `You are an expert at extracting vehicle information from documents like titles, bills of sale, registration documents, and insurance papers. 

              Extract the following information and return ONLY a valid JSON object with these exact keys (use null for missing values):
              {
                "year": "vehicle year",
                "make": "vehicle make/manufacturer", 
                "model": "vehicle model",
                "vehicleId": "VIN, vehicle ID, or serial number",
                "licensePlate": "license plate number",
                "sellerName": "seller's name",
                "purchaseDate": "purchase date in YYYY-MM-DD format",
                "purchasePrice": "purchase price as number string",
                "titlePresent": true/false if title is mentioned,
                "billOfSale": true/false if bill of sale is present,
                "confidence": "high/medium/low confidence in extraction"
              }

              Be very careful to extract exact information. If unsure about a field, set it to null.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please analyze this vehicle document and extract the information according to the format specified.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: url,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        }),
      });

      if (!response.ok) {
        console.error(`OpenAI API error: ${response.status}`);
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse AI response:', content);
        return { error: 'Failed to parse AI response', rawResponse: content };
      }
    });

    const results = await Promise.all(analysisPromises);
    
    // Merge results from multiple documents, prioritizing higher confidence
    const mergedData = {
      year: null,
      make: null,
      model: null,
      vehicleId: null,
      licensePlate: null,
      sellerName: null,
      purchaseDate: null,
      purchasePrice: null,
      titlePresent: false,
      billOfSale: false,
      confidence: 'low',
      documentAnalysis: results
    };

    // Smart merge logic - prioritize high confidence results
    results.forEach((result) => {
      if (result.error) return;
      
      Object.keys(mergedData).forEach((key) => {
        if (key === 'documentAnalysis') return;
        
        if (result[key] !== null && result[key] !== undefined) {
          if (mergedData[key] === null || result.confidence === 'high') {
            mergedData[key] = result[key];
          }
        }
      });
    });

    console.log('AI analysis completed successfully');
    
    return new Response(JSON.stringify(mergedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-vehicle-documents function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to analyze documents with AI'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
