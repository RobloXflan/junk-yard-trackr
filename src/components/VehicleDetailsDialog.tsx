
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
  ExternalLink,
  Download
} from "lucide-react";
import { Vehicle } from "@/stores/vehicleStore";

interface VehicleDetailsDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleDetailsDialog({ vehicle, open, onOpenChange }: VehicleDetailsDialogProps) {
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

  const handleDownloadDocument = (document: any) => {
    if (document.url) {
      window.open(document.url, '_blank');
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
                  <p className="text-sm text-muted-foreground">Driver</p>
                  <p className="font-medium">{vehicle.sellerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Price</p>
                  <p className="font-medium">{vehicle.purchasePrice ? `$${parseFloat(vehicle.purchasePrice).toLocaleString()}` : 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium">{vehicle.purchaseDate || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Paperwork Status</p>
                <p className="font-medium">{formatPaperworkDisplay(vehicle.paperwork, vehicle.paperworkOther)}</p>
              </div>
              {vehicle.documents && vehicle.documents.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Documents ({vehicle.documents.length})</h4>
                  <div className="space-y-2">
                    {vehicle.documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{doc.name || `Document ${index + 1}`}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
                    <p className="font-medium">{vehicle.salePrice ? `$${parseFloat(vehicle.salePrice).toLocaleString()}` : 'N/A'}</p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
