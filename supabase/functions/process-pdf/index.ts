
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

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert PDF to individual page images using a Python script
    const fileBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(fileBuffer)
    
    // Call Python service to process PDF
    const pythonServiceUrl = 'https://pdf-processor-service.vercel.app/process'
    
    const processingResponse = await fetch(pythonServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Filename': file.name,
      },
      body: uint8Array
    })

    if (!processingResponse.ok) {
      throw new Error('PDF processing failed')
    }

    const result = await processingResponse.json()
    
    // Create batch record
    const { data: batch, error: batchError } = await supabase
      .from('pdf_batches')
      .insert({
        filename: file.name,
        total_pages: result.pages.length,
        status: 'processed'
      })
      .select()
      .single()

    if (batchError) throw batchError

    // Create page records
    const pageRecords = result.pages.map((page: any, index: number) => ({
      batch_id: batch.id,
      page_number: index + 1,
      thumbnail_url: page.thumbnail_url,
      full_page_url: page.full_page_url,
      status: 'unassigned'
    }))

    const { data: pages, error: pagesError } = await supabase
      .from('pdf_pages')
      .insert(pageRecords)
      .select()

    if (pagesError) throw pagesError

    return new Response(
      JSON.stringify({ 
        batch_id: batch.id,
        pages: pages,
        message: `Successfully processed ${pages.length} pages`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('PDF processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
