
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailWebhookPayload {
  from: string;
  subject: string;
  text: string;
  html: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    content: string; // base64 encoded
    size: number;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: EmailWebhookPayload = await req.json();
    console.log("Received email webhook:", { from: emailData.from, subject: emailData.subject });

    // Smart filtering logic
    const filterResult = await smartEmailFilter(emailData);
    
    if (!filterResult.shouldProcess) {
      // Log filtered out email
      await supabase.from('email_processing_logs').insert({
        email_from: emailData.from,
        email_subject: emailData.subject,
        processing_status: 'filtered_out',
        filter_reason: filterResult.reason
      });

      return new Response(JSON.stringify({ message: "Email filtered out", reason: filterResult.reason }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process attachments and create pending intake
    const processedDocuments = await processAttachments(emailData.attachments);
    const extractedInfo = extractVehicleInfo(emailData.text + " " + emailData.html);

    // Create pending intake record
    const { data: pendingIntake, error } = await supabase
      .from('pending_intakes')
      .insert({
        email_from: emailData.from,
        email_subject: emailData.subject,
        email_body: emailData.text,
        confidence_score: filterResult.confidence,
        documents: processedDocuments,
        extracted_info: extractedInfo
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log successful processing
    await supabase.from('email_processing_logs').insert({
      email_from: emailData.from,
      email_subject: emailData.subject,
      processing_status: 'processed',
      pending_intake_id: pendingIntake.id
    });

    console.log("Created pending intake:", pendingIntake.id);

    return new Response(JSON.stringify({ 
      message: "Email processed successfully", 
      pendingIntakeId: pendingIntake.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error processing email webhook:", error);
    
    // Log error
    await supabase.from('email_processing_logs').insert({
      email_from: "unknown",
      email_subject: "unknown",
      processing_status: 'error',
      error_message: error.message
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

async function smartEmailFilter(emailData: EmailWebhookPayload): Promise<{
  shouldProcess: boolean;
  confidence: number;
  reason?: string;
}> {
  let confidence = 0;
  const reasons: string[] = [];

  // Check for attachments
  if (!emailData.attachments || emailData.attachments.length === 0) {
    return { shouldProcess: false, confidence: 0, reason: "No attachments found" };
  }

  // Check attachment types and count
  const imageAttachments = emailData.attachments.filter(att => 
    att.contentType.startsWith('image/') || att.contentType === 'application/pdf'
  );

  if (imageAttachments.length === 0) {
    return { shouldProcess: false, confidence: 0, reason: "No image or PDF attachments found" };
  }

  confidence += imageAttachments.length * 20; // 20 points per relevant attachment

  // Check file sizes (typical scanned documents are larger)
  const largeDocs = imageAttachments.filter(att => att.size > 100000); // > 100KB
  confidence += largeDocs.length * 10;

  // Check subject line for keywords
  const subjectKeywords = ['vehicle', 'car', 'title', 'registration', 'dmv', 'auto', 'scan', 'document'];
  const subjectMatches = subjectKeywords.filter(keyword => 
    emailData.subject?.toLowerCase().includes(keyword)
  );
  confidence += subjectMatches.length * 15;

  // Check email content for keywords
  const contentKeywords = ['vin', 'year', 'make', 'model', 'mileage', 'title', 'registration'];
  const emailContent = (emailData.text + " " + emailData.html).toLowerCase();
  const contentMatches = contentKeywords.filter(keyword => emailContent.includes(keyword));
  confidence += contentMatches.length * 10;

  // Minimum confidence threshold
  const shouldProcess = confidence >= 30;
  
  return {
    shouldProcess,
    confidence: Math.min(confidence, 100),
    reason: shouldProcess ? undefined : `Low confidence score: ${confidence}`
  };
}

async function processAttachments(attachments: any[]): Promise<any[]> {
  const processedDocs = [];

  for (const attachment of attachments) {
    try {
      // Decode base64 content
      const fileContent = Uint8Array.from(atob(attachment.content), c => c.charCodeAt(0));
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${attachment.filename}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('email-attachments')
        .upload(fileName, fileContent, {
          contentType: attachment.contentType,
        });

      if (error) {
        console.error('Error uploading attachment:', error);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('email-attachments')
        .getPublicUrl(fileName);

      processedDocs.push({
        id: `email_doc_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
        name: attachment.filename,
        size: attachment.size,
        url: urlData.publicUrl,
        contentType: attachment.contentType
      });

    } catch (error) {
      console.error('Error processing attachment:', attachment.filename, error);
    }
  }

  return processedDocs;
}

function extractVehicleInfo(content: string): any {
  const info: any = {};
  
  // Extract VIN (17 character alphanumeric)
  const vinMatch = content.match(/\b[A-HJ-NPR-Z0-9]{17}\b/i);
  if (vinMatch) {
    info.vehicleId = vinMatch[0];
  }

  // Extract year (4 digits, likely between 1980-2030)
  const yearMatch = content.match(/\b(19[8-9]\d|20[0-3]\d)\b/);
  if (yearMatch) {
    info.year = yearMatch[0];
  }

  // Common car makes
  const makes = ['toyota', 'honda', 'ford', 'chevrolet', 'nissan', 'bmw', 'mercedes', 'audi', 'volkswagen'];
  for (const make of makes) {
    if (content.toLowerCase().includes(make)) {
      info.make = make.charAt(0).toUpperCase() + make.slice(1);
      break;
    }
  }

  return info;
}

serve(handler);
