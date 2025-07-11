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

    console.log('Processing receipt with OpenAI Vision API');
    console.log('Image data length:', image.length);

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
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      throw new Error(`OpenAI API failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI Response status:', response.status);
    console.log('OpenAI Response data:', JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const extractedText = data.choices[0].message.content;
    console.log('Raw extracted text:', extractedText);

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
      console.log('Successfully parsed JSON:', extractedData);
      
      // Validate required fields
      if (!extractedData.item_name || extractedData.purchase_price === undefined) {
        throw new Error('Missing required fields in extracted data');
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
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});