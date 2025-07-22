import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download } from "lucide-react";

export function QRCodeDisplay() {
  const workerCheckinUrl = `${window.location.origin}/worker-checkin`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Worker Cash Report QR Code</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 40px;
                background: white;
              }
              .qr-container {
                border: 2px solid #333;
                padding: 30px;
                display: inline-block;
                border-radius: 10px;
              }
              h1 { margin-bottom: 20px; color: #333; }
              p { margin: 10px 0; color: #666; }
              .instructions {
                margin-top: 20px;
                font-size: 14px;
                line-height: 1.5;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>Daily Cash Report</h1>
              <div id="qr-code"></div>
              <div class="instructions">
                <p><strong>Instructions for Workers:</strong></p>
                <p>1. Scan this QR code with your phone camera</p>
                <p>2. Select your name (Angel, Chino, or Dante)</p>
                <p>3. Enter the money you reported today</p>
                <p>4. Enter the money given/received</p>
                <p>5. Submit your report</p>
              </div>
            </div>
          </body>
        </html>
      `);
      
      // Create QR code in the print window
      const qrCodeContainer = printWindow.document.getElementById('qr-code');
      if (qrCodeContainer) {
        qrCodeContainer.innerHTML = `
          <svg width="200" height="200" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
            <rect width="25" height="25" fill="white"/>
            <text x="12.5" y="12.5" text-anchor="middle" dominant-baseline="central" font-size="2">QR</text>
          </svg>
        `;
      }
      
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const svg = document.querySelector('#qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 300;
      canvas.height = 300;
      
      img.onload = () => {
        if (ctx) {
          ctx.drawImage(img, 0, 0, 300, 300);
          const pngFile = canvas.toDataURL('image/png');
          
          const downloadLink = document.createElement('a');
          downloadLink.download = 'worker-cash-qr-code.png';
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Worker Check-in QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg border">
            <QRCodeSVG
              id="qr-code-svg"
              value={workerCheckinUrl}
              size={200}
              level="M"
              includeMargin={true}
            />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Workers can scan this QR code to submit their daily check-in
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {workerCheckinUrl}
          </p>
        </div>

        <div className="flex gap-2 justify-center">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print QR Code
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PNG
          </Button>
        </div>

        <div className="mt-4 p-3 bg-muted rounded-md">
          <h4 className="font-medium text-sm mb-2">Instructions for Workers:</h4>
          <ol className="text-xs text-muted-foreground space-y-1">
            <li>1. Scan QR code with phone camera</li>
            <li>2. Select your name from the list</li>
            <li>3. Choose Yes or No for your response</li>
            <li>4. Submit your check-in</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}