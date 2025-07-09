import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY');

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
        
        // Send PDF or image directly to OpenAI - they can handle both!
        console.log('🤖 Sending document directly to OpenAI...');
        const analysisResult = await analyzeDocumentWithOpenAI(url);
        
        if (analysisResult && !analysisResult.error) {
          console.log(`✅ Successfully extracted data`);
          results.push(analysisResult);
        } else {
          console.log(`❌ Failed to extract data:`, analysisResult);
          results.push(analysisResult);
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

async function analyzeDocumentWithOpenAI(documentUrl) {
  try {
    console.log(`🔍 Processing document: ${documentUrl}`);
    
    // Check if it's a PDF that needs conversion
    const isPDF = documentUrl.toLowerCase().includes('.pdf');
    let imageUrl = documentUrl;
    
    if (isPDF) {
      console.log(`📄 Converting PDF to image...`);
      imageUrl = await convertPDFToImage(documentUrl);
      if (!imageUrl) {
        throw new Error('Failed to convert PDF to image');
      }
      console.log(`✅ PDF converted to image: ${imageUrl}`);
    }
    
    console.log(`🧠 Sending to OpenAI Vision API...`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert at reading vehicle documents. Extract information from this document.

IMPORTANT: Look for these fields and extract them exactly as they appear:
- VIN (Vehicle Identification Number) - must be exactly 17 characters
- Year, Make, Model of the vehicle
- Owner/Registered owner name
- License plate number
- Title/Certificate number
- Any document type indicators

Return ONLY this JSON format:
{
  "year": "extracted year or null",
  "make": "extracted make or null", 
  "model": "extracted model or null",
  "vehicleId": "17-digit VIN or null",
  "licensePlate": "plate number or null",
  "sellerName": "owner name or null",
  "titlePresent": true/false,
  "titleNumber": "title number or null",
  "confidence": "high/medium/low",
  "source": "document analysis"
}

Be precise and only extract what you can clearly see. Use null for missing information.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all vehicle information from this document. Look carefully for VIN, year, make, model, owner name, and title information.'
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
        max_tokens: 800,
        temperature: 0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🚫 OpenAI error: ${response.status} - ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log(`📋 Raw OpenAI response:`, content);
    
    try {
      // Clean up the response to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`✅ Parsed result:`, parsed);
      return parsed;
    } catch (parseError) {
      console.error(`🚫 JSON parse error:`, parseError);
      console.error(`🚫 Raw content:`, content);
      return {
        error: 'JSON parsing failed',
        details: parseError.message,
        confidence: 'low',
        rawResponse: content
      };
    }
    
  } catch (error) {
    console.error(`💥 Analysis error:`, error);
    return {
      error: 'Document analysis failed',
      details: error.message,
      confidence: 'low'
    };
  }
}

async function convertPDFToImage(pdfUrl) {
  try {
    console.log(`🔄 Converting PDF to image using PDF.co: ${pdfUrl}`);
    
    const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        pages: '0', // First page only
        async: false
      }),
    });

    if (!response.ok) {
      throw new Error(`PDF.co conversion failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`PDF.co error: ${data.message}`);
    }

    if (!data.url) {
      throw new Error('No image URL returned from PDF.co');
    }

    console.log(`✅ PDF converted successfully: ${data.url}`);
    return data.url;
    
  } catch (error) {
    console.error(`❌ PDF conversion failed:`, error);
    return null;
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