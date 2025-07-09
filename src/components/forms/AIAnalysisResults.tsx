
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Sparkles, Copy } from "lucide-react";
import { AIAnalysisResult } from "@/services/aiDocumentAnalysis";

interface AIAnalysisResultsProps {
  results: AIAnalysisResult;
  onApplyData: (data: Partial<AIAnalysisResult>) => void;
  onClose: () => void;
}

export function AIAnalysisResults({ results, onApplyData, onClose }: AIAnalysisResultsProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  
  const getConfidenceBadge = (confidence?: string) => {
    const variant = confidence === 'high' ? 'default' : confidence === 'medium' ? 'secondary' : 'outline';
    const color = confidence === 'high' ? 'text-green-600' : confidence === 'medium' ? 'text-yellow-600' : 'text-gray-600';
    return <Badge variant={variant} className={color}>{confidence || 'unknown'} confidence</Badge>;
  };

  const extractedFields = [
    { key: 'year', label: 'Year', value: results.year },
    { key: 'make', label: 'Make', value: results.make },
    { key: 'model', label: 'Model', value: results.model },
    { key: 'vehicleId', label: 'Vehicle ID/VIN', value: results.vehicleId },
    { key: 'licensePlate', label: 'License Plate', value: results.licensePlate },
    { key: 'sellerName', label: 'Seller Name', value: results.sellerName },
    { key: 'purchaseDate', label: 'Purchase Date', value: results.purchaseDate },
    { key: 'purchasePrice', label: 'Purchase Price', value: results.purchasePrice },
    { key: 'titlePresent', label: 'Title Present', value: results.titlePresent ? 'Yes' : 'No' },
    { key: 'billOfSale', label: 'Bill of Sale', value: results.billOfSale ? 'Yes' : 'No' }
  ].filter(field => field.value !== null && field.value !== undefined);

  const toggleField = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey) 
        ? prev.filter(key => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleApplySelected = () => {
    const dataToApply: Partial<AIAnalysisResult> = {};
    selectedFields.forEach(key => {
      if (results[key as keyof AIAnalysisResult] !== null) {
        (dataToApply as any)[key] = results[key as keyof AIAnalysisResult];
      }
    });
    onApplyData(dataToApply);
    onClose();
  };

  const handleApplyAll = () => {
    onApplyData(results);
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Document Analysis Results
          {getConfidenceBadge(results.confidence)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.error ? (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm text-destructive">Error: {results.error}</span>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Click on fields to select them, then apply to your form:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {extractedFields.map((field) => (
                  <div
                    key={field.key}
                    onClick={() => toggleField(field.key)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedFields.includes(field.key)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{field.label}</p>
                        <p className="text-sm text-muted-foreground">{field.value}</p>
                      </div>
                      {selectedFields.includes(field.key) && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {extractedFields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No vehicle information could be extracted from the documents.</p>
                <p className="text-sm">Please check if the documents contain clear vehicle details.</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleApplyAll}
                disabled={extractedFields.length === 0}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Apply All Fields
              </Button>
              <Button
                onClick={handleApplySelected}
                disabled={selectedFields.length === 0}
                variant="outline"
                className="flex-1"
              >
                Apply Selected ({selectedFields.length})
              </Button>
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
