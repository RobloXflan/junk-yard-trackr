
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProgressStep {
  vehicleId: string;
  step: string;
  status: 'in-progress' | 'completed' | 'error';
  message: string;
  screenshot?: string;
}

interface DMVResult {
  vehicleId: string;
  success: boolean;
  confirmationNumber?: string;
  error?: string;
  progress: ProgressStep[];
}

interface DMVProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Array<{ id: string; year: string; make: string; model: string; vehicleId: string; }>;
  onSubmit: (vehicleIds: string[]) => Promise<any>;
}

export function DMVProgressDialog({ isOpen, onClose, vehicles, onSubmit }: DMVProgressDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<DMVResult[]>([]);
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResults([]);
    setCurrentVehicleIndex(0);

    try {
      const vehicleIds = vehicles.map(v => v.id);
      const response = await onSubmit(vehicleIds);
      
      if (response?.results) {
        setResults(response.results);
      }
    } catch (error) {
      console.error('DMV submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getOverallProgress = () => {
    if (!isSubmitting && results.length === 0) return 0;
    const completed = results.filter(r => r.success || r.error).length;
    return Math.round((completed / vehicles.length) * 100);
  };

  const getVehicleProgress = (vehicleId: string) => {
    const result = results.find(r => r.vehicleId === vehicleId);
    if (!result) return 0;
    
    const totalSteps = result.progress.length;
    const completedSteps = result.progress.filter(p => p.status === 'completed').length;
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DMV Automation Progress</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Overall Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {results.filter(r => r.success || r.error).length} / {vehicles.length} vehicles processed
                </span>
              </div>
              <Progress value={getOverallProgress()} className="w-full" />
            </div>

            {/* Vehicle Progress Cards */}
            <div className="space-y-4">
              {vehicles.map((vehicle, index) => {
                const result = results.find(r => r.vehicleId === vehicle.id);
                const isActive = index === currentVehicleIndex && isSubmitting;
                
                return (
                  <div key={vehicle.id} className={`border rounded-lg p-4 ${isActive ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h4>
                        <p className="text-sm text-muted-foreground">VIN: {vehicle.vehicleId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {result?.success && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Success
                          </Badge>
                        )}
                        {result?.error && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            Failed
                          </Badge>
                        )}
                        {isActive && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Processing
                          </Badge>
                        )}
                      </div>
                    </div>

                    {result && (
                      <>
                        <Progress value={getVehicleProgress(vehicle.id)} className="mb-3" />
                        
                        {/* Steps */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {result.progress.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-start gap-3 text-sm">
                              {getStatusIcon(step.status)}
                              <div className="flex-1">
                                <span className="font-medium capitalize">{step.step}:</span> {step.message}
                                {step.screenshot && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-6 px-2"
                                    onClick={() => setSelectedScreenshot(step.screenshot!)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {result.confirmationNumber && (
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-sm font-medium text-green-800">
                              Confirmation Number: {result.confirmationNumber}
                            </p>
                          </div>
                        )}

                        {result.error && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm font-medium text-red-800">
                              Error: {result.error}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {!isSubmitting && results.length === 0 && (
                <Button onClick={handleSubmit}>
                  Start DMV Automation
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screenshot Modal */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Screenshot</DialogTitle>
          </DialogHeader>
          {selectedScreenshot && (
            <div className="flex justify-center">
              <img 
                src={selectedScreenshot} 
                alt="DMV Form Screenshot" 
                className="max-w-full max-h-[70vh] object-contain border rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
