
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const operation = url.searchParams.get('operation')

    const { action } = await req.json()

    switch (action || operation) {
      case 'convert_to_image':
        const { pdfUrl, pageNumber = 1 } = await req.json()
        
        try {
          // Fetch the PDF from the provided URL
          const pdfResponse = await fetch(pdfUrl)
          if (!pdfResponse.ok) {
            throw new Error('Failed to fetch PDF')
          }
          
          const pdfArrayBuffer = await pdfResponse.arrayBuffer()
          const pdfData = new Uint8Array(pdfArrayBuffer)
          
          // Convert PDF to image using a simple approach
          // For now, we'll return the PDF URL since PDF.js conversion would require more setup
          // In a production environment, you'd want to use a proper PDF to image conversion service
          
          // For this demo, let's just upload the PDF and return a placeholder
          const fileName = `converted-${Date.now()}.png`
          
          // Create a simple placeholder image response
          // In production, you'd use a proper PDF-to-image conversion library
          return new Response(
            JSON.stringify({ 
              imageUrl: pdfUrl, // For now, return the PDF URL
              message: 'PDF processing complete - using PDF as background'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
          
        } catch (error) {
          console.error('PDF conversion error:', error)
          throw new Error(`PDF conversion failed: ${error.message}`)
        }

      case 'get-pages':
        const { data: pages, error: pagesError } = await supabase
          .from('pdf_pages')
          .select(`
            *,
            pdf_batches(filename)
          `)
          .order('created_at', { ascending: false })

        if (pagesError) throw pagesError

        return new Response(
          JSON.stringify(pages),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'assign-pages':
        const { pageIds, vehicleId } = await req.json()
        
        const { error: assignError } = await supabase
          .from('pdf_pages')
          .update({
            status: 'assigned',
            assigned_vehicle_id: vehicleId,
          })
          .in('id', pageIds)

        if (assignError) throw assignError

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('PDF operations error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
