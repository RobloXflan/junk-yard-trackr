import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

🚙 Vehicle: ${appointmentData.vehicle_year || 'N/A'} ${appointmentData.vehicle_make || 'N/A'} ${appointmentData.vehicle_model || 'N/A'}
💰 Quoted Price: ${appointmentData.estimated_price ? `$${appointmentData.estimated_price}` : 'N/A'}

📝 Notes:
${appointmentData.notes || 'No additional notes'}

⏰ Recorded: ${new Date().toLocaleString()}`

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
        parse_mode: 'HTML'
      })
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`)
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