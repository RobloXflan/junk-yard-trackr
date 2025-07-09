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

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!pdfCoApiKey) {
      throw new Error('PDF.co API key not configured');
    }

    console.log(`📄 Processing ${documentUrls.length} documents`);

    const results = [];

    for (const url of documentUrls) {
      try {
        console.log(`🔍 Analyzing: ${url}`);
        
        const analysisResult = await analyzeDocumentWithOpenAI(url);
        
        if (analysisResult && !analysisResult.error) {
          console.log(`✅ Successfully extracted data:`, analysisResult);
          results.push(analysisResult);
        } else {
          console.log(`❌ Failed to extract data:`, analysisResult);
          results.push(analysisResult || {
            error: 'Unknown analysis error',
            confidence: 'low'
          });
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
    
    // Check if it's a PDF that needs special handling
    const isPDF = documentUrl.toLowerCase().includes('.pdf');
    
    if (isPDF) {
      console.log(`📄 Detected PDF document, attempting direct analysis...`);
      
      // Try direct PDF analysis first using OpenAI's new capabilities
      try {
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
                content: `You are an expert at reading vehicle documents. Extract information from this PDF document.

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
  "source": "direct pdf analysis"
}

Be precise and only extract what you can clearly see. Use null for missing information.`
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extract all vehicle information from this PDF document. Look carefully for VIN, year, make, model, owner name, and title information.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: documentUrl,
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

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0].message.content;
          console.log(`📋 Direct PDF analysis response:`, content);
          
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              console.log(`✅ Direct PDF analysis successful:`, parsed);
              return parsed;
            }
          } catch (parseError) {
            console.log(`⚠️ Direct PDF analysis failed, trying conversion fallback`);
          }
        }
      } catch (directError) {
        console.log(`⚠️ Direct PDF analysis failed: ${directError.message}, trying conversion fallback`);
      }
      
      // Fallback to PDF conversion if direct analysis fails
      console.log(`🔄 Attempting PDF to image conversion fallback...`);
      try {
        const imageUrl = await convertPDFToImage(documentUrl);
        if (imageUrl) {
          console.log(`✅ PDF converted to image: ${imageUrl}`);
          return await analyzeImageWithOpenAI(imageUrl);
        }
      } catch (conversionError) {
        console.error(`❌ PDF conversion also failed: ${conversionError.message}`);
        
        // Final fallback - return helpful error message
        return {
          error: 'Unable to process PDF document',
          details: 'Both direct PDF analysis and image conversion failed. Please try converting the PDF to an image (PNG/JPG) and upload that instead.',
          confidence: 'low',
          suggestion: 'Convert PDF to image format (PNG/JPG) for better results'
        };
      }
    } else {
      // Handle image documents directly
      console.log(`🖼️ Processing image document directly...`);
      return await analyzeImageWithOpenAI(documentUrl);
    }
    
  } catch (error) {
    console.error(`💥 Document analysis error:`, error);
    return {
      error: 'Document processing failed',
      details: error.message,
      confidence: 'low'
    };
  }
}

async function analyzeImageWithOpenAI(imageUrl) {
  console.log(`🧠 Sending image to OpenAI Vision API: ${imageUrl}`);
  
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
          content: `You are an expert at reading vehicle documents. Extract information from this document image.

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
  "source": "image analysis"
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
  
  console.log(`📋 OpenAI image analysis response:`, content);
  
  try {
    // Clean up the response to extract JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`✅ Image analysis result:`, parsed);
    return parsed;
  } catch (parseError) {
    console.error(`🚫 JSON parse error:`, parseError);
    console.error(`🚫 Raw content:`, content);
    return {
      error: 'Response parsing failed',
      details: parseError.message,
      confidence: 'low',
      rawResponse: content
    };
  }
}

async function convertPDFToImage(pdfUrl) {
  console.log(`🔄 Starting robust PDF to PNG conversion for: ${pdfUrl}`);
  
  if (!pdfCoApiKey) {
    console.error('❌ PDF.co API key not available');
    throw new Error('PDF conversion service not configured');
  }

  // First verify the PDF is accessible
  try {
    console.log('🔍 Verifying PDF accessibility...');
    const pdfCheck = await fetch(pdfUrl, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!pdfCheck.ok) {
      throw new Error(`PDF not accessible: ${pdfCheck.status} ${pdfCheck.statusText}`);
    }
    console.log('✅ PDF is accessible');
  } catch (error) {
    console.error('❌ PDF accessibility check failed:', error);
    throw new Error(`Cannot access PDF: ${error.message}`);
  }

  // Enhanced PDF.co conversion with better parameters
  const MAX_RETRIES = 2;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 PDF.co conversion attempt ${attempt}/${MAX_RETRIES}`);
      
      const requestBody = {
        url: pdfUrl,
        pages: "0",
        async: false,
        name: `vehicle-doc-${Date.now()}`,
        profiles: JSON.stringify({
          ImageFormat: "PNG",
          ImageQuality: 100,
          ImageResolution: 200,
          RenderAnnotations: true,
          RenderFormFields: true
        })
      };
      
      console.log('📤 Sending request to PDF.co:', requestBody);
      
      const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
        method: 'POST',
        headers: {
          'x-api-key': pdfCoApiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Edge-Function/1.0'
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📡 PDF.co response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ PDF.co HTTP error: ${response.status} - ${errorText}`);
        
        if (response.status === 444 || response.status >= 500) {
          // Server error, retry
          if (attempt < MAX_RETRIES) {
            console.log(`⏳ Server error, waiting before retry...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
        }
        
        throw new Error(`PDF.co service error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 PDF.co response data:', JSON.stringify(data, null, 2));
      
      // Check for API-level errors
      if (data.error === true || data.error === 'true' || data.error) {
        const errorMessage = data.message || data.error || 'Unknown conversion error';
        console.error(`❌ PDF.co API error: ${errorMessage}`);
        throw new Error(`PDF conversion error: ${errorMessage}`);
      }

      if (!data.url) {
        console.error('❌ No image URL in response');
        throw new Error('PDF conversion completed but no image URL returned');
      }

      // Verify the converted image is accessible
      console.log('🔍 Verifying converted image...');
      try {
        const imageCheck = await fetch(data.url, { 
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!imageCheck.ok) {
          throw new Error(`Converted image not accessible: ${imageCheck.status}`);
        }
      } catch (imageError) {
        console.error('❌ Image verification failed:', imageError);
        throw new Error(`Converted image verification failed: ${imageError.message}`);
      }

      console.log(`✅ PDF successfully converted to PNG: ${data.url}`);
      return data.url;
      
    } catch (error) {
      console.error(`❌ PDF conversion attempt ${attempt} failed:`, error);
      
      if (attempt === MAX_RETRIES) {
        console.error(`❌ All ${MAX_RETRIES} attempts failed`);
        throw error;
      }
      
      // Wait before retry
      console.log(`⏳ Waiting before retry attempt ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
    }
  }
  
  throw new Error('PDF conversion failed after all attempts');
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