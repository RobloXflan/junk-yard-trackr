import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle, Settings } from "lucide-react";

export default function TelegramSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const { toast } = useToast();

  const setupWebhook = async () => {
    setIsLoading(true);
    try {
      console.log('🔧 Setting up Telegram webhook...');
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook');
      
      if (error) {
        console.error('❌ Setup error:', error);
        throw error;
      }

      console.log('✅ Setup successful:', data);
      setSetupResult(data);
      toast({
        title: "🎉 Webhook Setup Complete",
        description: "Telegram webhook configured successfully. Button clicks should work now!",
      });
    } catch (error) {
      console.error('💥 Setup failed:', error);
      toast({
        title: "❌ Setup Failed",
        description: error.message || "Failed to setup webhook. Check console for details.",
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
            <Settings className="w-5 h-5" />
            🤖 Telegram Webhook Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">🔧 Fix Telegram Button Issues</p>
            <p className="text-blue-700 text-sm mt-1">
              If Telegram buttons show "loading" forever, click this button to fix the webhook configuration.
            </p>
          </div>
          
          <Button 
            onClick={setupWebhook} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Setting up webhook...' : '🔧 Setup Telegram Webhook'}
          </Button>

          {setupResult && (
            <Card className="mt-4 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  ✅ Setup Successful!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="text-green-700">
                    <strong>🔗 Webhook URL:</strong> 
                    <div className="font-mono text-xs bg-green-100 p-2 rounded mt-1 break-all">
                      {setupResult.webhook_url}
                    </div>
                  </div>
                  {setupResult.webhook_info && (
                    <div className="text-green-700">
                      <strong>📊 Status:</strong> {setupResult.webhook_info.url ? '🟢 Active' : '🔴 Not Set'}
                    </div>
                  )}
                  <div className="bg-green-100 p-3 rounded border border-green-200">
                    <p className="text-green-800 font-medium">🎯 Next Steps:</p>
                    <ul className="text-green-700 text-xs mt-1 space-y-1">
                      <li>• Try clicking the "Dante" button in Telegram again</li>
                      <li>• It should now work without infinite loading</li>
                      <li>• Check the appointment gets assigned properly</li>
                    </ul>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      🔍 View Technical Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(setupResult, null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="text-xs text-muted-foreground">
            💡 This configures the webhook URL that Telegram uses to send button click events to your app.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}