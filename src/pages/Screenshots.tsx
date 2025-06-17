
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, Car, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Screenshot {
  id: string;
  vehicle_id: string;
  step: string;
  status: 'completed' | 'error' | 'in-progress';
  screenshot_url: string | null;
  created_at: string;
  error_message?: string;
  vehicle?: {
    year: string;
    make: string;
    model: string;
    vehicle_id: string;
  };
}

export function Screenshots() {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const { data: screenshots, isLoading } = useQuery({
    queryKey: ['dmv-screenshots'],
    queryFn: async () => {
      // Using any type to work around TypeScript issues until types are regenerated
      const { data, error } = await (supabase as any)
        .from('dmv_automation_logs')
        .select(`
          id,
          vehicle_id,
          step,
          status,
          screenshot_url,
          created_at,
          error_message,
          vehicles (
            year,
            make,
            model,
            vehicle_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Screenshot[];
    },
  });

  const groupedScreenshots = screenshots?.reduce((acc, screenshot) => {
    const vehicleKey = screenshot.vehicle?.vehicle_id || 'Unknown Vehicle';
    if (!acc[vehicleKey]) {
      acc[vehicleKey] = [];
    }
    acc[vehicleKey].push(screenshot);
    return acc;
  }, {} as Record<string, Screenshot[]>) || {};

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Eye className="w-6 h-6" />
          <h1 className="text-2xl font-bold">DMV Process Logs</h1>
        </div>
        <div className="text-center py-8">Loading process logs...</div>
      </div>
    );
  }

  if (!screenshots || screenshots.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Eye className="w-6 h-6" />
          <h1 className="text-2xl font-bold">DMV Process Logs</h1>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Process Logs Yet</h3>
            <p className="text-gray-500">DMV automation process logs will appear here when you run the automation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Eye className="w-6 h-6" />
          <h1 className="text-2xl font-bold">DMV Process Logs</h1>
        </div>

        <div className="grid gap-6">
          {Object.entries(groupedScreenshots).map(([vehicleKey, vehicleScreenshots]) => {
            const vehicle = vehicleScreenshots[0]?.vehicle;
            const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : vehicleKey;
            
            return (
              <Card key={vehicleKey}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    {vehicleName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    VIN: {vehicle?.vehicle_id || vehicleKey}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {vehicleScreenshots.map((screenshot) => (
                      <div key={screenshot.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(screenshot.status)}
                          <div className="flex-1">
                            <div className="font-medium capitalize">{screenshot.step}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {new Date(screenshot.created_at).toLocaleString()}
                            </div>
                            {screenshot.error_message && (
                              <div className="text-sm text-red-600 mt-1 max-w-lg">
                                <strong>Error:</strong> {screenshot.error_message}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(screenshot.status)}>
                            {screenshot.status}
                          </Badge>
                          {screenshot.screenshot_url ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedScreenshot(screenshot.screenshot_url)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Screenshot
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">No screenshot available</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

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
