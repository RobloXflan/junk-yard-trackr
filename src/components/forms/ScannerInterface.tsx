
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scan, Settings, Check, X, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Declare Dynamsoft types
declare global {
  interface Window {
    Dynamsoft: any;
  }
}

interface ScannerInterfaceProps {
  onScanComplete: (scannedFile: File) => void;
}

interface ScannerDevice {
  name: string;
  index: number;
}

export function ScannerInterface({ onScanComplete }: ScannerInterfaceProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scannerAvailable, setScannerAvailable] = useState(false);
  const [dwtObject, setDwtObject] = useState<any>(null);
  const [scanners, setScanners] = useState<ScannerDevice[]>([]);
  const [selectedScanner, setSelectedScanner] = useState<string>("");
  const [resolution, setResolution] = useState("300");
  const [colorMode, setColorMode] = useState("1"); // 1=Color, 2=Grayscale, 4=B&W
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeDWT();
    return () => {
      if (dwtObject) {
        dwtObject.Unload();
      }
    };
  }, []);

  const initializeDWT = async () => {
    try {
      // Load Dynamsoft Web TWAIN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/dwt@18.4.2/dist/dynamsoft.webtwain.min.js';
      script.onload = () => {
        console.log('DWT script loaded');
        setupDWT();
      };
      script.onerror = () => {
        console.error('Failed to load DWT script');
        setScannerAvailable(false);
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading DWT:', error);
      setScannerAvailable(false);
    }
  };

  const setupDWT = () => {
    if (window.Dynamsoft) {
      window.Dynamsoft.DWT.AutoLoad = false;
      window.Dynamsoft.DWT.ProductKey = 't0140cQMAAEJEeHh6ek14N2ozaGFkTER6eVB5aHpvQlNjVzJoVmE1YzVrcGY4Ym9kZ2Fubzl6NzMzVDNHdzhYVHpIZz09'; // Trial key
      window.Dynamsoft.DWT.ResourcesPath = 'https://cdn.jsdelivr.net/npm/dwt@18.4.2/dist/';
      window.Dynamsoft.DWT.Containers = [];
      
      window.Dynamsoft.DWT.CreateDWTObjectEx(
        {
          WebTwainId: 'dwtcontrol'
        },
        (obj: any) => {
          setDwtObject(obj);
          loadScanners(obj);
          setScannerAvailable(true);
          console.log('DWT initialized successfully');
        },
        (errorString: string) => {
          console.error('DWT initialization failed:', errorString);
          setScannerAvailable(false);
        }
      );
    }
  };

  const loadScanners = (dwt: any) => {
    const scannerList: ScannerDevice[] = [];
    const sourceCount = dwt.SourceCount;
    
    for (let i = 0; i < sourceCount; i++) {
      const sourceName = dwt.GetSourceNameItems(i);
      scannerList.push({
        name: sourceName,
        index: i
      });
      console.log(`Scanner ${i}: ${sourceName}`);
    }
    
    setScanners(scannerList);
    
    // Auto-select Epson scanner if found
    const epsonScanner = scannerList.find(scanner => 
      scanner.name.toLowerCase().includes('epson') || 
      scanner.name.toLowerCase().includes('es-580w')
    );
    
    if (epsonScanner) {
      setSelectedScanner(epsonScanner.index.toString());
      console.log('Auto-selected Epson scanner:', epsonScanner.name);
    } else if (scannerList.length > 0) {
      setSelectedScanner(scannerList[0].index.toString());
    }
  };

  const startScanning = () => {
    if (!dwtObject || !selectedScanner) {
      toast({
        title: "Scanner Not Ready",
        description: "Please select a scanner and try again.",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    setScannerOpen(true);
    performScan();
  };

  const performScan = async () => {
    try {
      const scannerIndex = parseInt(selectedScanner);
      
      // Select the scanner
      dwtObject.SelectSourceByIndex(scannerIndex);
      
      // Configure scan settings
      dwtObject.IfShowUI = false;
      dwtObject.Resolution = parseInt(resolution);
      dwtObject.PixelType = parseInt(colorMode);
      dwtObject.IfFeederEnabled = true; // Enable ADF for ES-580W
      dwtObject.IfDuplexEnabled = false; // Can be enabled for duplex scanning
      
      // Perform the scan
      dwtObject.OpenSource();
      dwtObject.AcquireImage(
        () => {
          console.log('Scan successful');
          // Convert scanned image to blob
          const imageCount = dwtObject.HowManyImagesInBuffer;
          if (imageCount > 0) {
            // Use the last scanned image
            const imageIndex = imageCount - 1;
            
            // Convert to blob
            dwtObject.ConvertToBlob(
              [imageIndex],
              1, // JPEG format
              (result: Blob) => {
                const url = URL.createObjectURL(result);
                setPreviewImage(url);
                setScanning(false);
                console.log('Image converted to blob successfully');
              },
              (errorCode: number, errorString: string) => {
                console.error('Blob conversion failed:', errorCode, errorString);
                handleScanError('Failed to process scanned image');
              }
            );
          } else {
            handleScanError('No image was scanned');
          }
          
          dwtObject.CloseSource();
        },
        (errorCode: number, errorString: string) => {
          console.error('Scan failed:', errorCode, errorString);
          handleScanError(`Scan failed: ${errorString}`);
          dwtObject.CloseSource();
        }
      );
    } catch (error) {
      console.error('Scanning error:', error);
      handleScanError('Scanner communication failed');
    }
  };

  const handleScanError = (message: string) => {
    setScanning(false);
    toast({
      title: "Scanning Failed",
      description: message,
      variant: "destructive",
    });
  };

  const confirmScan = () => {
    if (previewImage) {
      fetch(previewImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `epson-scan-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          onScanComplete(file);
          resetScanner();
          toast({
            title: "Document Scanned",
            description: "Scanned document from Epson scanner added successfully.",
          });
        });
    }
  };

  const resetScanner = () => {
    setScannerOpen(false);
    setPreviewImage(null);
    setScanning(false);
    setShowSettings(false);
    if (previewImage && previewImage.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage);
    }
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
        disabled={scanning || scanners.length === 0}
        className="w-full"
      >
        <Scan className="w-4 h-4 mr-2" />
        {scanning ? 'Scanning...' : 'Scan Document'}
      </Button>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Scanner - {scanners.find(s => s.index.toString() === selectedScanner)?.name || 'Unknown'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {!previewImage ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scanner-select">Scanner</Label>
                    <Select value={selectedScanner} onValueChange={setSelectedScanner}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scanner" />
                      </SelectTrigger>
                      <SelectContent>
                        {scanners.map((scanner) => (
                          <SelectItem key={scanner.index} value={scanner.index.toString()}>
                            {scanner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution (DPI)</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="150">150 DPI</SelectItem>
                        <SelectItem value="300">300 DPI</SelectItem>
                        <SelectItem value="600">600 DPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color-mode">Color Mode</Label>
                    <Select value={colorMode} onValueChange={setColorMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Color</SelectItem>
                        <SelectItem value="2">Grayscale</SelectItem>
                        <SelectItem value="4">Black & White</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Scan className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    Ready to scan from your Epson ES-580W scanner
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Place your document in the scanner and click scan
                  </p>
                  <Button onClick={performScan} disabled={scanning || !selectedScanner}>
                    <Scan className="w-4 h-4 mr-2" />
                    {scanning ? 'Scanning...' : 'Start Scan'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={previewImage} 
                    alt="Scanned document preview" 
                    className="w-full max-h-96 object-contain bg-gray-50"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={confirmScan}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Use This Document
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setPreviewImage(null);
                      performScan();
                    }}
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Scan Again
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
      
      <div ref={containerRef} id="dwtcontrol" style={{ display: 'none' }}></div>
    </>
  );
}
