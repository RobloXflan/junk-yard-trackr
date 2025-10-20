
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  Calendar, 
  DollarSign, 
  FileText, 
  User,
  Package,
  ExternalLink
} from "lucide-react";
import { Vehicle } from "@/stores/vehicleStore";

interface ViewOnlyVehicleDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewOnlyVehicleDialog({ vehicle, open, onOpenChange }: ViewOnlyVehicleDialogProps) {
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

  const formatPaperworkDisplay = (paperwork?: string, paperworkOther?: string): string => {
    if (!paperwork) return "Unknown";
    
    switch (paperwork) {
      case "title":
        return "Title";
      case "registered-owner":
        return "Registered Owner";
      case "lien-sale":
        return "Lien Sale";
      case "no-paperwork":
        return "No Paperwork";
      case "other":
        return paperworkOther || "Other";
      default:
        return paperwork;
    }
  };

  const getStatusDisplay = (status: string) => {
    if (!status) return 'UNKNOWN';
    
    switch (status) {
      case 'yard': return 'In Yard';
      case 'sold': return 'Sold';
      case 'pick-your-part': return 'Pick Your Part';
      case 'sa-recycling': return 'SA Recycling';
      default: return status.toUpperCase();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              {vehicle.year} {vehicle.make} {vehicle.model}
            </DialogTitle>
            <Badge className={`${getStatusColor(vehicle.status)} text-white`}>
              {getStatusDisplay(vehicle.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Car Images Section */}
          {vehicle.carImages && vehicle.carImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Car Images ({vehicle.carImages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicle.carImages.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                        <img
                          src={image.url}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Image ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(image.url, '_blank')}
                          onError={(e) => {
                            console.error('Error loading car image:', image.url);
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground truncate flex-1">
                          {image.name}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(image.url, '_blank')}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Basic Vehicle Status - No sensitive purchase information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Vehicle Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <p className="font-medium">{getStatusDisplay(vehicle.status)}</p>
              </div>
              {vehicle.purchaseDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Date Added</p>
                  <p className="font-medium">{vehicle.purchaseDate}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentation Status - Show status but no document access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documentation Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Paperwork Status</p>
                <p className="font-medium">{formatPaperworkDisplay(vehicle.paperwork, vehicle.paperworkOther)}</p>
              </div>
              {/* Show document count but no access to view them */}
              {vehicle.documents && vehicle.documents.length > 0 && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>{vehicle.documents.length} document(s) on file</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Document access restricted to admin users
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sale Information (if sold) - Limited information for view-only */}
          {vehicle.status === 'sold' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Sale Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">Vehicle has been sold</p>
                </div>
                {vehicle.saleDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Sale Date</p>
                    <p className="font-medium">{vehicle.saleDate}</p>
                  </div>
                )}
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Detailed sale information is restricted to admin users
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Section - Only show if there are notes */}
          {vehicle.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{vehicle.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
