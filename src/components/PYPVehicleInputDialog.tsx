import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Car } from "lucide-react";

interface PYPVehicleInputDialogProps {
  open: boolean;
  onClose: () => void;
  onVehicleSubmit: (vehicleData: any) => void;
  title?: string;
  initialData?: {
    year: string;
    make: string;
    model: string;
    vehicleId: string;
    saleDate?: string;
  };
}

export function PYPVehicleInputDialog({ 
  open, 
  onClose, 
  onVehicleSubmit,
  title = "Add Vehicle to PYP Trip",
  initialData
}: PYPVehicleInputDialogProps) {
  const [formData, setFormData] = useState({
    vehicleId: initialData?.vehicleId || '',
    year: initialData?.year || '',
    make: initialData?.make || '',
    model: initialData?.model || '',
    licensePlate: '',
    mileage: '',
    saleDate: initialData?.saleDate || new Date().toISOString().split('T')[0] // Use vehicle's sale date or today's date
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.vehicleId || !formData.year || !formData.make || !formData.model) {
      alert('Please fill in at least Vehicle ID, Year, Make, and Model');
      return;
    }

    onVehicleSubmit(formData);
    
    // Reset form
    setFormData({
      vehicleId: '',
      year: '',
      make: '',
      model: '',
      licensePlate: '',
      mileage: '',
      saleDate: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Vehicle Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleId">Vehicle ID *</Label>
                <Input
                  id="vehicleId"
                  value={formData.vehicleId}
                  onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                  placeholder="Enter vehicle ID/VIN"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="YYYY"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  placeholder="Vehicle make"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Vehicle model"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                  placeholder="License plate"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  value={formData.mileage}
                  onChange={(e) => handleInputChange('mileage', e.target.value)}
                  placeholder="Miles"
                />
              </div>
            </div>
          </div>

          {/* Sale Date */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Sale Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="saleDate">Sale Date</Label>
              <Input
                id="saleDate"
                type="date"
                value={formData.saleDate}
                onChange={(e) => handleInputChange('saleDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Vehicle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}