
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pdfProcessingService } from '@/services/pdfProcessingService';
import { useNavigate } from 'react-router-dom';

interface VehicleBatch {
  id: string;
  name: string;
  pageIds: string[];
}

interface VehicleBatchManagerProps {
  selectedPages: string[];
  onPagesAssigned: () => void;
}

export function VehicleBatchManager({ selectedPages, onPagesAssigned }: VehicleBatchManagerProps) {
  const [vehicleBatches, setVehicleBatches] = useState<VehicleBatch[]>([]);
  const [newBatchName, setNewBatchName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const createVehicleBatch = () => {
    if (!newBatchName.trim()) {
      toast({
        title: "Batch name required",
        description: "Please enter a name for the vehicle batch.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPages.length === 0) {
      toast({
        title: "No pages selected",
        description: "Please select pages to assign to this batch.",
        variant: "destructive",
      });
      return;
    }

    const newBatch: VehicleBatch = {
      id: `batch_${Date.now()}`,
      name: newBatchName,
      pageIds: [...selectedPages]
    };

    setVehicleBatches([...vehicleBatches, newBatch]);
    setNewBatchName('');
    onPagesAssigned();

    toast({
      title: "Vehicle batch created",
      description: `Created batch "${newBatchName}" with ${selectedPages.length} pages.`,
    });
  };

  const sendToIntake = async (batch: VehicleBatch) => {
    try {
      // Here you would typically pass the page IDs to the intake form
      // For now, we'll navigate to the intake page
      navigate('/intake', { 
        state: { 
          documentPages: batch.pageIds,
          batchName: batch.name 
        } 
      });
    } catch (error) {
      console.error('Error sending to intake:', error);
      toast({
        title: "Error",
        description: "Failed to send batch to intake form.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Vehicle Batch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter batch name (e.g., Honda Civic, Blue Truck)"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={createVehicleBatch}
              disabled={selectedPages.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Batch
            </Button>
          </div>
          
          {selectedPages.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedPages.length} pages selected for this batch
            </div>
          )}
        </CardContent>
      </Card>

      {vehicleBatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Vehicle Batches</h3>
          
          {vehicleBatches.map((batch) => (
            <Card key={batch.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium">{batch.name}</h4>
                    <Badge variant="outline">
                      {batch.pageIds.length} pages
                    </Badge>
                  </div>
                  
                  <Button 
                    onClick={() => sendToIntake(batch)}
                    size="sm"
                  >
                    Send to Intake
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
