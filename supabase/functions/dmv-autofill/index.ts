import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehicleData {
  vehicleId: string;
  licensePlate: string;
  buyerFirstName: string;
  buyerLastName: string;
  buyerAddress: string;
  buyerCity: string;
  buyerState: string;
  buyerZip: string;
  saleDate: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BROWSERLESS_API_KEY = Deno.env.get('BROWSERLESS_API_KEY');
    if (!BROWSERLESS_API_KEY) {
      throw new Error('BROWSERLESS_API_KEY not configured');
    }

    const vehicleData: VehicleData = await req.json();
    
    // Validate required fields
    if (!vehicleData.licensePlate || !vehicleData.vehicleId) {
      return new Response(
        JSON.stringify({ error: 'License plate and VIN are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract last 5 of VIN
    const vinLast5 = vehicleData.vehicleId.slice(-5);
    const licensePlate = vehicleData.licensePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    console.log(`Processing DMV autofill for plate: ${licensePlate}, VIN last 5: ${vinLast5}`);

    // Use Browserless /function endpoint to run Puppeteer code
    // Browserless v2 uses /chrome/bql or we can use the /function API
    // Using the scrape/content API with Puppeteer-style actions
    
    const browserlessUrl = `https://chrome.browserless.io/function?token=${BROWSERLESS_API_KEY}`;

    const code = `
      module.exports = async ({ page }) => {
        const data = ${JSON.stringify({
          licensePlate,
          vinLast5,
          buyerFirstName: vehicleData.buyerFirstName || '',
          buyerLastName: vehicleData.buyerLastName || '',
          buyerAddress: vehicleData.buyerAddress || '',
          buyerCity: vehicleData.buyerCity || '',
          buyerState: vehicleData.buyerState || 'CA',
          buyerZip: vehicleData.buyerZip || '',
          saleDate: vehicleData.saleDate || '',
        })};

        // Step 1: Navigate to DMV NRL page
        await page.goto('https://www.dmv.ca.gov/wasapp/nrl/nrlApplication.do', {
          waitUntil: 'networkidle2',
          timeout: 30000,
        });

        // Step 2: Fill in license plate
        await page.waitForSelector('#licensePlateNumber', { timeout: 10000 });
        await page.type('#licensePlateNumber', data.licensePlate);

        // Step 3: Fill in last 5 of VIN
        await page.waitForSelector('#vehicleIdentificationNumber', { timeout: 10000 });
        await page.type('#vehicleIdentificationNumber', data.vinLast5);

        // Take screenshot of step 1 (filled)
        const step1Screenshot = await page.screenshot({ 
          encoding: 'base64',
          fullPage: false 
        });

        // Step 4: Submit the form
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
          page.click('button[type="submit"]'),
        ]);

        // Step 5: Check if we landed on the buyer info page
        const currentUrl = page.url();
        let step2Screenshot = null;
        let buyerFieldsFilled = false;
        let pageTitle = '';

        try {
          pageTitle = await page.title();
        } catch(e) {
          pageTitle = 'Unknown';
        }

        // Check for error messages on the page
        const errorText = await page.evaluate(() => {
          const errorEl = document.querySelector('.alert--error, .error, .alert--danger');
          return errorEl ? errorEl.textContent.trim() : null;
        });

        if (errorText) {
          return {
            type: 'application/json',
            data: {
              success: false,
              step: 1,
              error: errorText,
              screenshot: step1Screenshot,
              currentUrl,
            }
          };
        }

        // Try to fill buyer information on step 2
        // The DMV form field IDs may vary - we'll try common patterns
        try {
          // Wait for the page to load
          await page.waitForTimeout(2000);

          // Try to find and fill buyer fields
          // Common field patterns on DMV NRL step 2
          const fieldMappings = [
            { selector: '#buyerFirstName, input[name="buyerFirstName"], input[name="firstName"]', value: data.buyerFirstName },
            { selector: '#buyerLastName, input[name="buyerLastName"], input[name="lastName"]', value: data.buyerLastName },
            { selector: '#buyerAddress, input[name="buyerAddress"], input[name="address"], input[name="streetAddress"]', value: data.buyerAddress },
            { selector: '#buyerCity, input[name="buyerCity"], input[name="city"]', value: data.buyerCity },
            { selector: '#buyerZip, input[name="buyerZip"], input[name="zipCode"], input[name="zip"]', value: data.buyerZip },
          ];

          // Try state dropdown
          try {
            const stateSelector = '#buyerState, select[name="buyerState"], select[name="state"]';
            const stateEl = await page.$(stateSelector);
            if (stateEl) {
              await page.select(stateSelector, data.buyerState);
            }
          } catch(e) {
            console.log('Could not set state:', e.message);
          }

          // Try sale date
          try {
            const dateSelector = '#saleDate, input[name="saleDate"], input[name="dateOfSale"], input[name="transferDate"]';
            const dateEl = await page.$(dateSelector);
            if (dateEl) {
              // Format date as MM/DD/YYYY for DMV
              const parts = data.saleDate.split('-');
              if (parts.length === 3) {
                const formattedDate = parts[1] + '/' + parts[2] + '/' + parts[0];
                await dateEl.click({ clickCount: 3 });
                await dateEl.type(formattedDate);
              }
            }
          } catch(e) {
            console.log('Could not set sale date:', e.message);
          }

          for (const mapping of fieldMappings) {
            if (!mapping.value) continue;
            try {
              const el = await page.$(mapping.selector);
              if (el) {
                await el.click({ clickCount: 3 });
                await el.type(mapping.value);
                buyerFieldsFilled = true;
              }
            } catch(e) {
              console.log('Could not fill field:', mapping.selector, e.message);
            }
          }

          // Take screenshot of step 2
          step2Screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: true 
          });

        } catch(e) {
          console.log('Step 2 fill error:', e.message);
          // Still take a screenshot to see what happened
          step2Screenshot = await page.screenshot({ 
            encoding: 'base64',
            fullPage: true 
          });
        }

        // Get all visible form fields for debugging
        const visibleFields = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input, select, textarea');
          return Array.from(inputs).map(el => ({
            tag: el.tagName,
            type: el.getAttribute('type'),
            name: el.getAttribute('name'),
            id: el.getAttribute('id'),
            placeholder: el.getAttribute('placeholder'),
          }));
        });

        return {
          type: 'application/json',
          data: {
            success: true,
            step: buyerFieldsFilled ? 2 : 1,
            buyerFieldsFilled,
            currentUrl,
            pageTitle,
            step1Screenshot,
            step2Screenshot,
            visibleFields,
          }
        };
      };
    `;

    const browserlessResponse = await fetch(browserlessUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!browserlessResponse.ok) {
      const errorText = await browserlessResponse.text();
      console.error('Browserless error:', errorText);
      throw new Error(`Browserless returned ${browserlessResponse.status}: ${errorText}`);
    }

    const result = await browserlessResponse.json();

    // Upload screenshots to Supabase storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const screenshots: string[] = [];

    if (result.step1Screenshot) {
      const step1Bytes = Uint8Array.from(atob(result.step1Screenshot), c => c.charCodeAt(0));
      const step1Path = `dmv-screenshots/${Date.now()}_step1.png`;
      
      const { error: uploadError1 } = await supabase.storage
        .from('vehicle-documents')
        .upload(step1Path, step1Bytes, { contentType: 'image/png' });
      
      if (!uploadError1) {
        const { data: urlData1 } = supabase.storage.from('vehicle-documents').getPublicUrl(step1Path);
        screenshots.push(urlData1.publicUrl);
      }
    }

    if (result.step2Screenshot) {
      const step2Bytes = Uint8Array.from(atob(result.step2Screenshot), c => c.charCodeAt(0));
      const step2Path = `dmv-screenshots/${Date.now()}_step2.png`;
      
      const { error: uploadError2 } = await supabase.storage
        .from('vehicle-documents')
        .upload(step2Path, step2Bytes, { contentType: 'image/png' });
      
      if (!uploadError2) {
        const { data: urlData2 } = supabase.storage.from('vehicle-documents').getPublicUrl(step2Path);
        screenshots.push(urlData2.publicUrl);
      }
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        step: result.step,
        buyerFieldsFilled: result.buyerFieldsFilled,
        currentUrl: result.currentUrl,
        pageTitle: result.pageTitle,
        error: result.error,
        screenshots,
        visibleFields: result.visibleFields,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('DMV autofill error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
