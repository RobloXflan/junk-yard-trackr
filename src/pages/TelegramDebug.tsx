import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bug, CheckCircle, AlertTriangle } from "lucide-react";

export default function TelegramDebug() {
  const [isLoading, setIsLoading] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const checkWebhookStatus = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Checking current webhook status...');
      
      // This will call the setup function which also checks current webhook info
      const { data, error } = await supabase.functions.invoke('setup-telegram-webhook');
      
      if (error) {
        throw error;
      }

      setWebhookInfo(data);
      console.log('📊 Webhook info:', data);
    } catch (error) {
      console.error('❌ Failed to check webhook:', error);
      toast({
        title: "❌ Check Failed",
        description: error.message || "Failed to check webhook status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhookDirectly = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing webhook directly...');
      
      // Simulate a callback query
      const testData = {
        callback_query: {
          id: "test_callback_123",
          data: "assign_worker_dante_c0b7896c-6252-4d11-a84e-424dee3bf5f2",
          message: {
            chat: { id: -1002345678901 },
            message_id: 123,
            text: "🚗 TEST APPOINTMENT\n\nCustomer: Test Customer\nPhone: 323-352-7880\nVehicle: 2020 Honda Civic\nPrice: $500"
          }
        }
      };

      const { data, error } = await supabase.functions.invoke('telegram-webhook', { 
        body: JSON.stringify(testData),
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('📤 Test result:', { data, error });
      
      setTestResult({ data, error, success: !error });
      
      if (error) {
        toast({
          title: "❌ Test Failed",
          description: error.message || "Webhook test failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Test Successful",
          description: "Webhook is working correctly!",
        });
      }
    } catch (error) {
      console.error('💥 Test error:', error);
      setTestResult({ error, success: false });
      toast({
        title: "❌ Test Error",
        description: error.message || "Test failed with error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            🔧 Telegram Webhook Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              onClick={checkWebhookStatus} 
              disabled={isLoading}
              variant="outline"
              className="h-20 flex-col"
            >
              {isLoading && <Loader2 className="w-4 h-4 mb-2 animate-spin" />}
              <div className="font-semibold">🔍 Check Webhook Status</div>
              <div className="text-xs text-muted-foreground">See current Telegram config</div>
            </Button>

            <Button 
              onClick={testWebhookDirectly} 
              disabled={isLoading}
              variant="outline"
              className="h-20 flex-col"
            >
              {isLoading && <Loader2 className="w-4 h-4 mb-2 animate-spin" />}
              <div className="font-semibold">🧪 Test Webhook</div>
              <div className="text-xs text-muted-foreground">Simulate button click</div>
            </Button>
          </div>

          {webhookInfo && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  📡 Current Webhook Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>🔗 Expected URL:</strong>
                    <div className="font-mono text-xs bg-blue-100 p-2 rounded mt-1 break-all">
                      {webhookInfo.webhook_url}
                    </div>
                  </div>
                  
                  {webhookInfo.webhook_info && (
                    <div>
                      <strong>📊 Telegram Says:</strong>
                      <div className="bg-blue-100 p-3 rounded mt-1">
                        <div>URL: {webhookInfo.webhook_info.url || '❌ Not set'}</div>
                        <div>Pending Updates: {webhookInfo.webhook_info.pending_update_count || 0}</div>
                        <div>Max Connections: {webhookInfo.webhook_info.max_connections || 'N/A'}</div>
                        {webhookInfo.webhook_info.last_error_date && (
                          <div className="text-red-600 mt-2">
                            ⚠️ Last Error: {new Date(webhookInfo.webhook_info.last_error_date * 1000).toLocaleString()}
                            <br />
                            {webhookInfo.webhook_info.last_error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {webhookInfo.webhook_info?.url !== webhookInfo.webhook_url && (
                    <div className="bg-yellow-100 border border-yellow-300 p-3 rounded">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle className="w-4 h-4" />
                        <strong>⚠️ Webhook URL Mismatch!</strong>
                      </div>
                      <div className="text-yellow-700 text-xs mt-1">
                        Telegram has a different URL configured. This is why buttons aren't working.
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {testResult && (
            <Card className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardHeader>
                <CardTitle className={`text-sm flex items-center gap-2 ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                  {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  {testResult.success ? "✅ Test Results: SUCCESS" : "❌ Test Results: FAILED"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm">
              <strong>🔍 Debugging Steps:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                <li>First, check webhook status to see current Telegram configuration</li>
                <li>If URL doesn't match, the webhook needs to be set up again</li>
                <li>Test the webhook directly to see if our function works</li>
                <li>If test works but Telegram doesn't, it's a webhook URL issue</li>
                <li>If test fails, there's an issue with our function code</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}