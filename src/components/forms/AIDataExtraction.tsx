
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DocumentVisionService, ExtractedVehicleData } from "@/services/documentVisionService";
import { UploadedDocument } from "./DocumentUpload";

interface AIDataExtractionProps {
  uploadedDocuments: UploadedDocument[];
  onDataExtracted: (data: ExtractedVehicleData) => void;
}

export function AIDataExtraction({ uploadedDocuments, onDataExtracted }: AIDataExtractionProps) {
  const [extracting, setExtracting] = useState(false);
  const [lastExtraction, setLastExtraction] = useState<ExtractedVehicleData | null>(null);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return "bg-green-100 text-green-800 border-green-200";
    if (confidence >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 75) return "High";
    if (confidence >= 50) return "Medium";
    if (confidence > 0) return "Low";
    return "Not Found";
  };

  const handleExtractData = async () => {
    if (uploadedDocuments.length === 0) {
      toast({
        title: "No Documents",
        description: "Please upload a document first before extracting data.",
        variant: "destructive",
      });
      return;
    }

    setExtracting(true);

    try {
      // Use the first uploaded document for extraction
      const firstDocument = uploadedDocuments[0];
      
      console.log('Starting AI extraction for document:', firstDocument.name);
      
      // Convert document to image if needed
      let imageData: string;
      
      if (firstDocument.file.type === 'application/pdf') {
        // For PDFs, we need to process them first
        imageData = await DocumentVisionService.processDocumentToImage(firstDocument.file);
      } else if (firstDocument.file.type.startsWith('image/')) {
        // For images, convert to base64
        imageData = await DocumentVisionService.processDocumentToImage(firstDocument.file);
      } else {
        throw new Error('Unsupported file type for AI extraction');
      }

      // Extract vehicle data using GPT-4 Vision
      const extractedData = await DocumentVisionService.extractVehicleData(imageData);
      
      setLastExtraction(extractedData);
      onDataExtracted(extractedData);

      // Show success message with extraction summary
      const fieldsFound = Object.entries(extractedData.confidence)
        .filter(([_, confidence]) => confidence > 0).length;

      toast({
        title: "AI Extraction Complete",
        description: `Found ${fieldsFound} out of 5 vehicle fields. Review the data before saving.`,
      });

    } catch (error) {
      console.error('AI extraction error:', error);
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Failed to extract vehicle data",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">AI Vehicle Data Extraction</h3>
        </div>
        <Button
          onClick={handleExtractData}
          disabled={extracting || uploadedDocuments.length === 0}
          size="sm"
          className="gap-2"
        >
          {extracting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Extract Vehicle Data
            </>
          )}
        </Button>
      </div>

      {uploadedDocuments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Upload a document first to enable AI extraction
        </p>
      )}

      {lastExtraction && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Last Extraction Results
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Vehicle ID (Last 5):</span>
                <Badge className={getConfidenceColor(lastExtraction.confidence.vehicleId)}>
                  {getConfidenceLabel(lastExtraction.confidence.vehicleId)}
                </Badge>
              </div>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {lastExtraction.vehicleId || 'Not found'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Year:</span>
                <Badge className={getConfidenceColor(lastExtraction.confidence.year)}>
                  {getConfidenceLabel(lastExtraction.confidence.year)}
                </Badge>
              </div>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {lastExtraction.year || 'Not found'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Make:</span>
                <Badge className={getConfidenceColor(lastExtraction.confidence.make)}>
                  {getConfidenceLabel(lastExtraction.confidence.make)}
                </Badge>
              </div>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {lastExtraction.make || 'Not found'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Model:</span>
                <Badge className={getConfidenceColor(lastExtraction.confidence.model)}>
                  {getConfidenceLabel(lastExtraction.confidence.model)}
                </Badge>
              </div>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {lastExtraction.model || 'Not found'}
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">License Plate:</span>
                <Badge className={getConfidenceColor(lastExtraction.confidence.licensePlate)}>
                  {getConfidenceLabel(lastExtraction.confidence.licensePlate)}
                </Badge>
              </div>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {lastExtraction.licensePlate || 'Not found'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Review Before Saving</p>
              <p>AI-extracted data has been auto-filled in the form. Please verify accuracy before submission.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
