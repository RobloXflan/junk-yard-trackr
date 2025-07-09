
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
      const isPdf = url.toLowerCase().includes('.pdf');
      
      try {
        if (isPdf) {
          console.log(`Processing PDF: ${url}`);
          
          // Convert PDF to images using PDF.co API for proper analysis
          const pdfToImageResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': Deno.env.get('PDF_CO_API_KEY') || 'demo' // Using demo key if not set
            },
            body: JSON.stringify({
              url: url,
              pages: "1-10", // Process up to 10 pages
              async: false
            })
          });
          
          let imageUrls = [];
          
          if (pdfToImageResponse.ok) {
            const pdfResult = await pdfToImageResponse.json();
            if (pdfResult.urls && pdfResult.urls.length > 0) {
              imageUrls = pdfResult.urls;
              console.log(`PDF converted to ${imageUrls.length} images`);
            }
          }
          
          // If PDF conversion failed, fall back to direct analysis
          if (imageUrls.length === 0) {
            console.log('PDF conversion failed, using direct PDF analysis with strict JSON response');
            
            const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    content: `You are a vehicle document analysis system. You MUST respond with ONLY valid JSON - no explanations, no conversational text, no apologies.

Since you cannot directly read PDF content, you will return a structured response indicating the need for image conversion.

You MUST respond with exactly this JSON structure:
{
  "year": null,
  "make": null,
  "model": null,
  "vehicleId": null,
  "licensePlate": null,
  "sellerName": null,
  "purchaseDate": null,
  "purchasePrice": null,
  "titlePresent": false,
  "billOfSale": false,
  "confidence": "low",
  "extractionNote": "PDF requires image conversion for accurate analysis",
  "recommendation": "Convert PDF to images for detailed extraction"
}

CRITICAL: Return ONLY this JSON object. No other text before or after.`
                  },
                  {
                    role: 'user',
                    content: `Analyze PDF: ${url}`
                  }
                ],
                max_tokens: 300,
                temperature: 0.0,
                response_format: { type: "json_object" }
              }),
            });
            
            if (!analysisResponse.ok) {
              throw new Error(`OpenAI API error: ${analysisResponse.statusText}`);
            }
            
            const analysisData = await analysisResponse.json();
            const content = analysisData.choices[0].message.content;
            
            // Double-check JSON parsing
            try {
              return JSON.parse(content);
            } catch (parseError) {
              console.error('JSON parse error:', parseError, 'Content:', content);
              return {
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
                confidence: "low",
                error: "JSON parsing failed",
                note: "PDF processing needs image conversion for accuracy"
              };
            }
          }
          
          // Process converted images with advanced multi-page analysis
          const pageAnalyses = await Promise.all(
            imageUrls.map(async (imageUrl, index) => {
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
                      content: `You are analyzing page ${index + 1} of a vehicle document PDF. Focus on:

DOCUMENT TYPE IDENTIFICATION:
- Is this a Certificate of Title? (look for "CERTIFICATE OF TITLE" header)
- Is this a Registration? (look for registration renewal stickers, fees)
- Is this a Bill of Sale? (look for sale agreement language)
- Is this supporting documentation?

CRITICAL DATA EXTRACTION (if Certificate of Title):
- Vehicle Identification Number (VIN) - exactly 17 characters
- Year, Make, Model (usually in prominent fields)
- Registered Owner name and address
- Certificate/Title number
- Any liens or security interests
- Title brands (Salvage, Flood, Lemon, etc.)
- Previous title information

VERIFICATION CHECKS:
- Does the VIN format look correct? (17 alphanumeric characters)
- Do year/make/model make sense together?
- Are there any obvious inconsistencies?
- Is this an official DMV document with proper seals/stamps?

Return detailed analysis of what you can extract from this specific page.`
                    },
                    {
                      role: 'user',
                      content: [
                        {
                          type: 'text',
                          text: `Analyze page ${index + 1} of the vehicle document. Extract all visible information with extreme accuracy.`
                        },
                        {
                          type: 'image_url',
                          image_url: {
                            url: imageUrl,
                            detail: 'high'
                          }
                        }
                      ]
                    }
                  ],
                  max_tokens: 1500,
                  temperature: 0.0
                }),
              });
              
              const data = await response.json();
              return {
                page: index + 1,
                analysis: data.choices[0].message.content,
                imageUrl: imageUrl
              };
            })
          );
          
          // Synthesize information from all pages
          const synthesisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                  content: `You are synthesizing information from multiple pages of a vehicle document PDF. Your job is to:

1. IDENTIFY THE PRIMARY DOCUMENT (Certificate of Title takes precedence)
2. CROSS-REFERENCE all information between pages
3. RESOLVE any discrepancies by prioritizing official DMV documents
4. FLAG any inconsistencies or suspicious information
5. EXTRACT the most accurate information possible

SYNTHESIS RULES:
- Certificate of Title data overrides registration or bill of sale data
- VIN must be exactly 17 characters and consistent across all documents
- Owner information should match between title and registration
- Dates should be logical and consistent
- Any discrepancies must be noted

Return ONLY a valid JSON object with this exact structure:
{
  "year": "vehicle year from title",
  "make": "manufacturer from title", 
  "model": "model from title",
  "vehicleId": "17-digit VIN from title",
  "licensePlate": "license plate number",
  "sellerName": "registered owner from title",
  "purchaseDate": "most recent transfer date YYYY-MM-DD",
  "purchasePrice": "sale price if available",
  "titlePresent": true/false,
  "billOfSale": true/false,
  "confidence": "high/medium/low",
  "titleNumber": "certificate number",
  "discrepancies": "any inconsistencies found",
  "documentTypes": "list of document types identified"
}`
                },
                {
                  role: 'user',
                  content: `Synthesize the following page analyses into accurate vehicle information:\n\n${pageAnalyses.map(p => `Page ${p.page}: ${p.analysis}`).join('\n\n')}`
                }
              ],
              max_tokens: 1000,
              temperature: 0.0
            }),
          });
          
          const synthesisData = await synthesisResponse.json();
          return JSON.parse(synthesisData.choices[0].message.content);
          
        } else {
          // For images, use the Vision API directly
          console.log(`Processing image: ${url}`);
          
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
            throw new Error(`OpenAI API error: ${response.statusText}`);
          }

          const data = await response.json();
          const content = data.choices[0].message.content;
          
          return JSON.parse(content);
        }
        
      } catch (parseError) {
        console.error('Failed to process document:', parseError);
        return { 
          error: 'Failed to process document', 
          details: parseError.message,
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
