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
    const { appointmentData } = await req.json()
    
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
    
    if (!botToken || !chatId) {
      throw new Error('Missing Telegram configuration')
    }

    // Format the message
    const message = `🚗 NEW APPOINTMENT ${appointmentData.appointment_booked ? '✅ BOOKED' : '📝 NOTES ONLY'}

📞 Phone: ${appointmentData.customer_phone || 'N/A'}
${appointmentData.customer_address ? `📍 Address: ${appointmentData.customer_address}` : ''}
${appointmentData.paperwork ? `📄 Paperwork: ${appointmentData.paperwork}` : ''}

🚙 Vehicle: ${appointmentData.vehicle_year || 'N/A'} ${appointmentData.vehicle_make || 'N/A'} ${appointmentData.vehicle_model || 'N/A'}
💰 Quoted Price: ${appointmentData.estimated_price ? `$${appointmentData.estimated_price}` : 'N/A'}

📝 Notes:
${appointmentData.notes || 'No additional notes'}

⏰ Recorded: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}`

    // Create inline keyboard with Dante button
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "Dante", callback_data: `assign_worker_dante_${appointmentData.id}` }
        ]
      ]
    }

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard
      })
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`)
    }

    // Update the database to mark telegram as sent
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error: updateError } = await supabase
      .from('appointment_notes')
      .update({ telegram_sent: true })
      .eq('id', appointmentData.id)

    if (updateError) {
      console.error('Error updating telegram_sent flag:', updateError)
      // Don't throw here - Telegram was sent successfully
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending Telegram message:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})