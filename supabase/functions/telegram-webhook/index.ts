
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔔 TELEGRAM WEBHOOK TRIGGERED')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', Object.fromEntries(req.headers.entries()))

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.text()
    console.log('📥 Raw request body:', body)
    
    if (!body) {
      console.log('❌ Empty request body')
      return new Response('OK', { status: 200 })
    }

    const update = JSON.parse(body)
    console.log('📱 Parsed Telegram update:', JSON.stringify(update, null, 2))
    
    // Check if this is a callback query (button click)
    if (!update.callback_query) {
      console.log('ℹ️ Not a callback query, ignoring')
      return new Response('OK', { status: 200 })
    }

    const callbackQuery = update.callback_query
    const callbackData = callbackQuery.data
    console.log('🔘 Processing callback query:', callbackData)
    
    // Parse callback data: assign_worker_{workerName}_{appointmentId}
    if (!callbackData || !callbackData.startsWith('assign_worker_')) {
      console.log('❌ Unknown callback data format:', callbackData)
      
      // Answer callback to remove loading
      const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (botToken) {
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: '❌ Unknown command',
            show_alert: true
          })
        })
      }
      
      return new Response('OK', { status: 200 })
    }

    const parts = callbackData.split('_')
    console.log('📋 Callback data parts:', parts)
    
    if (parts.length !== 4) {
      console.log('❌ Invalid callback data format - expected 4 parts, got:', parts.length)
      return new Response('OK', { status: 200 })
    }

    const workerName = parts[2] // dante
    const appointmentId = parts[3]

    console.log(`👷 Assigning appointment ${appointmentId} to worker ${workerName}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials')
      return new Response('OK', { status: 200 })
    }
    
    console.log('🔗 Connecting to Supabase...')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Find the worker by name
    console.log('🔍 Looking up worker:', workerName)
    const { data: workers, error: workerError } = await supabase
      .from('workers')
      .select('id, name, phone')
      .ilike('name', `%${workerName}%`)
      .limit(1)

    if (workerError) {
      console.error('❌ Error finding worker:', workerError)
      return new Response('OK', { status: 200 })
    }

    if (!workers || workers.length === 0) {
      console.error('❌ Worker not found:', workerName)
      return new Response('OK', { status: 200 })
    }

    const worker = workers[0]
    console.log('✅ Found worker:', worker)

    // Get the full appointment details for SMS
    console.log('📋 Fetching appointment details:', appointmentId)
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointment_notes')
      .select('*')
      .eq('id', appointmentId)
      .maybeSingle()

    if (appointmentError) {
      console.error('❌ Error fetching appointment:', appointmentError)
      return new Response('OK', { status: 200 })
    }

    if (!appointment) {
      console.error('❌ Appointment not found:', appointmentId)
      return new Response('OK', { status: 200 })
    }

    console.log('✅ Found appointment:', appointment)

    // Update the appointment with the assigned worker
    console.log('💾 Updating appointment assignment...')
    const { error: updateError } = await supabase
      .from('appointment_notes')
      .update({ 
        assigned_worker_id: worker.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)

    if (updateError) {
      console.error('❌ Error updating appointment:', updateError)
      return new Response('OK', { status: 200 })
    }

    console.log('✅ Appointment updated successfully')

    // Send SMS to Dante if he's being assigned
    let smsStatus = ''
    if (workerName.toLowerCase() === 'dante') {
      console.log('📱 Sending SMS to Dante...')
      
      try {
        const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
        const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
        const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
        
        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
          console.error('❌ Missing Twilio configuration')
          smsStatus = ' (SMS failed - missing config)'
        } else {
          // Format SMS message with appointment details
          const smsMessage = `🚗 NEW APPOINTMENT ASSIGNED TO YOU

📞 Customer: ${appointment.customer_name || 'N/A'}
📞 Phone: ${appointment.customer_phone || 'N/A'}
${appointment.customer_address ? `📍 Address: ${appointment.customer_address}` : ''}
${appointment.paperwork ? `📄 Paperwork: ${appointment.paperwork}` : ''}

🚙 Vehicle: ${appointment.vehicle_year || 'N/A'} ${appointment.vehicle_make || 'N/A'} ${appointment.vehicle_model || 'N/A'}
💰 Price: ${appointment.estimated_price ? `$${appointment.estimated_price}` : 'N/A'}

📝 Notes: ${appointment.notes || 'No additional notes'}

⏰ Assigned: ${new Date().toLocaleString('en-US', { 
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})} PST`

          // Send SMS via Twilio
          console.log('📤 Sending SMS via Twilio...')
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: twilioPhoneNumber,
              To: '+13233527880', // Dante's phone number
              Body: smsMessage
            })
          })

          if (twilioResponse.ok) {
            const twilioResult = await twilioResponse.json()
            console.log('✅ SMS sent successfully:', twilioResult.sid)
            smsStatus = ' + SMS Sent ✓'
          } else {
            const twilioError = await twilioResponse.text()
            console.error('❌ Failed to send SMS:', twilioError)
            smsStatus = ' (SMS failed)'
          }
        }
      } catch (smsError) {
        console.error('💥 SMS sending error:', smsError)
        smsStatus = ' (SMS error)'
      }
    }

    // Get Telegram bot token
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!botToken) {
      console.error('❌ Missing Telegram bot token')
      return new Response('OK', { status: 200 })
    }

    console.log('📝 Updating Telegram message...')

    // Edit the original message to show assignment
    const messageText = callbackQuery.message.text + `\n\n✅ ASSIGNED TO: ${worker.name.toUpperCase()}${smsStatus}\n⏰ ${new Date().toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })} PST`
    
    const editResponse = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: callbackQuery.message.chat.id,
        message_id: callbackQuery.message.message_id,
        text: messageText,
        reply_markup: { inline_keyboard: [] } // Remove buttons
      })
    })

    if (editResponse.ok) {
      console.log('✅ Telegram message updated successfully')
    } else {
      console.error('❌ Failed to edit Telegram message:', await editResponse.text())
    }

    // Answer the callback query to remove the loading state
    console.log('📞 Answering callback query...')
    const answerResponse = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: `✅ Assigned to ${worker.name}${smsStatus}`,
        show_alert: false
      })
    })

    if (answerResponse.ok) {
      console.log('✅ Callback query answered successfully')
    } else {
      console.error('❌ Failed to answer callback query:', await answerResponse.text())
    }

    console.log(`🎉 SUCCESS: Assigned appointment ${appointmentId} to ${worker.name}${smsStatus}`)

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('💥 WEBHOOK ERROR:', error)
    console.error('Error stack:', error.stack)
    
    // Try to answer callback if we have the data
    try {
      const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
      if (botToken) {
        // Try to get callback query from the request
        const body = await req.text()
        if (body) {
          const update = JSON.parse(body)
          if (update.callback_query) {
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                callback_query_id: update.callback_query.id,
                text: '❌ Error processing request',
                show_alert: true
              })
            })
            console.log('✅ Answered callback query on error')
          }
        }
      }
    } catch (callbackError) {
      console.error('Failed to answer callback on error:', callbackError)
    }
    
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), { 
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
})
