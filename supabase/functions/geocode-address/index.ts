import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { placeId, address } = await req.json();
    
    if (!placeId && !address) {
      return new Response(
        JSON.stringify({ error: 'Either placeId or address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_MAPS_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let geocodeUrl: string;
    
    if (placeId) {
      geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${googleApiKey}`;
    } else {
      geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`;
    }

    console.log('Calling Google Geocoding API...');
    
    const response = await fetch(geocodeUrl);
    const geocodeData = await response.json();
    
    if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
      const location = geocodeData.results[0].geometry.location;
      const coordinates = { lat: location.lat, lng: location.lng };
      
      console.log('Successfully geocoded:', coordinates);
      
      return new Response(
        JSON.stringify({ 
          coordinates,
          formatted_address: geocodeData.results[0].formatted_address 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.error('Geocoding failed:', geocodeData.status, geocodeData.error_message);
      return new Response(
        JSON.stringify({ 
          error: 'Could not geocode address',
          details: geocodeData.error_message || geocodeData.status 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in geocode-address function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});