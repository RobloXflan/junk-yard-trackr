import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NHTSAMake {
  Make_ID: number;
  Make_Name: string;
}

interface NHTSAModel {
  Make_ID: number;
  Make_Name: string;
  Model_ID: number;
  Model_Name: string;
}

interface NHTSAResponse<T> {
  Count: number;
  Message: string;
  Results: T[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const make = url.searchParams.get('make');
    const year = url.searchParams.get('year');
    const query = url.searchParams.get('query')?.toLowerCase();

    console.log('Vehicle data request:', { action, make, year, query });

    if (action === 'makes') {
      // Fetch all vehicle makes
      const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
      const data: NHTSAResponse<NHTSAMake> = await response.json();
      
      let makes = data.Results.map(item => item.Make_Name).sort();
      
      // Filter by query if provided
      if (query) {
        makes = makes.filter(makeName => 
          makeName.toLowerCase().includes(query)
        );
      }
      
      // Limit to 10 results for performance
      makes = makes.slice(0, 10);
      
      console.log(`Returning ${makes.length} makes`);
      
      return new Response(JSON.stringify({ makes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'models' && make && year) {
      // Fetch models for specific make and year
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformakeyear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
      );
      const data: NHTSAResponse<NHTSAModel> = await response.json();
      
      let models = data.Results.map(item => item.Model_Name).sort();
      
      // Filter by query if provided
      if (query) {
        models = models.filter(modelName => 
          modelName.toLowerCase().includes(query)
        );
      }
      
      // Limit to 15 results for performance
      models = models.slice(0, 15);
      
      console.log(`Returning ${models.length} models for ${make} ${year}`);
      
      return new Response(JSON.stringify({ models }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Vehicle data error:', error);
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});