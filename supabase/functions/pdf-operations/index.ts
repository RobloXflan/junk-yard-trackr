
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

    switch (operation) {
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
