
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Car, 
  Calendar, 
  DollarSign, 
  FileText, 
  MapPin, 
  User,
  Phone,
  Mail,
  CreditCard,
  Package
} from 'lucide-react';
import { Vehicle, CarImage } from '@/stores/vehicleStore';
import { useVehicleStore } from '@/hooks/useVehicleStore';
import { CarImagesUpload } from '@/components/CarImagesUpload';
import { BuyerSelector } from '@/components/forms/BuyerSelector';
import { Buyer } from '@/hooks/useBuyers';
import { toast } from 'sonner';

interface VehicleDetailsDialogProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (vehicleId: string, newStatus: Vehicle['status'], soldData?: any) => void;
  isViewOnly?: boolean;
}

export function VehicleDetailsDialog({ 
  vehicle, 
  isOpen, 
  onClose, 
  onStatusUpdate,
  isViewOnly = false 
}: VehicleDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [buyerSelectorOpen, setBuyerSelectorOpen] = useState(false);
  const { updateVehicleCarImages } = useVehicleStore();

  if (!vehicle) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'yard': return 'bg-blue-500';
      case 'sold': return 'bg-green-500';
      case 'pick-your-part': return 'bg-orange-500';
      case 'sa-recycling': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCarImagesUpdate = async (images: CarImage[]) => {
    try {
      await updateVehicleCarImages(vehicle.id, images);
      toast.success('Car images updated successfully');
    } catch (error) {
      console.error('Error updating car images:', error);
      toast.error('Failed to update car images');
    }
  };

  const handleStatusChange = async (newStatus: Vehicle['status']) => {
    if (newStatus === 'sold') {
      setBuyerSelectorOpen(true);
    } else if (onStatusUpdate) {
      try {
        await onStatusUpdate(vehicle.id, newStatus);
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
  };

  const handleBuyerSelected = async (buyer: Buyer, salePrice: string, saleDate: string) => {
    if (onStatusUpdate) {
      try {
        const soldData = {
          buyerFirstName: buyer.first_name,
          buyerLastName: buyer.last_name,
          buyerAddress: buyer.address,
          buyerCity: buyer.city || '',
          buyerState: buyer.state || 'CA',
          buyerZip: buyer.zip_code || '',
          salePrice,
          saleDate
        };
        await onStatusUpdate(vehicle.id, 'sold', soldData);
        setBuyerSelectorOpen(false);
      } catch (error) {
        console.error('Error updating to sold:', error);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Car className="w-5 h-5" />
                {vehicle.year} {vehicle.make} {vehicle.model}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(vehicle.status)} text-white`}>
                  {vehicle.status.toUpperCase()}
                </Badge>
                {!isViewOnly && (
                  <Button 
                    variant={isEditing ? "secondary" : "outline"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'View Mode' : 'Edit Mode'}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Status Change Buttons */}
          {!isViewOnly && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={vehicle.status === 'yard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('yard')}
                disabled={vehicle.status === 'yard'}
              >
                Mark as In Yard
              </Button>
              <Button
                variant={vehicle.status === 'sold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('sold')}
                disabled={vehicle.status === 'sold'}
              >
                Mark as Sold
              </Button>
              <Button
                variant={vehicle.status === 'pick-your-part' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('pick-your-part')}
                disabled={vehicle.status === 'pick-your-part'}
              >
                Send to Pick Your Part
              </Button>
              <Button
                variant={vehicle.status === 'sa-recycling' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStatusChange('sa-recycling')}
                disabled={vehicle.status === 'sa-recycling'}
              >
                Send to SA Recycling
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle ID</p>
                    <p className="font-medium">{vehicle.vehicleId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">License Plate</p>
                    <p className="font-medium">{vehicle.licensePlate || 'N/A'}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Make/Model/Year</p>
                  <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Purchase Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Seller</p>
                    <p className="font-medium">{vehicle.sellerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Price</p>
                    <p className="font-medium">${vehicle.purchasePrice || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Date</p>
                  <p className="font-medium">{vehicle.purchaseDate || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Documentation Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${vehicle.titlePresent ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">Title Present</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${vehicle.billOfSale ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">Bill of Sale</span>
                  </div>
                </div>
                {vehicle.paperwork && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paperwork Status</p>
                    <p className="font-medium">{vehicle.paperwork}</p>
                  </div>
                )}
                {vehicle.paperworkOther && (
                  <div>
                    <p className="text-sm text-muted-foreground">Other Paperwork</p>
                    <p className="font-medium">{vehicle.paperworkOther}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sale Information (if sold) */}
            {vehicle.status === 'sold' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Sale Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Buyer</p>
                      <p className="font-medium">{vehicle.buyerName || `${vehicle.buyerFirstName} ${vehicle.buyerLastName}` || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sale Price</p>
                      <p className="font-medium">${vehicle.salePrice || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sale Date</p>
                    <p className="font-medium">{vehicle.saleDate || 'N/A'}</p>
                  </div>
                  {vehicle.buyerAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground">Buyer Address</p>
                      <p className="font-medium">
                        {vehicle.buyerAddress}
                        {vehicle.buyerCity && `, ${vehicle.buyerCity}`}
                        {vehicle.buyerState && `, ${vehicle.buyerState}`}
                        {vehicle.buyerZip && ` ${vehicle.buyerZip}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {vehicle.notes && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Documents */}
            {vehicle.documents && vehicle.documents.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vehicle.documents.map((doc) => (
                      <div key={doc.id} className="border rounded-lg p-3">
                        <p className="font-medium text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Car Images - Only show in edit mode for non-view-only users */}
            {isEditing && !isViewOnly && (
              <div className="lg:col-span-2">
                <CarImagesUpload
                  vehicleId={vehicle.id}
                  currentImages={vehicle.carImages || []}
                  onImagesUpdate={handleCarImagesUpdate}
                />
              </div>
            )}

            {/* Car Images Display - Always show if images exist */}
            {vehicle.carImages && vehicle.carImages.length > 0 && !isEditing && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Car Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vehicle.carImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => window.open(image.url, '_blank')}
                            onError={(e) => {
                              console.error('Error loading image:', image.url);
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground truncate">
                          {image.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BuyerSelector
        open={buyerSelectorOpen}
        onOpenChange={setBuyerSelectorOpen}
        onSelectBuyer={handleBuyerSelected}
      />
    </>
  );
}
