
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVehicleStorePaginated } from '@/hooks/useVehicleStorePaginated';

interface VehicleAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (vehicleId: string, vehicleInfo: string) => void;
  selectedPagesCount: number;
}

export function VehicleAssignmentDialog({ 
  isOpen, 
  onClose, 
  onAssign, 
  selectedPagesCount 
}: VehicleAssignmentDialogProps) {
  const { vehicles } = useVehicleStorePaginated();
  const [assignmentType, setAssignmentType] = useState<'existing' | 'new'>('existing');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [newVehicle, setNewVehicle] = useState({
    year: '',
    make: '',
    model: '',
    vehicleId: ''
  });

  const handleAssign = () => {
    if (assignmentType === 'existing' && selectedVehicleId) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        const vehicleInfo = `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vehicleId})`;
        onAssign(selectedVehicleId, vehicleInfo);
      }
    } else if (assignmentType === 'new' && newVehicle.year && newVehicle.make && newVehicle.model && newVehicle.vehicleId) {
      // For now, we'll create a temporary ID and info string
      // In a real implementation, you'd create the vehicle first
      const tempId = `new_${Date.now()}`;
      const vehicleInfo = `${newVehicle.year} ${newVehicle.make} ${newVehicle.model} (${newVehicle.vehicleId})`;
      onAssign(tempId, vehicleInfo);
    }
  };

  const canAssign = assignmentType === 'existing' 
    ? selectedVehicleId 
    : newVehicle.year && newVehicle.make && newVehicle.model && newVehicle.vehicleId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assign {selectedPagesCount} Page{selectedPagesCount > 1 ? 's' : ''} to Vehicle
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Assignment Type</Label>
            <Select value={assignmentType} onValueChange={(value: 'existing' | 'new') => setAssignmentType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="existing">Existing Vehicle</SelectItem>
                <SelectItem value="new">New Vehicle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assignmentType === 'existing' ? (
            <div className="space-y-2">
              <Label>Select Vehicle</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vehicle..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.vehicleId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    placeholder="2020"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, year: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input
                    placeholder="Honda"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, make: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  placeholder="Civic"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle ID (Last 5 of VIN)</Label>
                <Input
                  placeholder="12345"
                  maxLength={5}
                  value={newVehicle.vehicleId}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, vehicleId: e.target.value.toUpperCase() }))}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!canAssign}>
            Assign Pages
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
