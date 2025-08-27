
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import { ExtractedVehicleData } from '@/services/ocrService';

interface OCRResultsProps {
  extractedData: ExtractedVehicleData;
  onApplyData: (data: Partial<ExtractedVehicleData>) => void;
  onClose: () => void;
}

export function OCRResults({ extractedData, onApplyData, onClose }: OCRResultsProps) {
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'secondary';
    if (confidence > 0.8) return 'default';
    if (confidence > 0.6) return 'secondary';
    return 'destructive';
  };

  const getConfidenceText = (confidence?: number) => {
    if (!confidence) return 'Not found';
    if (confidence > 0.8) return 'High confidence';
    if (confidence > 0.6) return 'Medium confidence';
    return 'Low confidence';
  };

  const handleApplyField = (field: keyof ExtractedVehicleData, value: string) => {
    onApplyData({ [field]: value });
  };

  const handleApplyAll = () => {
    const dataToApply: Partial<ExtractedVehicleData> = {};
    if (extractedData.vehicleId) dataToApply.vehicleId = extractedData.vehicleId;
    if (extractedData.licensePlate) dataToApply.licensePlate = extractedData.licensePlate;
    if (extractedData.year) dataToApply.year = extractedData.year;
    if (extractedData.make) dataToApply.make = extractedData.make;
    if (extractedData.model) dataToApply.model = extractedData.model;
    
    onApplyData(dataToApply);
  };

  const hasAnyData = extractedData.vehicleId || extractedData.licensePlate || extractedData.year || extractedData.make || extractedData.model;

  return (
    <Card className="border-primary/20 bg-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="w-5 h-5 text-primary" />
          Scanned Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyData ? (
          <div className="text-center py-4">
            <XCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-600">No vehicle information could be extracted from this document.</p>
            <p className="text-sm text-slate-500 mt-1">Try uploading a clearer image or different document.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {extractedData.vehicleId && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Vehicle ID:</span>
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">{extractedData.vehicleId}</code>
                    </div>
                    <Badge variant={getConfidenceColor(extractedData.confidence.vehicleId)} className="mt-1">
                      {getConfidenceText(extractedData.confidence.vehicleId)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyField('vehicleId', extractedData.vehicleId!)}
                  >
                    Apply
                  </Button>
                </div>
              )}

              {extractedData.licensePlate && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">License Plate:</span>
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded">{extractedData.licensePlate}</code>
                    </div>
                    <Badge variant={getConfidenceColor(extractedData.confidence.licensePlate)} className="mt-1">
                      {getConfidenceText(extractedData.confidence.licensePlate)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyField('licensePlate', extractedData.licensePlate!)}
                  >
                    Apply
                  </Button>
                </div>
              )}

              {extractedData.year && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Year:</span>
                      <span className="text-sm bg-slate-100 px-2 py-1 rounded">{extractedData.year}</span>
                    </div>
                    <Badge variant={getConfidenceColor(extractedData.confidence.year)} className="mt-1">
                      {getConfidenceText(extractedData.confidence.year)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyField('year', extractedData.year!)}
                  >
                    Apply
                  </Button>
                </div>
              )}

              {extractedData.make && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Make:</span>
                      <span className="text-sm bg-slate-100 px-2 py-1 rounded">{extractedData.make}</span>
                    </div>
                    <Badge variant={getConfidenceColor(extractedData.confidence.make)} className="mt-1">
                      {getConfidenceText(extractedData.confidence.make)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyField('make', extractedData.make!)}
                  >
                    Apply
                  </Button>
                </div>
              )}

              {extractedData.model && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Model:</span>
                      <span className="text-sm bg-slate-100 px-2 py-1 rounded">{extractedData.model}</span>
                    </div>
                    <Badge variant={getConfidenceColor(extractedData.confidence.model)} className="mt-1">
                      {getConfidenceText(extractedData.confidence.model)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplyField('model', extractedData.model!)}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleApplyAll} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Apply All
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
