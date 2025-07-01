
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';

interface VehicleIntakeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (vehicleId: string) => void;
  selectedPages: number;
}

export function VehicleIntakeDialog({ 
  isOpen, 
  onClose, 
  onComplete, 
  selectedPages 
}: VehicleIntakeDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    year: '',
    make: '',
    model: '',
    vehicle_id: '',
    license_plate: '',
    seller_name: '',
    purchase_price: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.year || !formData.make || !formData.model || !formData.vehicle_id) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in year, make, model, and vehicle ID.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .insert({
          year: formData.year,
          make: formData.make,
          model: formData.model,
          vehicle_id: formData.vehicle_id,
          license_plate: formData.license_plate || null,
          seller_name: formData.seller_name || null,
          purchase_price: formData.purchase_price || null,
          notes: formData.notes || null,
          status: 'yard'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Vehicle Added Successfully",
        description: "Vehicle has been added to inventory.",
      });

      onComplete(vehicle.id);
    } catch (error) {
      console.error('Vehicle creation error:', error);
      toast({
        title: "Failed to Add Vehicle",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Vehicle Intake - {selectedPages} page(s) selected
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Vehicle Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="2020"
                required
              />
            </div>
            <div>
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleInputChange('make', e.target.value)}
                placeholder="Toyota"
                required
              />
            </div>
            <div>
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Camry"
                required
              />
            </div>
          </div>

          {/* Vehicle ID and License */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle_id">Vehicle ID *</Label>
              <Input
                id="vehicle_id"
                value={formData.vehicle_id}
                onChange={(e) => handleInputChange('vehicle_id', e.target.value)}
                placeholder="VIN or internal ID"
                required
              />
            </div>
            <div>
              <Label htmlFor="license_plate">License Plate</Label>
              <Input
                id="license_plate"
                value={formData.license_plate}
                onChange={(e) => handleInputChange('license_plate', e.target.value)}
                placeholder="ABC123"
              />
            </div>
          </div>

          {/* Seller and Purchase Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="seller_name">Seller Name</Label>
              <Input
                id="seller_name"
                value={formData.seller_name}
                onChange={(e) => handleInputChange('seller_name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                value={formData.purchase_price}
                onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                placeholder="$1000"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes about the vehicle..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Vehicle & Assign Pages'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
