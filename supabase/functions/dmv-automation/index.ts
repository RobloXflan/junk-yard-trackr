import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { chromium } from "https://deno.land/x/playwright@1.45.0/mod.ts";

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
  salePrice: string;
  saleDate: string;
  purchasePrice?: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerState?: string;
  buyerZip?: string;
}

interface ProgressUpdate {
  type: 'progress' | 'screenshot' | 'error' | 'complete';
  vehicleId: string;
  message: string;
  screenshot?: string;
  timestamp: string;
  step?: number;
  totalSteps?: number;
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
    const { vehicleIds, realTime = false } = await req.json();

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

    // If real-time mode, set up streaming
    if (realTime) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const sendUpdate = (update: ProgressUpdate) => {
            const data = `data: ${JSON.stringify(update)}\n\n`;
            controller.enqueue(encoder.encode(data));
          };

          // Process vehicles with real-time updates
          processVehiclesRealTime(vehicleIds, supabase, sendUpdate).then(() => {
            controller.close();
          }).catch((error) => {
            const errorUpdate: ProgressUpdate = {
              type: 'error',
              vehicleId: 'system',
              message: `System error: ${error.message}`,
              timestamp: new Date().toISOString()
            };
            sendUpdate(errorUpdate);
            controller.close();
          });
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    }

    // Original non-real-time processing
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

    // Main DMV Automation for all vehicles
    for (const vehicle of vehicles) {
      const progress = [];
      try {
        progress.push("Marking vehicle 'processing' in DB");
        await supabase.from('vehicles').update({ dmv_status: 'processing' }).eq('id', vehicle.id);

        progress.push("Launching browser for DMV automation...");
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        progress.push("Navigating to DMV NRL form page...");
        await page.goto("https://www.dmv.ca.gov/wasapp/nrl/nrlApplication.do");
        await page.waitForLoadState("domcontentloaded");
        
        progress.push("Filling in form: Seller (Americas Auto Towing)");
        await page.fill('input[name="Company"]', "Americas Auto Towing");
        await page.fill('input[name="companyAddress"]', "4735 Cecilia St");
        await page.fill('input[name="companyCity"]', "Cudahy");
        await page.selectOption('select[name="companyState"]', "CA");
        await page.fill('input[name="companyZip"]', "90201");
        await page.check('input[name="c1"]'); // Seller is Company
        await page.uncheck('input[name="o1"]'); // Seller is not person

        progress.push("Filling in form: Buyer");
        await page.fill('input[name="buyerFName"]', vehicle.buyer_first_name);
        await page.fill('input[name="buyerLName"]', vehicle.buyer_last_name);
        await page.check('input[name="bc1"]'); // Buyer is NOT Company
        if (vehicle.buyer_address) await page.fill('input[name="buyerAddress"]', vehicle.buyer_address);
        if (vehicle.buyer_city) await page.fill('input[name="buyerCity"]', vehicle.buyer_city);
        if (vehicle.buyer_state) await page.selectOption('select[name="buyerState"]', vehicle.buyer_state);
        if (vehicle.buyer_zip) await page.fill('input[name="buyerZip"]', vehicle.buyer_zip);

        progress.push("Filling in form: Vehicle details");
        await page.fill('input[name="vehicleYear"]', vehicle.year);
        await page.fill('input[name="vehicleMake"]', vehicle.make);
        await page.fill('input[name="vehicleModel"]', vehicle.model);
        await page.fill('input[name="vehicleId"]', vehicle.vehicle_id);
        await page.fill('input[name="licensePlate"]', vehicle.license_plate ?? "");

        progress.push("Filling Sale Information");
        await page.fill('input[name="salePrice"]', vehicle.sale_price ?? "");
        await page.fill('input[name="saleDate"]', vehicle.sale_date ?? "");

        progress.push("Submitting DMV Form...");
        await page.click('input[type="submit"]');

        // Wait for confirmation page to load
        await page.waitForLoadState("networkidle");
        progress.push("Parsing DMV confirmation number...");
        const confirmationText = await page.textContent('body');
        let confirmationNumber: string | undefined = undefined;
        if (confirmationText && confirmationText.includes("Number")) {
          // Extract from confirmation page
          const match = confirmationText.match(/Number[:\s]+([A-Za-z0-9\-]+)/);
          if (match) confirmationNumber = match[1];
        } else {
          confirmationNumber = "UNKNOWN-" + Date.now();
        }
        
        await browser.close();

        // Update vehicle in DB
        progress.push("Updating DB: Set dmv_status to 'submitted' with confirmation number");
        await supabase
          .from('vehicles')
          .update({
            dmv_status: 'submitted',
            dmv_confirmation_number: confirmationNumber,
            dmv_submitted_at: new Date().toISOString()
          })
          .eq('id', vehicle.id);

        progress.push("DMV submission complete.");

        results.push({
          vehicleId: vehicle.id,
          success: true,
          confirmationNumber,
          progress
        });

      } catch (error) {
        progress.push("Error: " + (error?.message || String(error)));
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

async function processVehiclesRealTime(
  vehicleIds: string[], 
  supabase: any, 
  sendUpdate: (update: ProgressUpdate) => void
) {
  // Fetch vehicle data
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

  if (fetchError || !vehicles || vehicles.length === 0) {
    sendUpdate({
      type: 'error',
      vehicleId: 'system',
      message: 'No eligible vehicles found for DMV submission',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const totalSteps = 12; // Number of main steps per vehicle

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    let step = 0;

    try {
      // Step 1: Mark as processing
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: `Processing vehicle ${i + 1}/${vehicles.length}: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      await supabase.from('vehicles').update({ dmv_status: 'processing' }).eq('id', vehicle.id);

      // Step 2: Launch browser
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: 'Launching browser for DMV automation...',
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      // Step 3: Navigate to DMV
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: 'Navigating to DMV NRL form page...',
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      await page.goto("https://www.dmv.ca.gov/wasapp/nrl/nrlApplication.do");
      await page.waitForLoadState("domcontentloaded");

      // Take screenshot after page loads
      const initialScreenshot = await page.screenshot({ type: 'png' });
      sendUpdate({
        type: 'screenshot',
        vehicleId: vehicle.id,
        message: 'DMV form page loaded',
        screenshot: `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(initialScreenshot)))}`,
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      // Step 4: Fill seller info
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: 'Filling seller information (Americas Auto Towing)...',
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      await page.fill('input[name="Company"]', "Americas Auto Towing");
      await page.fill('input[name="companyAddress"]', "4735 Cecilia St");
      await page.fill('input[name="companyCity"]', "Cudahy");
      await page.selectOption('select[name="companyState"]', "CA");
      await page.fill('input[name="companyZip"]', "90201");
      await page.check('input[name="c1"]');
      await page.uncheck('input[name="o1"]');

      // Step 5: Fill buyer info
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: `Filling buyer information: ${vehicle.buyer_first_name} ${vehicle.buyer_last_name}...`,
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      await page.fill('input[name="buyerFName"]', vehicle.buyer_first_name);
      await page.fill('input[name="buyerLName"]', vehicle.buyer_last_name);
      await page.check('input[name="bc1"]');
      if (vehicle.buyer_address) await page.fill('input[name="buyerAddress"]', vehicle.buyer_address);
      if (vehicle.buyer_city) await page.fill('input[name="buyerCity"]', vehicle.buyer_city);
      if (vehicle.buyer_state) await page.selectOption('select[name="buyerState"]', vehicle.buyer_state);
      if (vehicle.buyer_zip) await page.fill('input[name="buyerZip"]', vehicle.buyer_zip);

      // Step 6: Fill vehicle details
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: `Filling vehicle details: ${vehicle.year} ${vehicle.make} ${vehicle.model}, VIN: ${vehicle.vehicle_id}...`,
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      await page.fill('input[name="vehicleYear"]', vehicle.year);
      await page.fill('input[name="vehicleMake"]', vehicle.make);
      await page.fill('input[name="vehicleModel"]', vehicle.model);
      await page.fill('input[name="vehicleId"]', vehicle.vehicle_id);
      await page.fill('input[name="licensePlate"]', vehicle.license_plate ?? "");

      // Step 7: Fill sale information
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: `Filling sale information: $${vehicle.sale_price} on ${vehicle.sale_date}...`,
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      await page.fill('input[name="salePrice"]', vehicle.sale_price ?? "");
      await page.fill('input[name="saleDate"]', vehicle.sale_date ?? "");

      // Take screenshot of filled form
      const filledFormScreenshot = await page.screenshot({ type: 'png' });
      sendUpdate({
        type: 'screenshot',
        vehicleId: vehicle.id,
        message: 'Form filled and ready for submission',
        screenshot: `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(filledFormScreenshot)))}`,
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      // Step 8: Submit form
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: 'Submitting form to DMV...',
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      await page.click('input[type="submit"]');

      // Step 9: Wait for confirmation
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: 'Waiting for DMV confirmation...',
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      await page.waitForLoadState("networkidle");

      // Step 10: Parse confirmation
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: 'Parsing DMV confirmation number...',
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      const confirmationText = await page.textContent('body');
      let confirmationNumber: string | undefined = undefined;
      if (confirmationText && confirmationText.includes("Number")) {
        const match = confirmationText.match(/Number[:\s]+([A-Za-z0-9\-]+)/);
        if (match) confirmationNumber = match[1];
      } else {
        confirmationNumber = "UNKNOWN-" + Date.now();
      }

      // Take screenshot of confirmation page
      const confirmationScreenshot = await page.screenshot({ type: 'png' });
      sendUpdate({
        type: 'screenshot',
        vehicleId: vehicle.id,
        message: `DMV confirmation received: ${confirmationNumber}`,
        screenshot: `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(confirmationScreenshot)))}`,
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      await browser.close();

      // Step 11: Update database
      step++;
      sendUpdate({
        type: 'progress',
        vehicleId: vehicle.id,
        message: 'Updating database with confirmation...',
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

      await supabase
        .from('vehicles')
        .update({
          dmv_status: 'submitted',
          dmv_confirmation_number: confirmationNumber,
          dmv_submitted_at: new Date().toISOString()
        })
        .eq('id', vehicle.id);

      // Step 12: Complete
      step++;
      sendUpdate({
        type: 'complete',
        vehicleId: vehicle.id,
        message: `DMV submission completed successfully! Confirmation: ${confirmationNumber}`,
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });

    } catch (error) {
      await supabase.from('vehicles').update({ dmv_status: 'failed' }).eq('id', vehicle.id);
      sendUpdate({
        type: 'error',
        vehicleId: vehicle.id,
        message: `Error: ${error?.message || String(error)}`,
        timestamp: new Date().toISOString(),
        step,
        totalSteps
      });
    }
  }
}
