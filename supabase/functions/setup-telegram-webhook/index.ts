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
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      throw new Error('Missing Telegram bot token')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    if (!supabaseUrl) {
      throw new Error('Missing Supabase URL')
    }

    // Extract project ID from Supabase URL
    const projectId = supabaseUrl.split('//')[1].split('.')[0]
    const webhookUrl = `https://${projectId}.supabase.co/functions/v1/telegram-webhook`

    console.log('Setting up Telegram webhook URL:', webhookUrl)

    // Set the webhook URL
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['callback_query', 'message']
      })
    })

    const result = await response.json()
    
    if (!response.ok || !result.ok) {
      console.error('Failed to set webhook:', result)
      throw new Error(`Failed to set webhook: ${result.description || 'Unknown error'}`)
    }

    console.log('Webhook setup successful:', result)

    // Get webhook info to verify
    const infoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`)
    const webhookInfo = await infoResponse.json()
    
    console.log('Current webhook info:', webhookInfo)

    return new Response(
      JSON.stringify({ 
        success: true, 
        webhook_url: webhookUrl,
        telegram_response: result,
        webhook_info: webhookInfo.result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error setting up Telegram webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})