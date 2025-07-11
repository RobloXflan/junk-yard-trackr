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

    console.log('Processing receipt with OpenAI Vision API');

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
            content: `You are a receipt scanner that extracts business purchase information. 
            
            Extract the following information from the receipt image and return it as a JSON object:
            - item_name: Brief description of main items purchased (combine if multiple items)
            - purchase_price: Total amount paid including tax (as number)
            - purchase_date: Date in YYYY-MM-DD format
            - vendor_store: Store/vendor name
            - category: Best matching category from: ${categories.join(', ')}
            - notes_purpose: Brief description of what this could be used for in business
            
            If any information is unclear or missing, use your best judgment or return null for that field.
            Return only the JSON object, no other text.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract the business purchase information from this receipt:'
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
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI Response:', data);

    const extractedText = data.choices[0].message.content;
    console.log('Extracted text:', extractedText);

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      // Fallback: try to extract basic info if JSON parsing fails
      extractedData = {
        item_name: "Unable to extract item details",
        purchase_price: null,
        purchase_date: null,
        vendor_store: "Unknown vendor",
        category: "Other",
        notes_purpose: "Manual review required"
      };
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