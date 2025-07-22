
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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { image } = await req.json();

    if (!image) {
      throw new Error('No image provided');
    }

    console.log('Processing vehicle document with GPT-4 Vision...');

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
            content: `You are an expert at extracting vehicle information from DMV documents, titles, registrations, and bill of sale documents. 

Extract ONLY these fields from the document:
1. Vehicle ID: Last 5 digits/characters of the VIN (Vehicle Identification Number)
2. Year: Vehicle year (4 digits)
3. Make: Vehicle manufacturer (e.g., Honda, Toyota, Ford)
4. Model: Vehicle model (e.g., Civic, Camry, F-150)
5. License Plate: Current license plate number

Return your response as a JSON object with this exact structure:
{
  "vehicleId": "string (last 5 of VIN)",
  "year": "string",
  "make": "string", 
  "model": "string",
  "licensePlate": "string",
  "confidence": {
    "vehicleId": number (0-100),
    "year": number (0-100),
    "make": number (0-100),
    "model": number (0-100),
    "licensePlate": number (0-100)
  }
}

If a field cannot be found or is unclear, use an empty string and set confidence to 0.
For confidence scores: 100 = completely certain, 75+ = high confidence, 50-74 = medium confidence, below 50 = low confidence.

Focus on accuracy. If you're not confident about a value, it's better to return empty string than guess.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please extract the vehicle information from this document:'
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
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content;

    console.log('GPT-4 Vision response:', extractedText);

    // Parse the JSON response
    let extractedData;
    try {
      extractedData = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('Failed to parse GPT response as JSON:', extractedText);
      throw new Error('Failed to parse vehicle data from document');
    }

    // Validate the response structure
    const requiredFields = ['vehicleId', 'year', 'make', 'model', 'licensePlate', 'confidence'];
    for (const field of requiredFields) {
      if (!(field in extractedData)) {
        extractedData[field] = field === 'confidence' ? {
          vehicleId: 0,
          year: 0,
          make: 0,
          model: 0,
          licensePlate: 0
        } : '';
      }
    }

    console.log('Extracted vehicle data:', extractedData);

    return new Response(JSON.stringify(extractedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in vehicle-document-extraction function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      vehicleId: '',
      year: '',
      make: '',
      model: '',
      licensePlate: '',
      confidence: {
        vehicleId: 0,
        year: 0,
        make: 0,
        model: 0,
        licensePlate: 0
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
