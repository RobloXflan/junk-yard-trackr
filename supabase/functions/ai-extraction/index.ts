import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcriptText, transcriptId } = await req.json();
    
    if (!transcriptText || !transcriptId) {
      throw new Error('Transcript text and ID are required');
    }

    console.log('Extracting data from transcript:', transcriptId);

    // AI prompt for extracting structured data
    const systemPrompt = `You are an expert AI assistant that extracts structured information from vehicle purchase conversations. 

From the conversation transcript, extract the following information with confidence scores (0.0 to 1.0):

1. VEHICLE INFORMATION:
   - vehicle_year: The year of the vehicle (e.g., "2015", "2020")
   - vehicle_make: The manufacturer (e.g., "Toyota", "Honda", "Ford")
   - vehicle_model: The specific model (e.g., "Camry", "Civic", "F-150")

2. PAPERWORK STATUS:
   - title_present: Whether they have the title (true/false)
   - registration: Whether they have registration
   - lien_paperwork: Whether they have lien or loan paperwork
   - junk_slip: Whether they have a junk slip
   - other_paperwork: Any other paperwork mentioned

3. CUSTOMER INFORMATION:
   - customer_name: Full name of the customer
   - customer_phone: Phone number
   - customer_address: Complete address including street, city, state, zip

4. FINANCIAL INFORMATION:
   - offered_price: How much was offered for the vehicle
   - asking_price: How much the customer is asking

5. VEHICLE CONDITION:
   - damage_notes: Any damage, broken parts, missing parts mentioned
   - vehicle_condition: Overall condition (running, not running, crashed, etc.)
   - additional_notes: Any other relevant details

Return ONLY a JSON object with this exact structure:
{
  "extractions": [
    {
      "field_name": "vehicle_year",
      "extracted_value": "2015",
      "confidence_score": 0.95,
      "ai_reasoning": "Customer clearly stated '2015 Honda Civic'"
    }
  ]
}

IMPORTANT: 
- Only extract information that is explicitly mentioned in the conversation
- If information is unclear or not mentioned, don't include it
- Use confidence scores based on how clearly the information was stated
- Be very conservative with confidence scores - only use 0.9+ for very clear statements`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract information from this conversation: "${transcriptText}"` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const extractedData = JSON.parse(result.choices[0].message.content);
    
    console.log('AI extracted data:', extractedData);

    // Store extracted data in database
    if (extractedData.extractions && extractedData.extractions.length > 0) {
      const insertData = extractedData.extractions.map((extraction: any) => ({
        transcript_id: transcriptId,
        field_name: extraction.field_name,
        extracted_value: extraction.extracted_value,
        confidence_score: extraction.confidence_score,
        ai_reasoning: extraction.ai_reasoning
      }));

      const { error: insertError } = await supabase
        .from('extracted_data_log')
        .insert(insertData);

      if (insertError) {
        console.error('Error storing extracted data:', insertError);
        throw insertError;
      }

      console.log(`Stored ${insertData.length} extractions for transcript ${transcriptId}`);
    }

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI extraction function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});