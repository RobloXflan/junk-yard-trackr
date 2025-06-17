
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Eye, RotateCcw, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface VehicleEditData {
  buyerFirstName: string;
  buyerLastName: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerState?: string;
  buyerZip?: string;
  salePrice: string;
  saleDate: string;
}

interface DMVProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Array<{ id: string; year: string; make: string; model: string; vehicleId: string; }>;
  onSubmit: (vehicleIds: string[]) => Promise<any>;
  onUpdateVehicle?: (vehicleId: string, data: VehicleEditData) => Promise<void>;
}

export function DMVProgressDialog({ isOpen, onClose, vehicles, onSubmit, onUpdateVehicle }: DMVProgressDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<DMVResult[]>([]);
  const [currentVehicleIndex, setCurrentVehicleIndex] = useState(0);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [editData, setEditData] = useState<VehicleEditData>({
    buyerFirstName: '',
    buyerLastName: '',
    buyerAddress: '',
    buyerCity: '',
    buyerState: 'CA',
    buyerZip: '',
    salePrice: '',
    saleDate: ''
  });
  const [retryingVehicles, setRetryingVehicles] = useState<Set<string>>(new Set());

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

  const handleRetry = async (vehicleId: string) => {
    if (!vehicleId) return;
    
    setRetryingVehicles(prev => new Set([...prev, vehicleId]));
    
    try {
      const response = await onSubmit([vehicleId]);
      
      if (response?.results) {
        // Update the results for this specific vehicle
        setResults(prev => prev.map(result => 
          result.vehicleId === vehicleId 
            ? response.results.find((r: DMVResult) => r.vehicleId === vehicleId) || result
            : result
        ));
      }
    } catch (error) {
      console.error('DMV retry failed:', error);
    } finally {
      setRetryingVehicles(prev => {
        const newSet = new Set(prev);
        newSet.delete(vehicleId);
        return newSet;
      });
    }
  };

  const handleEditVehicle = (vehicleId: string, currentData?: any) => {
    setEditingVehicle(vehicleId);
    if (currentData) {
      setEditData({
        buyerFirstName: currentData.buyerFirstName || '',
        buyerLastName: currentData.buyerLastName || '',
        buyerAddress: currentData.buyerAddress || '',
        buyerCity: currentData.buyerCity || '',
        buyerState: currentData.buyerState || 'CA',
        buyerZip: currentData.buyerZip || '',
        salePrice: currentData.salePrice || '',
        saleDate: currentData.saleDate || ''
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingVehicle || !onUpdateVehicle) return;
    
    try {
      await onUpdateVehicle(editingVehicle, editData);
      setEditingVehicle(null);
      setEditData({
        buyerFirstName: '',
        buyerLastName: '',
        buyerAddress: '',
        buyerCity: '',
        buyerState: 'CA',
        buyerZip: '',
        salePrice: '',
        saleDate: ''
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
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

  const getFailureScreenshots = (vehicleId: string) => {
    const result = results.find(r => r.vehicleId === vehicleId);
    if (!result || result.success) return [];
    
    return result.progress
      .filter(step => step.screenshot && step.status === 'error')
      .map(step => step.screenshot)
      .filter(Boolean);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                const hasFailed = result && !result.success && result.error;
                const isRetrying = retryingVehicles.has(vehicle.id);
                const failureScreenshots = getFailureScreenshots(vehicle.id);
                
                return (
                  <div key={vehicle.id} className={`border rounded-lg p-4 ${isActive ? 'border-blue-500 bg-blue-50' : hasFailed ? 'border-red-200 bg-red-50' : ''}`}>
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
                        {hasFailed && (
                          <>
                            <Badge variant="outline" className="text-red-600 border-red-600">
                              Failed
                            </Badge>
                            {onUpdateVehicle && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditVehicle(vehicle.id)}
                                className="h-6 px-2 text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit Info
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetry(vehicle.id)}
                              disabled={isRetrying}
                              className="h-6 px-2 text-xs"
                            >
                              <RotateCcw className={`w-3 h-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                              {isRetrying ? 'Retrying...' : 'Retry'}
                            </Button>
                          </>
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
                        
                        {/* Failure Screenshots Section */}
                        {hasFailed && failureScreenshots.length > 0 && (
                          <div className="mb-3 p-3 bg-red-100 border border-red-200 rounded">
                            <h5 className="text-sm font-medium text-red-800 mb-2">Failure Screenshots:</h5>
                            <div className="flex gap-2">
                              {failureScreenshots.map((screenshot, idx) => (
                                <Button
                                  key={idx}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedScreenshot(screenshot!)}
                                  className="h-8 px-3 text-xs border-red-300 hover:bg-red-200"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Error #{idx + 1}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
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

      {/* Vehicle Edit Dialog */}
      <Dialog open={!!editingVehicle} onOpenChange={() => setEditingVehicle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vehicle Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Buyer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buyerFirstName">First Name</Label>
                    <Input
                      id="buyerFirstName"
                      value={editData.buyerFirstName}
                      onChange={(e) => setEditData(prev => ({ ...prev, buyerFirstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyerLastName">Last Name</Label>
                    <Input
                      id="buyerLastName"
                      value={editData.buyerLastName}
                      onChange={(e) => setEditData(prev => ({ ...prev, buyerLastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="buyerAddress">Address</Label>
                  <Input
                    id="buyerAddress"
                    value={editData.buyerAddress}
                    onChange={(e) => setEditData(prev => ({ ...prev, buyerAddress: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="buyerCity">City</Label>
                    <Input
                      id="buyerCity"
                      value={editData.buyerCity}
                      onChange={(e) => setEditData(prev => ({ ...prev, buyerCity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyerState">State</Label>
                    <Input
                      id="buyerState"
                      value={editData.buyerState}
                      onChange={(e) => setEditData(prev => ({ ...prev, buyerState: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyerZip">ZIP Code</Label>
                    <Input
                      id="buyerZip"
                      value={editData.buyerZip}
                      onChange={(e) => setEditData(prev => ({ ...prev, buyerZip: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sale Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="salePrice">Sale Price</Label>
                    <Input
                      id="salePrice"
                      value={editData.salePrice}
                      onChange={(e) => setEditData(prev => ({ ...prev, salePrice: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="saleDate">Sale Date</Label>
                    <Input
                      id="saleDate"
                      type="date"
                      value={editData.saleDate}
                      onChange={(e) => setEditData(prev => ({ ...prev, saleDate: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditingVehicle(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Screenshot Modal */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>DMV Screenshot</DialogTitle>
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
