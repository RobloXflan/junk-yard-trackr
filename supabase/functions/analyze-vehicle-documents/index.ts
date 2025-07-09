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

    // Process documents directly with OpenAI Vision API - no complicated conversion
    const analysisPromises = documentUrls.map(async (url: string) => {
      try {
        console.log(`Analyzing document: ${url}`);
        
        // Send directly to OpenAI Vision API - just like regular ChatGPT
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
                content: `You are an expert at extracting vehicle information from Certificate of Title documents. 

Analyze this vehicle document and extract the following information with extreme accuracy:

LOOK FOR:
- Certificate of Title sections
- VIN (Vehicle Identification Number) - must be exactly 17 characters
- Year, Make, Model of the vehicle
- Registered Owner name
- License Plate number
- Purchase/Transfer dates and amounts
- Title number/certificate number
- Any liens or title brands

You MUST respond with ONLY this exact JSON format:
{
  "year": "vehicle year",
  "make": "vehicle manufacturer",
  "model": "vehicle model",
  "vehicleId": "17-digit VIN",
  "licensePlate": "license plate number",
  "sellerName": "registered owner name",
  "purchaseDate": "date in YYYY-MM-DD format",
  "purchasePrice": "purchase price if available",
  "titlePresent": true,
  "billOfSale": false,
  "confidence": "high/medium/low",
  "titleNumber": "certificate number",
  "notes": "any important details or issues"
}

Use null for any field you cannot find. Be extremely precise with the VIN - it must be exactly 17 characters.`
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Please analyze this vehicle document (PDF/image) and extract the vehicle information according to the format specified. Focus on the Certificate of Title if present.'
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
            max_tokens: 800,
            temperature: 0.0,
            response_format: { type: "json_object" }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenAI API error: ${response.status} - ${errorText}`);
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
          const result = JSON.parse(content);
          console.log('Successfully extracted vehicle data:', result);
          return result;
        } catch (parseError) {
          console.error('Failed to parse JSON response:', content);
          throw new Error('AI returned invalid JSON format');
        }
        
      } catch (error) {
        console.error('Document analysis error:', error);
        return { 
          error: 'Failed to process document', 
          details: error.message,
          confidence: 'low'
        };
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