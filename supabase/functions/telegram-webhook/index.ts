import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const update = await req.json()
    console.log('Received Telegram update:', JSON.stringify(update))
    
    // Check if this is a callback query (button click)
    if (!update.callback_query) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    const callbackQuery = update.callback_query
    const callbackData = callbackQuery.data
    
    // Parse callback data: assign_worker_{workerName}_{appointmentId}
    if (!callbackData.startsWith('assign_worker_')) {
      console.log('Unknown callback data:', callbackData)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    const parts = callbackData.split('_')
    if (parts.length !== 4) {
      console.log('Invalid callback data format:', callbackData)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }

    const workerName = parts[2] // angel, chino, or dante
    const appointmentId = parts[3]

    console.log(`Assigning appointment ${appointmentId} to worker ${workerName}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find the worker by name
    const { data: workers, error: workerError } = await supabase
      .from('workers')
      .select('id, name')
      .ilike('name', `%${workerName}%`)
      .limit(1)

    if (workerError) {
      console.error('Error finding worker:', workerError)
      throw new Error('Failed to find worker')
    }

    if (!workers || workers.length === 0) {
      console.error('Worker not found:', workerName)
      throw new Error(`Worker ${workerName} not found`)
    }

    const worker = workers[0]

    // Update the appointment with the assigned worker
    const { error: updateError } = await supabase
      .from('appointment_notes')
      .update({ assigned_worker_id: worker.id })
      .eq('id', appointmentId)

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      throw new Error('Failed to assign worker to appointment')
    }

    // Get Telegram bot token
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      throw new Error('Missing Telegram bot token')
    }

    // Edit the original message to show assignment
    const messageText = callbackQuery.message.text + `\n\n✅ Assigned to: ${worker.name}`
    
    const editResponse = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id,
        text: messageText,
        parse_mode: 'HTML'
      })
    })

    if (!editResponse.ok) {
      console.error('Failed to edit Telegram message:', await editResponse.text())
    }

    // Answer the callback query to remove the loading state
    const answerResponse = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: `✅ Assigned to ${worker.name}`,
        show_alert: false
      })
    })

    if (!answerResponse.ok) {
      console.error('Failed to answer callback query:', await answerResponse.text())
    }

    console.log(`Successfully assigned appointment ${appointmentId} to ${worker.name}`)

    return new Response(
      JSON.stringify({ success: true, assigned_to: worker.name }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing Telegram webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})