
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
        {results.error || (results.documentAnalysis && results.documentAnalysis.some(doc => doc.error)) ? (
          <div className="space-y-3">
            {results.error && (
              <div className="flex items-center gap-2 p-4 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <div>
                  <span className="text-sm font-medium text-destructive">Analysis Error: {results.error}</span>
                  {results.details && (
                    <p className="text-xs text-destructive mt-1">{results.details}</p>
                  )}
                  {results.suggestion && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">💡 {results.suggestion}</p>
                  )}
                </div>
              </div>
            )}
            
            {results.documentAnalysis && results.documentAnalysis.map((doc, index) => (
              doc.error && (
                <div key={index} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Document {index + 1} Error:</p>
                      <p className="text-sm text-orange-700">{doc.error}</p>
                      {doc.details && (
                        <p className="text-xs text-orange-600 mt-1">{doc.details}</p>
                      )}
                      {doc.suggestion && (
                        <p className="text-xs text-blue-600 mt-2 font-medium">💡 {doc.suggestion}</p>
                      )}
                      {!doc.suggestion && (
                        <p className="text-xs text-orange-500 mt-2">
                          The document could not be processed. Please ensure it's clear and try again.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Click on fields to select them, then apply to your form.
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
                    } ${
                      results.documentAnalysis?.some(doc => doc.note) 
                        ? 'bg-blue-50 border-blue-200' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{field.label}</p>
                        <p className="text-sm text-muted-foreground">{field.value}</p>
                        {results.documentAnalysis?.some(doc => doc.note) && (
                          <p className="text-xs text-blue-600 mt-1">
                            Sample data - please verify
                          </p>
                        )}
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
