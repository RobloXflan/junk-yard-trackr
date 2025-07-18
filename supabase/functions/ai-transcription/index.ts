import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, appointmentNoteId } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio transcription for appointment:', appointmentNoteId);

    // Convert base64 to binary data
    const binaryAudio = atob(audio);
    const audioBytes = new Uint8Array(binaryAudio.length);
    for (let i = 0; i < binaryAudio.length; i++) {
      audioBytes[i] = binaryAudio.charCodeAt(i);
    }
    
    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    const blob = new Blob([audioBytes], { type: 'audio/wav' });
    formData.append('file', blob, 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');
    formData.append('language', 'en');

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    console.log('Transcription result:', result.text);

    // Store transcript in database if appointmentNoteId is provided
    let transcriptId = null;
    if (appointmentNoteId) {
      const { data: transcript, error: transcriptError } = await supabase
        .from('call_transcripts')
        .insert({
          appointment_note_id: appointmentNoteId,
          transcript_text: result.text,
          audio_duration: Math.floor(audioBytes.length / (24000 * 2)) // Rough estimate
        })
        .select()
        .single();

      if (transcriptError) {
        console.error('Error storing transcript:', transcriptError);
      } else {
        transcriptId = transcript.id;
        console.log('Transcript stored with ID:', transcriptId);
      }
    }

    // Extract structured data using AI
    if (transcriptId && result.text.trim()) {
      console.log('Calling AI extraction for transcript:', transcriptId);
      
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-extraction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            transcriptText: result.text,
            transcriptId: transcriptId
          }),
        });
      } catch (extractionError) {
        console.error('Error calling AI extraction:', extractionError);
        // Don't fail the main request if extraction fails
      }
    }

    return new Response(
      JSON.stringify({ 
        text: result.text,
        transcriptId: transcriptId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in transcription function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});