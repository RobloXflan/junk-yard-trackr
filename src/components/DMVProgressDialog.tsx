
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Camera, X } from "lucide-react";

interface ProgressUpdate {
  type: 'progress' | 'screenshot' | 'error' | 'complete';
  vehicleId: string;
  message: string;
  screenshot?: string;
  timestamp: string;
  step?: number;
  totalSteps?: number;
}

interface DMVProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleIds: string[];
  onComplete: () => void;
}

export function DMVProgressDialog({ isOpen, onClose, vehicleIds, onComplete }: DMVProgressDialogProps) {
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedVehicles, setCompletedVehicles] = useState<Set<string>>(new Set());
  const [failedVehicles, setFailedVehicles] = useState<Set<string>>(new Set());
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && vehicleIds.length > 0) {
      startDMVSubmission();
    }
  }, [isOpen, vehicleIds]);

  const startDMVSubmission = async () => {
    setIsProcessing(true);
    setUpdates([]);
    setCompletedVehicles(new Set());
    setFailedVehicles(new Set());

    try {
      const response = await fetch('/functions/v1/dmv-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          vehicleIds,
          realTime: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start DMV submission');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const update: ProgressUpdate = JSON.parse(line.slice(6));
                setUpdates(prev => [...prev, update]);

                if (update.type === 'complete') {
                  setCompletedVehicles(prev => new Set(prev).add(update.vehicleId));
                } else if (update.type === 'error') {
                  setFailedVehicles(prev => new Set(prev).add(update.vehicleId));
                }
              } catch (e) {
                console.error('Error parsing update:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('DMV submission error:', error);
      setUpdates(prev => [...prev, {
        type: 'error',
        vehicleId: 'system',
        message: `System error: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsProcessing(false);
      onComplete();
    }
  };

  const getProgressPercentage = () => {
    const totalVehicles = vehicleIds.length;
    const processedVehicles = completedVehicles.size + failedVehicles.size;
    return (processedVehicles / totalVehicles) * 100;
  };

  const getUpdateIcon = (update: ProgressUpdate) => {
    switch (update.type) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'screenshot':
        return <Camera className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>DMV Submission Progress</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{completedVehicles.size + failedVehicles.size} / {vehicleIds.length} vehicles</span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{completedVehicles.size} completed</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>{failedVehicles.size} failed</span>
                </div>
              </div>
            </div>

            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-3">
                {updates.map((update, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-md bg-muted/50">
                    {getUpdateIcon(update)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{update.message}</span>
                        {update.step && update.totalSteps && (
                          <Badge variant="outline" className="text-xs">
                            {update.step}/{update.totalSteps}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(update.timestamp).toLocaleTimeString()} - Vehicle: {update.vehicleId}
                      </div>
                      {update.screenshot && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedScreenshot(update.screenshot!)}
                          className="h-6 px-2 text-xs"
                        >
                          <Camera className="w-3 h-3 mr-1" />
                          View Screenshot
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex items-center gap-3 p-2 rounded-md bg-blue-50">
                    <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span className="text-sm">Processing in real-time...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Close'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle>DMV Form Screenshot</DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedScreenshot(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>
            <div className="flex justify-center">
              <img 
                src={selectedScreenshot} 
                alt="DMV Form Screenshot" 
                className="max-w-full max-h-[70vh] object-contain border rounded-md"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
