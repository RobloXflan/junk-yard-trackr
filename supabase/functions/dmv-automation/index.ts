
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// Helper function to save progress to database
async function saveProgressToDb(supabase: any, vehicleId: string, step: string, status: string, screenshotUrl?: string, errorMessage?: string) {
  try {
    await supabase.from('dmv_automation_logs').insert({
      vehicle_id: vehicleId,
      step: step,
      status: status,
      screenshot_url: screenshotUrl,
      error_message: errorMessage
    });
  } catch (error) {
    console.error('Failed to save progress to database:', error);
  }
}

// Helper function to upload screenshot to Supabase storage
async function uploadScreenshot(supabase: any, vehicleId: string, step: string, screenshotBase64: string): Promise<string | null> {
  try {
    // Convert base64 to blob
    const base64Data = screenshotBase64.replace(/^data:image\/png;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `dmv-screenshots/${vehicleId}/${step}-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(fileName, binaryData, {
        contentType: 'image/png'
      });

    if (error) {
      console.error('Error uploading screenshot:', error);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadScreenshot:', error);
    return null;
  }
}

// Helper function to run automation script using Browserless
async function runDMVAutomation(browserlessToken: string, vehicle: any): Promise<{ success: boolean; screenshots: string[]; confirmationNumber?: string; error?: string }> {
  try {
    console.log('Starting DMV automation for vehicle:', vehicle.vehicle_id);
    
    // Parse sale date from YYYY-MM-DD to month/day/year format
    const saleDate = new Date(vehicle.sale_date || '');
    const saleMonth = saleDate.toLocaleString('default', { month: 'long' });
    const saleDay = saleDate.getDate().toString();
    const saleYear = saleDate.getFullYear().toString();

    console.log('Parsed sale date:', { saleMonth, saleDay, saleYear });

    // Properly escape variables for the automation script
    const vehicleData = {
      licensePlate: vehicle.license_plate || '',
      vehicleId: vehicle.vehicle_id || '',
      buyerFirstName: vehicle.buyer_first_name || '',
      buyerLastName: vehicle.buyer_last_name || '',
      buyerAddress: vehicle.buyer_address || '',
      buyerCity: vehicle.buyer_city || '',
      buyerZip: vehicle.buyer_zip || '',
      salePrice: vehicle.sale_price || '',
      saleMonth,
      saleDay,
      saleYear
    };

    const automationScript = `
      (async function() {
        console.log('Starting DMV automation script');
        const screenshots = [];
        
        try {
          // Navigate to DMV website
          console.log('Navigating to DMV website');
          await page.goto("https://www.dmv.ca.gov/wasapp/nrl/nrlApplication.do", { 
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          
          // Take initial screenshot
          console.log('Taking initial screenshot');
          const initialScreenshot = await page.screenshot({ 
            type: 'png', 
            encoding: 'base64',
            fullPage: true
          });
          screenshots.push(initialScreenshot);

          // Fill vehicle data
          console.log('Filling vehicle information');
          if ('${vehicleData.licensePlate}') {
            await page.waitForSelector('input#licensePlateNumber', { timeout: 10000 });
            await page.type('input#licensePlateNumber', '${vehicleData.licensePlate}');
          }
          
          await page.waitForSelector('input#vehicleIdentificationNumber', { timeout: 10000 });
          await page.type('input#vehicleIdentificationNumber', '${vehicleData.vehicleId}');

          // Fill new owner data
          await page.waitForSelector('input#newOwnerFname', { timeout: 10000 });
          await page.type('input#newOwnerFname', '${vehicleData.buyerFirstName}');
          
          await page.waitForSelector('input#newOwnerLname', { timeout: 10000 });
          await page.type('input#newOwnerLname', '${vehicleData.buyerLastName}');
          
          // Take screenshot after form 1
          console.log('Taking screenshot after form 1');
          const form1Screenshot = await page.screenshot({ 
            type: 'png', 
            encoding: 'base64',
            fullPage: true
          });
          screenshots.push(form1Screenshot);

          // Submit first page
          console.log('Submitting first page');
          await page.click('button[type="submit"]');
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

          // Click on the "Yes" label to activate the radio
          console.log('Clicking Yes option');
          await page.waitForSelector('label[for="y"]', { timeout: 10000 });
          await page.click('label[for="y"]');
          
          await page.click('button[type="submit"]');
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

          // Take screenshot after page 2
          console.log('Taking screenshot after page 2');
          const page2Screenshot = await page.screenshot({ 
            type: 'png', 
            encoding: 'base64',
            fullPage: true
          });
          screenshots.push(page2Screenshot);

          // Toggle seller is a company
          console.log('Setting seller as company');
          await page.waitForSelector('div.toggle-text--left', { timeout: 10000 });
          await page.click('div.toggle-text--left');
          
          // Fill in the company information (FIXED - Americas Towing LLC)
          await page.waitForSelector('input#seller-company-name', { timeout: 10000 });
          await page.type('input#seller-company-name', 'Americas Towing LLC');
          
          await page.waitForSelector('input#sellerAddress', { timeout: 10000 });
          await page.type('input#sellerAddress', '4735 Cecilia St');
          
          await page.waitForSelector('input#sellerCity', { timeout: 10000 });
          await page.type('input#sellerCity', 'Cudahy');
          
          await page.waitForSelector('input#sellerZip', { timeout: 10000 });
          await page.type('input#sellerZip', '90201');

          // Fill in the new owner information
          await page.waitForSelector('input#newOwnerFname', { timeout: 10000 });
          await page.evaluate(() => document.querySelector('input#newOwnerFname').value = '');
          await page.type('input#newOwnerFname', '${vehicleData.buyerFirstName}');
          
          await page.waitForSelector('input#newOwnerLname', { timeout: 10000 });
          await page.evaluate(() => document.querySelector('input#newOwnerLname').value = '');
          await page.type('input#newOwnerLname', '${vehicleData.buyerLastName}');
          
          if ('${vehicleData.buyerAddress}') {
            await page.waitForSelector('input#newOwnerAddress', { timeout: 10000 });
            await page.type('input#newOwnerAddress', '${vehicleData.buyerAddress}');
          }
          if ('${vehicleData.buyerCity}') {
            await page.waitForSelector('input#newOwnerCity', { timeout: 10000 });
            await page.type('input#newOwnerCity', '${vehicleData.buyerCity}');
          }
          if ('${vehicleData.buyerZip}') {
            await page.waitForSelector('input#newOwnerZip', { timeout: 10000 });
            await page.type('input#newOwnerZip', '${vehicleData.buyerZip}');
          }

          // Set mileage
          console.log('Setting mileage option');
          await page.waitForSelector('label[for="notActualMileage"]', { timeout: 10000 });
          await page.click('label[for="notActualMileage"]');

          // Fill sale date
          console.log('Filling sale date');
          await page.waitForSelector('select#saleMonth', { timeout: 10000 });
          await page.select('select#saleMonth', '${vehicleData.saleMonth}');
          
          await page.waitForSelector('input#saleDay', { timeout: 10000 });
          await page.type('input#saleDay', '${vehicleData.saleDay}');
          
          await page.waitForSelector('input#saleYear', { timeout: 10000 });
          await page.type('input#saleYear', '${vehicleData.saleYear}');

          // Fill sale price
          console.log('Filling sale price');
          await page.waitForSelector('input#sellingPrice', { timeout: 10000 });
          await page.type('input#sellingPrice', '${vehicleData.salePrice}');
          
          await page.waitForSelector('label[for="gift_no"]', { timeout: 10000 });
          await page.click('label[for="gift_no"]');

          // Take screenshot before final submit
          console.log('Taking screenshot before final submit');
          const finalFormScreenshot = await page.screenshot({ 
            type: 'png', 
            encoding: 'base64',
            fullPage: true
          });
          screenshots.push(finalFormScreenshot);

          // Submit final form
          console.log('Submitting final form');
          await page.waitForSelector('button#continue', { timeout: 10000 });
          await page.click('button#continue');
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

          // Wait for confirmation page
          await page.waitForTimeout(3000);

          // Take final screenshot
          console.log('Taking final confirmation screenshot');
          const confirmationScreenshot = await page.screenshot({ 
            type: 'png', 
            encoding: 'base64',
            fullPage: true
          });
          screenshots.push(confirmationScreenshot);

          // Get confirmation number
          const confirmationText = await page.evaluate(() => document.body.textContent);
          let confirmationNumber = "MANUAL-VERIFY-" + Date.now();
          
          if (confirmationText && confirmationText.includes("Number")) {
            const match = confirmationText.match(/Number[:\\s]+([A-Za-z0-9\\-]+)/);
            if (match) confirmationNumber = match[1];
          }

          console.log('DMV automation completed successfully, confirmation:', confirmationNumber);
          return { success: true, screenshots, confirmationNumber };
          
        } catch (error) {
          console.error('Error in automation script:', error);
          return { success: false, screenshots, error: error.message };
        }
      })();
    `;

    console.log('Making request to Browserless with updated endpoint');

    const response = await fetch(`https://production-sfo.browserless.io/function?token=${browserlessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: automationScript,
        context: {}
      })
    });

    console.log('Browserless response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Browserless error response:', errorText);
      throw new Error(`Browserless automation failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
    }

    const result = await response.json();
    console.log('Browserless automation result:', result);
    
    return result;
  } catch (error) {
    console.error('DMV automation error:', error);
    return { success: false, screenshots: [], error: error.message };
  }
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

    // Check for required API keys
    const browserlessToken = Deno.env.get('BROWSERLESS_API_KEY');
    if (!browserlessToken) {
      console.error('BROWSERLESS_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Browserless API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Browserless token configured, length:', browserlessToken.length);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching vehicles for DMV automation:', vehicleIds);

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

    console.log('Found vehicles for processing:', vehicles.length);

    const results = [];

    // Process each vehicle with Browserless
    for (const vehicle of vehicles) {
      const progress: ProgressUpdate[] = [];
      
      const addProgress = async (step: string, status: 'in-progress' | 'completed' | 'error', message: string, screenshot?: string) => {
        progress.push({ vehicleId: vehicle.id, step, status, message, screenshot });
        console.log(`${vehicle.id} - ${step}: ${message}`);
        
        // Save to database
        await saveProgressToDb(supabase, vehicle.id, step, status, screenshot, status === 'error' ? message : undefined);
      };

      try {
        await addProgress("init", "in-progress", "Starting DMV automation for vehicle");
        
        await supabase.from('vehicles').update({ dmv_status: 'processing' }).eq('id', vehicle.id);

        await addProgress("browserless", "in-progress", "Connecting to Browserless automation service...");
        
        // Run the automation using Browserless
        const automationResult = await runDMVAutomation(browserlessToken, vehicle);
        
        if (!automationResult.success) {
          throw new Error(automationResult.error || 'DMV automation failed');
        }

        await addProgress("automation", "completed", "DMV form automation completed successfully");

        // Upload screenshots to Supabase storage and save progress
        for (let i = 0; i < automationResult.screenshots.length; i++) {
          const screenshot = automationResult.screenshots[i];
          const stepName = ['initial', 'form1', 'form2', 'final'][i] || `step${i}`;
          
          const screenshotUrl = await uploadScreenshot(supabase, vehicle.id, stepName, `data:image/png;base64,${screenshot}`);
          await addProgress(stepName, "completed", `Screenshot captured for ${stepName}`, screenshotUrl);
        }

        const confirmationNumber = automationResult.confirmationNumber || "MANUAL-VERIFY-" + Date.now();

        // Update vehicle in DB
        await supabase
          .from('vehicles')
          .update({
            dmv_status: 'submitted',
            dmv_confirmation_number: confirmationNumber,
            dmv_submitted_at: new Date().toISOString()
          })
          .eq('id', vehicle.id);

        await addProgress("complete", "completed", `DMV submission completed. Confirmation: ${confirmationNumber}`);

        results.push({
          vehicleId: vehicle.id,
          success: true,
          confirmationNumber,
          progress
        });

      } catch (error) {
        console.error('DMV automation error for vehicle:', vehicle.id, error);
        
        await addProgress("error", "error", `Error: ${error?.message || String(error)}`);
        
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
