import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, FileText, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExtractedData {
  vin?: string;
  licensePlate?: string;
  year?: string;
  make?: string;
  pageNumber?: number;
}

interface TitlePDFScannerProps {
  onDataExtracted: (data: ExtractedData) => void;
}

export function TitlePDFScanner({ onDataExtracted }: TitlePDFScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setExtractedData([]);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
    }
  };

  const handleScan = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file first.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setExtractedData([]);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const { data, error } = await supabase.functions.invoke("scan-title-pdf", {
        body: formData,
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const results = data.data || [];
      setExtractedData(results);

      if (results.length === 0) {
        toast({
          title: "No Titles Found",
          description: "No vehicle title pages were detected in this PDF.",
        });
      } else {
        toast({
          title: "Scan Complete!",
          description: `Found ${results.length} vehicle title(s). Click one to auto-fill.`,
        });
      }
    } catch (error) {
      console.error("Scan error:", error);
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan PDF",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleUseData = (data: ExtractedData) => {
    onDataExtracted(data);
    toast({
      title: "Data Applied",
      description: "Vehicle information has been filled into the form.",
    });
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          AI Title Scanner
        </CardTitle>
        <CardDescription>
          Upload a PDF with vehicle titles - AI will extract VIN, license plate, year, and make
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          <Button
            onClick={handleScan}
            disabled={!file || isScanning}
            className="gap-2"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Scan PDF
              </>
            )}
          </Button>
        </div>

        {file && (
          <div className="text-sm text-muted-foreground">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </div>
        )}

        {extractedData.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="font-semibold text-sm">Extracted Titles:</h4>
            {extractedData.map((data, idx) => (
              <Card key={idx} className="bg-secondary/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Page {data.pageNumber || idx + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">VIN:</span>{" "}
                          {data.vin ? (
                            <span className="text-primary">{data.vin}</span>
                          ) : (
                            <XCircle className="inline w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Plate:</span>{" "}
                          {data.licensePlate ? (
                            <span className="text-primary">{data.licensePlate}</span>
                          ) : (
                            <XCircle className="inline w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Year:</span>{" "}
                          {data.year ? (
                            <span className="text-primary">{data.year}</span>
                          ) : (
                            <XCircle className="inline w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Make:</span>{" "}
                          {data.make ? (
                            <span className="text-primary">{data.make}</span>
                          ) : (
                            <XCircle className="inline w-4 h-4 text-destructive" />
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleUseData(data)}
                      className="gap-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Use This
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
