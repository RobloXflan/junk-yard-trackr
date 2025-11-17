import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { pageUrls } = await req.json();
    if (!pageUrls || !Array.isArray(pageUrls) || pageUrls.length === 0) {
      return new Response(JSON.stringify({ error: "No page URLs provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${pageUrls.length} page(s)...`);
    const extractedData: ExtractedData[] = [];

    for (let i = 0; i < pageUrls.length; i++) {
      const pageUrl = pageUrls[i];
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{
              role: "system",
              content: `Extract vehicle info from California title. Return JSON: {"isTitle": true/false, "vin": "...", "licensePlate": "...", "year": "...", "make": "..."}`
            }, {
              role: "user",
              content: [
                { type: "text", text: "Extract title info:" },
                { type: "image_url", image_url: { url: pageUrl } }
              ]
            }],
            response_format: { type: "json_object" },
          }),
        });

        if (!aiResponse.ok) {
          if (aiResponse.status === 429 || aiResponse.status === 402) {
            return new Response(JSON.stringify({ error: "Rate limit or credits exhausted" }), {
              status: aiResponse.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.isTitle) {
            extractedData.push({
              pageNumber: i + 1,
              vin: parsed.vin || undefined,
              licensePlate: parsed.licensePlate || undefined,
              year: parsed.year || undefined,
              make: parsed.make || undefined,
            });
          }
        }
      } catch (e) {
        console.error(`Error on page ${i + 1}:`, e);
      }
    }

    return new Response(JSON.stringify({ data: extractedData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
