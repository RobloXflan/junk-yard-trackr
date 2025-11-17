import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExtractedData {
  vin?: string;
  licensePlate?: string;
  year?: string;
  make?: string;
  pageNumber?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;

    if (!pdfFile) {
      return new Response(
        JSON.stringify({ error: "No PDF file provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Processing PDF:", pdfFile.name, "Size:", pdfFile.size);

    // Convert PDF to base64
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    console.log("Calling AI for PDF analysis...");

    // Call Lovable AI to analyze the PDF
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a specialized document scanner that extracts vehicle information from California Certificate of Title documents. 
              
Your task is to:
1. Identify if any pages contain a California Certificate of Title (looks like an official government document with "CERTIFICATE OF TITLE" at the top)
2. Extract these specific fields ONLY from title pages:
   - VIN (Vehicle Identification Number) - usually labeled "VEHICLE ID NUMBER" - a 17-character alphanumeric code
   - License Plate Number - labeled "PLATE NUMBER"
   - Year - labeled "YR" or "YEAR"
   - Make - labeled "MAKE" (e.g., TOYT for Toyota, FORD, CHEV for Chevrolet)

Return a JSON array with one object per title page found. Each object should have:
{
  "pageNumber": 1,
  "vin": "extracted VIN or null",
  "licensePlate": "extracted plate or null", 
  "year": "extracted year or null",
  "make": "extracted make or null"
}

If no title pages are found, return an empty array [].
Be precise - only extract data from actual title documents, not from other pages.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this PDF and extract vehicle title information:",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${pdfBase64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));

    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: "No response from AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let extractedData: ExtractedData[];
    try {
      const parsed = JSON.parse(content);
      // Handle both array and object with results property
      extractedData = Array.isArray(parsed) ? parsed : (parsed.results || []);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      extractedData = [];
    }

    console.log("Extracted data:", extractedData);

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in scan-title-pdf:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
