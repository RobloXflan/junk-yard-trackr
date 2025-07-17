import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehicleMake {
  Make_ID: number;
  Make_Name: string;
}

interface VehicleModel {
  Model_ID: number;
  Model_Name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    const query = url.searchParams.get('query') || '';
    const makeId = url.searchParams.get('makeId');
    const year = url.searchParams.get('year');

    console.log(`Vehicle data request: endpoint=${endpoint}, query=${query}, makeId=${makeId}, year=${year}`);

    let data = [];

    switch (endpoint) {
      case 'makes': {
        // Fetch all vehicle makes
        const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
        const result = await response.json();
        
        if (result.Results) {
          // Filter makes based on query if provided
          data = result.Results
            .filter((make: VehicleMake) => 
              !query || make.Make_Name.toLowerCase().includes(query.toLowerCase())
            )
            .map((make: VehicleMake) => ({
              id: make.Make_ID,
              name: make.Make_Name
            }))
            .slice(0, 10); // Limit to 10 results
        }
        break;
      }

      case 'models': {
        if (!makeId) {
          throw new Error('makeId is required for models endpoint');
        }

        // Fetch models for specific make and year
        let apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeid/${makeId}?format=json`;
        if (year) {
          apiUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeidyear/makeId/${makeId}/modelyear/${year}?format=json`;
        }

        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (result.Results) {
          // Filter models based on query if provided
          data = result.Results
            .filter((model: VehicleModel) => 
              !query || model.Model_Name.toLowerCase().includes(query.toLowerCase())
            )
            .map((model: VehicleModel) => ({
              id: model.Model_ID,
              name: model.Model_Name
            }))
            .slice(0, 15); // Limit to 15 results
        }
        break;
      }

      default:
        throw new Error('Invalid endpoint. Use "makes" or "models"');
    }

    console.log(`Returning ${data.length} results`);

    return new Response(
      JSON.stringify({ data }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Vehicle data error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch vehicle data',
        data: []
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});