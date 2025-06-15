
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VehicleData {
  id: string;
  year: string;
  make: string;
  model: string;
  vehicleId: string;
  licensePlate?: string;
  buyerFirstName: string;
  buyerLastName: string;
  salePrice: string;
  saleDate: string;
  purchasePrice?: string;
}

serve(async (req) => {
  console.log('DMV automation function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { vehicleIds } = await req.json();
    
    if (!vehicleIds || !Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Vehicle IDs are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch vehicle data
    const { data: vehicles, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .in('id', vehicleIds)
      .eq('status', 'sold')
      .not('buyer_first_name', 'is', null)
      .not('buyer_last_name', 'is', null);

    if (fetchError) {
      console.error('Error fetching vehicles:', fetchError);
      throw fetchError;
    }

    if (!vehicles || vehicles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No eligible vehicles found for DMV submission' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Process each vehicle
    for (const vehicle of vehicles) {
      console.log(`Processing vehicle ${vehicle.id}: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
      
      try {
        // Update status to processing
        await supabase
          .from('vehicles')
          .update({ dmv_status: 'processing' })
          .eq('id', vehicle.id);

        // Simulate DMV form submission (replace with actual Playwright automation)
        const dmvResult = await submitToDMV({
          id: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          vehicleId: vehicle.vehicle_id,
          licensePlate: vehicle.license_plate,
          buyerFirstName: vehicle.buyer_first_name,
          buyerLastName: vehicle.buyer_last_name,
          salePrice: vehicle.sale_price,
          saleDate: vehicle.sale_date,
          purchasePrice: vehicle.purchase_price
        });

        if (dmvResult.success) {
          // Update with success
          await supabase
            .from('vehicles')
            .update({
              dmv_status: 'submitted',
              dmv_confirmation_number: dmvResult.confirmationNumber,
              dmv_submitted_at: new Date().toISOString()
            })
            .eq('id', vehicle.id);

          results.push({
            vehicleId: vehicle.id,
            success: true,
            confirmationNumber: dmvResult.confirmationNumber
          });
        } else {
          // Update with failure
          await supabase
            .from('vehicles')
            .update({ dmv_status: 'failed' })
            .eq('id', vehicle.id);

          results.push({
            vehicleId: vehicle.id,
            success: false,
            error: dmvResult.error
          });
        }
      } catch (error) {
        console.error(`Error processing vehicle ${vehicle.id}:`, error);
        
        // Update with failure
        await supabase
          .from('vehicles')
          .update({ dmv_status: 'failed' })
          .eq('id', vehicle.id);

        results.push({
          vehicleId: vehicle.id,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        processed: results.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('DMV automation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function submitToDMV(vehicleData: VehicleData): Promise<{ success: boolean; confirmationNumber?: string; error?: string }> {
  try {
    console.log(`Submitting DMV form for vehicle: ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`);
    
    // This is where the actual Playwright automation would go
    // For now, simulating the DMV form submission
    
    // Calculate the sale price (purchase price + $100 or use provided sale price)
    let calculatedSalePrice = vehicleData.salePrice;
    if (vehicleData.purchasePrice && !vehicleData.salePrice) {
      const purchaseAmount = parseFloat(vehicleData.purchasePrice);
      calculatedSalePrice = (purchaseAmount + 100).toString();
    }

    // Simulate form data that would be submitted
    const formData = {
      // Seller Information (Americas Auto Towing)
      sellerIsCompany: 'Y',
      sellerCompanyName: 'Americas Auto Towing',
      sellerAddress: '4735 Cecilia St',
      sellerCity: 'Cudahy',
      sellerState: 'CA',
      sellerZip: '90201',
      
      // Buyer Information
      buyerIsCompany: 'N',
      buyerFirstName: vehicleData.buyerFirstName,
      buyerLastName: vehicleData.buyerLastName,
      
      // Vehicle Information
      vehicleYear: vehicleData.year,
      vehicleMake: vehicleData.make,
      vehicleModel: vehicleData.model,
      vehicleId: vehicleData.vehicleId,
      licensePlate: vehicleData.licensePlate || '',
      
      // Sale Information
      salePrice: calculatedSalePrice,
      saleDate: vehicleData.saleDate
    };

    console.log('Form data prepared:', formData);

    // TODO: Replace this simulation with actual Playwright automation
    // Here's where you would:
    // 1. Launch Playwright browser
    // 2. Navigate to https://www.dmv.ca.gov/wasapp/nrl/nrlApplication.do
    // 3. Fill out the form with the data above
    // 4. Submit the form
    // 5. Capture the confirmation number
    
    // For now, simulate a successful submission
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
    
    const confirmationNumber = `NRL${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    console.log(`DMV submission successful for vehicle ${vehicleData.id}, confirmation: ${confirmationNumber}`);
    
    return {
      success: true,
      confirmationNumber
    };

  } catch (error) {
    console.error('DMV submission failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
