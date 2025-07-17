import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GooglePlacesResponse {
  predictions: Array<{
    description: string;
    place_id: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
    types: string[];
  }>;
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!googleApiKey) {
      console.error('Google Places API key not configured');
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Enhance query for better California results
    const enhancedQuery = query.includes('CA') || query.includes('California') 
      ? query 
      : `${query}, California`;

    // Google Places Autocomplete API call
    const googleUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    googleUrl.searchParams.set('input', enhancedQuery);
    googleUrl.searchParams.set('key', googleApiKey);
    googleUrl.searchParams.set('types', 'address');
    googleUrl.searchParams.set('components', 'country:us');
    googleUrl.searchParams.set('location', '34.0522,-118.2437'); // Los Angeles center
    googleUrl.searchParams.set('radius', '100000'); // 100km radius for Southern California bias

    console.log('Calling Google Places API with query:', enhancedQuery);

    const response = await fetch(googleUrl.toString());
    const data: GooglePlacesResponse = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status);
      return new Response(
        JSON.stringify({ error: `Google Places API error: ${data.status}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Filter and format results for Southern California
    const southernCaliforniaCounties = [
      'los angeles', 'orange', 'riverside', 'san bernardino', 'ventura', 
      'kern', 'imperial', 'santa barbara', 'fresno', 'kings', 'tulare'
    ];

    const filteredResults = data.predictions
      .filter(prediction => {
        const description = prediction.description.toLowerCase();
        return southernCaliforniaCounties.some(county => 
          description.includes(county) || description.includes('ca') || description.includes('california')
        );
      })
      .slice(0, 10) // Limit to 10 results
      .map(prediction => ({
        display_name: prediction.description,
        formatted_address: prediction.description,
        place_id: prediction.place_id,
        main_text: prediction.structured_formatting.main_text,
        secondary_text: prediction.structured_formatting.secondary_text,
        types: prediction.types
      }));

    console.log(`Returning ${filteredResults.length} filtered results`);

    return new Response(
      JSON.stringify({ suggestions: filteredResults }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in google-places function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});