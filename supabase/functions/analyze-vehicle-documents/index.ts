
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
          
          // Try to extract text content from the PDF first
          const pdfTextResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': Deno.env.get('PDF_CO_API_KEY') || 'demo'
            },
            body: JSON.stringify({
              url: url,
              async: false
            })
          });
          
          let extractedText = '';
          
          if (pdfTextResponse.ok) {
            const textResult = await pdfTextResponse.json();
            if (textResult.body) {
              extractedText = textResult.body;
              console.log(`Extracted ${extractedText.length} characters of text from PDF`);
            }
          }
          
          // If text extraction worked, analyze the text content
          if (extractedText && extractedText.length > 100) {
            console.log('Analyzing extracted PDF text content');
            
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
                    content: `You are an expert at analyzing California Certificate of Title documents. You will receive extracted text from a PDF that contains vehicle documentation.

CRITICAL INSTRUCTIONS:
1. Look specifically for "CERTIFICATE OF TITLE" sections in the text
2. Extract EXACT information from the title document - do not guess or approximate
3. Focus on official DMV fields and data
4. VIN numbers must be exactly 17 characters (for vehicles 1981+)
5. Cross-reference information if multiple documents are present

SEARCH FOR THESE SPECIFIC FIELDS IN THE CERTIFICATE OF TITLE:
- Vehicle Identification Number (VIN)
- Year, Make, Model
- Registered Owner name and address  
- Certificate/Title number
- License plate number
- Lien information
- Title brands (if any)
- Transfer dates and amounts

You MUST respond with ONLY this JSON format:
{
  "year": "exact year from title",
  "make": "exact manufacturer from title",
  "model": "exact model from title", 
  "vehicleId": "exact 17-digit VIN from title",
  "licensePlate": "license plate number",
  "sellerName": "registered owner name from title",
  "purchaseDate": "most recent date in YYYY-MM-DD format",
  "purchasePrice": "sale price if available",
  "titlePresent": true,
  "billOfSale": false,
  "confidence": "high/medium/low",
  "titleNumber": "certificate number",
  "extractionSource": "Certificate of Title text extraction"
}

If you cannot find specific information, use null for that field. Be extremely precise.`
                  },
                  {
                    role: 'user',
                    content: `Extract vehicle information from this Certificate of Title document text. Focus on the CERTIFICATE OF TITLE section:\n\n${extractedText}`
                  }
                ],
                max_tokens: 800,
                temperature: 0.0,
                response_format: { type: "json_object" }
              }),
            });
            
            if (!analysisResponse.ok) {
              throw new Error(`OpenAI API error: ${analysisResponse.statusText}`);
            }
            
            const analysisData = await analysisResponse.json();
            const content = analysisData.choices[0].message.content;
            
            try {
              return JSON.parse(content);
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              throw new Error('Failed to parse AI response as JSON');
            }
          }
          
          // If text extraction failed, fall back to image conversion
          console.log('Text extraction failed, trying image conversion');
          
          const pdfToImageResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': Deno.env.get('PDF_CO_API_KEY') || 'demo'
            },
            body: JSON.stringify({
              url: url,
              pages: "1-5", // Process up to 5 pages
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
          
          // If we have images, analyze them
          if (imageUrls.length > 0) {
            console.log('Analyzing converted PDF images');
            
            const imageAnalysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                    content: `You are analyzing a vehicle Certificate of Title document image. Extract EXACT information:

You MUST respond with ONLY this JSON format:
{
  "year": "exact year from title",
  "make": "exact manufacturer from title",
  "model": "exact model from title", 
  "vehicleId": "exact 17-digit VIN from title",
  "licensePlate": "license plate number",
  "sellerName": "registered owner name from title",
  "purchaseDate": "most recent date in YYYY-MM-DD format",
  "purchasePrice": "sale price if available",
  "titlePresent": true,
  "billOfSale": false,
  "confidence": "high/medium/low",
  "titleNumber": "certificate number",
  "extractionSource": "Certificate of Title image analysis"
}

If you cannot find specific information, use null for that field.`
                  },
                  {
                    role: 'user',
                    content: [
                      {
                        type: 'text',
                        text: 'Analyze this Certificate of Title image and extract vehicle information with extreme accuracy.'
                      },
                      {
                        type: 'image_url',
                        image_url: {
                          url: imageUrls[0], // Use first image
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
            
            if (!imageAnalysisResponse.ok) {
              throw new Error(`OpenAI API error: ${imageAnalysisResponse.statusText}`);
            }
            
            const imageAnalysisData = await imageAnalysisResponse.json();
            const imageContent = imageAnalysisData.choices[0].message.content;
            
            try {
              return JSON.parse(imageContent);
            } catch (parseError) {
              console.error('Image analysis JSON parse error:', parseError);
              throw new Error('Failed to parse image analysis response');
            }
          }
          
          // Final fallback if everything fails
          console.log('All PDF processing methods failed');
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
            error: "PDF processing failed",
            note: "Unable to extract text or convert to images"
          };
          
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
