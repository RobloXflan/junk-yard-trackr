
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { chromium } from "https://deno.land/x/playwright@1.41.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehicleData {
  id: string;
  year: string;
  make: string;
  model: string;
  vehicleId: string;
  licensePlate?: string;
  buyerFirstName: string;
  buyerLastName: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerState?: string;
  buyerZip?: string;
  salePrice: string;
  saleDate: string;
  purchasePrice?: string;
}

interface ProgressUpdate {
  vehicleId: string;
  step: string;
  status: 'in-progress' | 'completed' | 'error';
  message: string;
  screenshot?: string;
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

    // Fetch vehicle data with buyer address details
    const { data: vehicles, error: fetchError } = await supabase
      .from('vehicles')
      .select(`
        id, year, make, model, vehicle_id, license_plate, 
        buyer_first_name, buyer_last_name, sale_price, sale_date, purchase_price,
        status, dmv_status,
        buyer_address, buyer_city, buyer_state, buyer_zip
      `)
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

    // Process each vehicle with your Playwright script logic
    for (const vehicle of vehicles) {
      const progress: ProgressUpdate[] = [];
      
      const addProgress = (step: string, status: 'in-progress' | 'completed' | 'error', message: string, screenshot?: string) => {
        progress.push({ vehicleId: vehicle.id, step, status, message, screenshot });
        console.log(`${vehicle.id} - ${step}: ${message}`);
      };

      try {
        addProgress("init", "in-progress", "Starting DMV automation for vehicle");
        
        await supabase.from('vehicles').update({ dmv_status: 'processing' }).eq('id', vehicle.id);

        addProgress("browser", "in-progress", "Launching browser...");
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();

        addProgress("navigate", "in-progress", "Navigating to DMV website...");
        await page.goto("https://www.dmv.ca.gov/wasapp/nrl/nrlApplication.do");
        await page.waitForLoadState('networkidle');
        addProgress("navigate", "completed", "DMV website loaded");

        // Parse sale date from YYYY-MM-DD to month/day/year format
        const saleDate = new Date(vehicle.sale_date || '');
        const saleMonth = saleDate.toLocaleString('default', { month: 'long' });
        const saleDay = saleDate.getDate().toString();
        const saleYear = saleDate.getFullYear().toString();

        addProgress("form1", "in-progress", "Filling vehicle information...");
        
        // Fill vehicle data dynamically
        if (vehicle.license_plate) {
          await page.fill('input#licensePlateNumber', vehicle.license_plate);
        }
        await page.fill('input#vehicleIdentificationNumber', vehicle.vehicle_id);

        // Fill new owner data
        await page.fill('input#newOwnerFname', vehicle.buyer_first_name);
        await page.fill('input#newOwnerLname', vehicle.buyer_last_name);
        
        addProgress("form1", "completed", "Vehicle and owner info filled");

        // Take screenshot before first submit
        const screenshot1 = await page.screenshot({ type: 'png' });
        const screenshot1Base64 = `data:image/png;base64,${screenshot1.toString('base64')}`;
        
        addProgress("submit1", "in-progress", "Submitting first page...", screenshot1Base64);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        addProgress("submit1", "completed", "First page submitted");

        addProgress("form2", "in-progress", "Filling page 2...");
        // Click on the "Yes" label to activate the radio
        await page.click('label[for="y"]');

        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        addProgress("form2", "completed", "Page 2 submitted");

        addProgress("seller", "in-progress", "Setting up seller information...");
        // Toggle seller is a company
        await page.click('div.toggle-text--left');
        
        // Fill in the company information (FIXED - Americas Towing LLC)
        await page.fill('input#seller-company-name', 'Americas Towing LLC');
        await page.fill('input#sellerAddress', '4735 Cecilia St');
        await page.fill('input#sellerCity', 'Cudahy');
        await page.fill('input#sellerZip', '90201');
        addProgress("seller", "completed", "Seller information filled");

        addProgress("buyer", "in-progress", "Filling buyer information...");
        // Fill in the new owner information
        await page.fill('input#newOwnerFname', vehicle.buyer_first_name);
        await page.fill('input#newOwnerLname', vehicle.buyer_last_name);
        
        if (vehicle.buyer_address) {
          await page.fill('input#newOwnerAddress', vehicle.buyer_address);
        }
        if (vehicle.buyer_city) {
          await page.fill('input#newOwnerCity', vehicle.buyer_city);
        }
        if (vehicle.buyer_zip) {
          await page.fill('input#newOwnerZip', vehicle.buyer_zip);
        }
        addProgress("buyer", "completed", "Buyer information filled");

        addProgress("mileage", "in-progress", "Setting mileage...");
        await page.click('label[for="notActualMileage"]');
        addProgress("mileage", "completed", "Mileage set");

        addProgress("sale", "in-progress", "Filling sale information...");
        // Fill sale date
        await page.selectOption('select#saleMonth', { label: saleMonth });
        await page.fill('input#saleDay', saleDay);
        await page.fill('input#saleYear', saleYear);

        // Fill sale price
        await page.fill('input#sellingPrice', vehicle.sale_price || '');
        await page.click('label[for="gift_no"]');
        addProgress("sale", "completed", "Sale information filled");

        // Take screenshot before final submit
        const screenshot2 = await page.screenshot({ type: 'png' });
        const screenshot2Base64 = `data:image/png;base64,${screenshot2.toString('base64')}`;

        addProgress("final", "in-progress", "Submitting final form...", screenshot2Base64);
        await page.click('button#continue');
        await page.waitForLoadState('networkidle');

        // Wait a bit for the confirmation page to fully load
        await page.waitForTimeout(3000);

        addProgress("confirmation", "in-progress", "Processing confirmation...");
        const confirmationText = await page.textContent('body');
        let confirmationNumber: string | undefined = undefined;
        
        if (confirmationText && confirmationText.includes("Number")) {
          const match = confirmationText.match(/Number[:\s]+([A-Za-z0-9\-]+)/);
          if (match) confirmationNumber = match[1];
        } else {
          confirmationNumber = "MANUAL-VERIFY-" + Date.now();
        }

        // Take final screenshot of confirmation
        const screenshot3 = await page.screenshot({ type: 'png' });
        const screenshot3Base64 = `data:image/png;base64,${screenshot3.toString('base64')}`;
        
        addProgress("confirmation", "completed", `DMV submission completed. Confirmation: ${confirmationNumber}`, screenshot3Base64);

        await browser.close();

        // Update vehicle in DB
        await supabase
          .from('vehicles')
          .update({
            dmv_status: 'submitted',
            dmv_confirmation_number: confirmationNumber,
            dmv_submitted_at: new Date().toISOString()
          })
          .eq('id', vehicle.id);

        addProgress("complete", "completed", "Vehicle DMV status updated successfully");

        results.push({
          vehicleId: vehicle.id,
          success: true,
          confirmationNumber,
          progress
        });

      } catch (error) {
        addProgress("error", "error", `Error: ${error?.message || String(error)}`);
        await supabase.from('vehicles').update({ dmv_status: 'failed' }).eq('id', vehicle.id);
        
        results.push({
          vehicleId: vehicle.id,
          success: false,
          error: (error && error.message) || String(error),
          progress
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
