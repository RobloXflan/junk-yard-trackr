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

interface PlaceDetailsResponse {
  result: {
    formatted_address: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    place_id: string;
  };
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

    // Filter results for Southern California
    const southernCaliforniaCounties = [
      'los angeles', 'orange', 'riverside', 'san bernardino', 'ventura', 
      'kern', 'imperial', 'santa barbara', 'fresno', 'kings', 'tulare'
    ];

    const filteredPredictions = data.predictions
      .filter(prediction => {
        const description = prediction.description.toLowerCase();
        return southernCaliforniaCounties.some(county => 
          description.includes(county) || description.includes('ca') || description.includes('california')
        );
      })
      .slice(0, 5); // Limit to 5 for faster detailed lookups

    // Get detailed information for each prediction including zip codes
    const detailedResults = await Promise.all(
      filteredPredictions.map(async (prediction) => {
        try {
          const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
          detailsUrl.searchParams.set('place_id', prediction.place_id);
          detailsUrl.searchParams.set('fields', 'formatted_address,address_components');
          detailsUrl.searchParams.set('key', googleApiKey);
          
          const detailsResponse = await fetch(detailsUrl.toString());
          const detailsData: PlaceDetailsResponse = await detailsResponse.json();
          
          if (detailsData.status === 'OK') {
            // Extract zip code from address components
            const zipComponent = detailsData.result.address_components.find(component => 
              component.types.includes('postal_code')
            );
            
            return {
              display_name: detailsData.result.formatted_address,
              formatted_address: detailsData.result.formatted_address,
              place_id: prediction.place_id,
              main_text: prediction.structured_formatting.main_text,
              secondary_text: prediction.structured_formatting.secondary_text,
              types: prediction.types,
              zip_code: zipComponent?.long_name || null,
              has_zip: !!zipComponent
            };
          } else {
            // Fallback to original prediction if details fail
            return {
              display_name: prediction.description,
              formatted_address: prediction.description,
              place_id: prediction.place_id,
              main_text: prediction.structured_formatting.main_text,
              secondary_text: prediction.structured_formatting.secondary_text,
              types: prediction.types,
              zip_code: null,
              has_zip: false
            };
          }
        } catch (error) {
          console.error('Error fetching place details for', prediction.place_id, ':', error);
          // Fallback to original prediction
          return {
            display_name: prediction.description,
            formatted_address: prediction.description,
            place_id: prediction.place_id,
            main_text: prediction.structured_formatting.main_text,
            secondary_text: prediction.structured_formatting.secondary_text,
            types: prediction.types,
            zip_code: null,
            has_zip: false
          };
        }
      })
    );

    console.log(`Returning ${detailedResults.length} detailed results with zip codes`);

    return new Response(
      JSON.stringify({ suggestions: detailedResults }),
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