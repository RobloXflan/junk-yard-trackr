import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const categories = [
  "Equipment", "Supplies", "Software", "Marketing", "Travel", 
  "Office Rent", "Utilities", "Professional Services", "Insurance", "Fuel", "Meals", "Other"
];

// Helper function to wait with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to extract JSON from text with fallback parsing
const extractJSON = (text: string) => {
  try {
    // First try direct parsing
    return JSON.parse(text);
  } catch {
    // Try to find JSON within the text using regex
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // If that fails, try to fix common issues
        const cleanedText = text
          .replace(/```json\s*/, '')
          .replace(/```\s*$/, '')
          .trim();
        return JSON.parse(cleanedText);
      }
    }
    throw new Error('No valid JSON found in response');
  }
};

// Main OpenAI API call with retry logic
const callOpenAI = async (image: string, model: string, retryCount = 0): Promise<any> => {
  const maxRetries = 3;
  const baseDelay = 1000;
  
  try {
    console.log(`Attempting OpenAI call with ${model}, retry ${retryCount}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are an expert receipt scanner for tax purposes. Extract business purchase information with high accuracy.
            
            IMPORTANT: You MUST return a valid JSON object with these exact fields:
            {
              "item_name": "Brief description of what was purchased",
              "purchase_price": numeric_value_only,
              "purchase_date": "YYYY-MM-DD",
              "vendor_store": "Store/vendor name", 
              "category": "One of: ${categories.join(', ')}",
              "notes_purpose": "Brief business purpose"
            }
            
            Rules:
            - purchase_price must be a number (no $ symbol)
            - purchase_date must be YYYY-MM-DD format
            - category must match one from the list exactly
            - If unclear, make your best estimate but always return valid JSON
            - Return ONLY the JSON object, no other text`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract tax receipt information from this image:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return data;
    
  } catch (error) {
    console.error(`OpenAI call failed (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries) {
      const delayMs = baseDelay * Math.pow(2, retryCount);
      console.log(`Retrying in ${delayMs}ms...`);
      await delay(delayMs);
      return callOpenAI(image, model, retryCount + 1);
    }
    
    throw error;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      throw new Error('No image provided');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Basic image validation
    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      throw new Error('Invalid image format. Expected base64 data URL.');
    }

    console.log('Processing receipt with OpenAI Vision API');
    console.log('Image data length:', image.length);

    let data;
    let extractedText;
    
    try {
      // Try with gpt-4o first
      console.log('Attempting with gpt-4o model');
      data = await callOpenAI(image, 'gpt-4o');
      extractedText = data.choices[0].message.content;
      console.log('gpt-4o response received');
      
    } catch (primaryError) {
      console.log('gpt-4o failed, falling back to gpt-4o-mini');
      console.error('Primary model error:', primaryError);
      
      try {
        // Fallback to gpt-4o-mini
        data = await callOpenAI(image, 'gpt-4o-mini');
        extractedText = data.choices[0].message.content;
        console.log('gpt-4o-mini response received');
        
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
        throw new Error(`Both models failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
      }
    }

    console.log('Raw extracted text:', extractedText);

    // Parse the JSON response with improved error handling
    let extractedData;
    try {
      extractedData = extractJSON(extractedText);
      console.log('Successfully parsed JSON:', extractedData);
      
      // Validate required fields
      if (!extractedData.item_name || extractedData.purchase_price === undefined) {
        throw new Error('Missing required fields in extracted data');
      }
      
      // Ensure purchase_price is a number
      if (typeof extractedData.purchase_price === 'string') {
        const numPrice = parseFloat(extractedData.purchase_price.replace(/[^0-9.-]/g, ''));
        if (!isNaN(numPrice)) {
          extractedData.purchase_price = numPrice;
        }
      }
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw text that failed to parse:', extractedText);
      
      throw new Error(`Failed to parse AI response: ${parseError.message}. Raw response: ${extractedText}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      extractedData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scan-receipt function:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.message.includes('abort')) {
      errorMessage = 'Request timed out. Please try again with a smaller image.';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
    } else if (error.message.includes('Invalid image format')) {
      errorMessage = 'Invalid image format. Please upload a JPG, PNG, or WebP image.';
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});