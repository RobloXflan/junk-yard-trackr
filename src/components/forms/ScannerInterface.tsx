
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scan, Camera, RotateCcw, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ScannerInterfaceProps {
  onScanComplete: (scannedFile: File) => void;
}

export function ScannerInterface({ onScanComplete }: ScannerInterfaceProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scannerAvailable, setScannerAvailable] = useState(false);

  useEffect(() => {
    // Check if scanner/camera is available
    checkScannerAvailability();
  }, []);

  const checkScannerAvailability = async () => {
    try {
      // Check if getUserMedia is available (for camera fallback)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        setScannerAvailable(true);
      }
    } catch (error) {
      console.log('Scanner check failed:', error);
      setScannerAvailable(false);
    }
  };

  const startScanning = async () => {
    if (!scannerAvailable) {
      toast({
        title: "Scanner Not Available",
        description: "No scanner or camera detected. Please use file upload instead.",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    setScannerOpen(true);

    try {
      // Use camera as scanner fallback
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      // Create video element for preview
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      
      // Wait for video to be ready
      video.onloadedmetadata = () => {
        // Create canvas to capture image
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0);
          
          // Convert to blob and create preview
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setPreviewImage(url);
            }
          }, 'image/jpeg', 0.9);
        }
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
    } catch (error) {
      console.error('Scanning failed:', error);
      toast({
        title: "Scanning Failed",
        description: "Unable to access camera. Please try file upload instead.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const captureImage = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setPreviewImage(url);
          }
        }, 'image/jpeg', 0.9);
      }
      
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Capture failed:', error);
      toast({
        title: "Capture Failed",
        description: "Unable to capture image from camera.",
        variant: "destructive",
      });
    }
  };

  const confirmScan = () => {
    if (previewImage) {
      // Convert blob URL to File
      fetch(previewImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `scanned-document-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          onScanComplete(file);
          resetScanner();
          toast({
            title: "Document Scanned",
            description: "Scanned document has been added successfully.",
          });
        });
    }
  };

  const resetScanner = () => {
    setScannerOpen(false);
    setPreviewImage(null);
    setScanning(false);
  };

  if (!scannerAvailable) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={startScanning}
        disabled={scanning}
        className="w-full"
      >
        <Scan className="w-4 h-4 mr-2" />
        {scanning ? 'Scanning...' : 'Scan Document'}
      </Button>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Scan Document
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {!previewImage ? (
              <div className="space-y-4">
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">Position your document in front of the camera</p>
                  <Button onClick={captureImage} disabled={scanning}>
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={previewImage} 
                    alt="Scanned document preview" 
                    className="w-full max-h-96 object-contain"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={confirmScan}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Use This Image
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setPreviewImage(null)}
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={resetScanner}
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
