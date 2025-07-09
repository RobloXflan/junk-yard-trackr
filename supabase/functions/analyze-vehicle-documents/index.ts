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

    console.log(`📄 Processing ${documentUrls.length} documents`);

    const results = [];

    for (const url of documentUrls) {
      try {
        console.log(`🔍 Analyzing: ${url}`);
        
        const isPdf = url.toLowerCase().includes('.pdf');
        
        if (isPdf) {
          console.log('📋 PDF detected - converting to images...');
          
          // Convert PDF to images using PDF.co (reliable service)
          const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': Deno.env.get('PDF_CO_API_KEY') || 'demo'
            },
            body: JSON.stringify({
              url: url,
              pages: '1-10',
              async: false,
              encrypt: false
            })
          });
          
          if (!convertResponse.ok) {
            throw new Error(`PDF conversion failed: ${convertResponse.statusText}`);
          }
          
          const convertData = await convertResponse.json();
          console.log('🖼️ PDF conversion result:', convertData);
          
          if (!convertData.urls || convertData.urls.length === 0) {
            throw new Error('No images generated from PDF');
          }
          
          // Analyze the first few pages (where title info is usually located)
          const imageUrls = convertData.urls.slice(0, 3);
          console.log(`📷 Analyzing ${imageUrls.length} image(s) from PDF`);
          
          for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];
            console.log(`🔎 Processing page ${i + 1}: ${imageUrl}`);
            
            const analysisResult = await analyzeImageWithOpenAI(imageUrl, i + 1);
            
            if (analysisResult && !analysisResult.error) {
              console.log(`✅ Successfully extracted data from page ${i + 1}`);
              results.push(analysisResult);
              break; // Stop after first successful extraction
            }
          }
          
        } else {
          // Direct image analysis
          console.log('🖼️ Image detected - analyzing directly...');
          const analysisResult = await analyzeImageWithOpenAI(url, 1);
          if (analysisResult) {
            results.push(analysisResult);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${url}:`, error);
        results.push({
          error: 'Processing failed',
          details: error.message,
          confidence: 'low'
        });
      }
    }

    // Find the best result (highest confidence, most data)
    const bestResult = findBestResult(results);
    
    console.log('🎯 Final result:', bestResult);
    
    return new Response(JSON.stringify({
      ...bestResult,
      documentAnalysis: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Function error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      confidence: 'low'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeImageWithOpenAI(imageUrl, pageNumber) {
  try {
    console.log(`🧠 Sending page ${pageNumber} to OpenAI Vision API...`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using the most reliable vision model
        messages: [
          {
            role: 'system',
            content: `You are a vehicle title document expert. Extract information from this Certificate of Title with extreme precision.

CRITICAL: You must find and extract:
- VIN (Vehicle Identification Number) - exactly 17 characters
- Year, Make, Model of vehicle
- Owner/Registered name
- Title/Certificate number
- License plate if visible

Return ONLY valid JSON in this exact format:
{
  "year": "YYYY",
  "make": "Manufacturer name",
  "model": "Model name",
  "vehicleId": "17-character VIN",
  "licensePlate": "Plate number or null",
  "sellerName": "Owner name from title",
  "titlePresent": true,
  "titleNumber": "Certificate number",
  "confidence": "high",
  "source": "Certificate of Title extraction"
}

Use null for missing fields. VIN must be exactly 17 characters.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this vehicle document image (page ${pageNumber}). Extract all Certificate of Title information with maximum accuracy.`
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
        max_tokens: 500,
        temperature: 0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🚫 OpenAI error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log(`📋 Raw OpenAI response:`, content);
    
    try {
      const parsed = JSON.parse(content);
      console.log(`✅ Parsed result:`, parsed);
      return parsed;
    } catch (parseError) {
      console.error(`🚫 JSON parse error:`, parseError);
      throw new Error('Invalid JSON response from AI');
    }
    
  } catch (error) {
    console.error(`💥 Analysis error:`, error);
    return {
      error: 'Analysis failed',
      details: error.message,
      confidence: 'low'
    };
  }
}

function findBestResult(results) {
  // Find result with most complete data and highest confidence
  let best = {
    year: null,
    make: null,
    model: null,
    vehicleId: null,
    licensePlate: null,
    sellerName: null,
    titlePresent: false,
    confidence: 'low'
  };
  
  for (const result of results) {
    if (result.error) continue;
    
    // Count non-null fields
    const completeness = Object.values(result).filter(v => v !== null && v !== undefined && v !== '').length;
    const currentCompleteness = Object.values(best).filter(v => v !== null && v !== undefined && v !== '').length;
    
    if (completeness > currentCompleteness || result.confidence === 'high') {
      best = { ...result };
    }
  }
  
  return best;
}