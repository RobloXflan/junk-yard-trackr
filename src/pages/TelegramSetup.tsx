import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function TelegramSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const { toast } = useToast();

  const setupWebhook = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook');
      
      if (error) {
        throw error;
      }

      setSetupResult(data);
      toast({
        title: "Webhook Setup Complete",
        description: "Telegram webhook has been configured successfully",
      });
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup webhook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Telegram Webhook Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This will configure the Telegram webhook so that button clicks work properly.
            You only need to do this once.
          </p>
          
          <Button 
            onClick={setupWebhook} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Setup Telegram Webhook
          </Button>

          {setupResult && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Setup Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Webhook URL:</strong> {setupResult.webhook_url}
                  </div>
                  {setupResult.webhook_info && (
                    <div>
                      <strong>Current Status:</strong> {setupResult.webhook_info.url ? 'Active' : 'Not Set'}
                    </div>
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground">
                      View Full Response
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(setupResult, null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}