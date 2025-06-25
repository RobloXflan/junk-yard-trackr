import { useVehicleStorePaginated } from "@/hooks/useVehicleStorePaginated";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Car, User, Calendar, MapPin, Hash, CreditCard, Clock, ExternalLink, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVehicleStore } from "@/hooks/useVehicleStore";

export function PendingReleases() {
  const { vehicles, isLoading } = useVehicleStorePaginated();
  const { markVehicleAsReleased } = useVehicleStore();
  const { toast } = useToast();

  // Filter vehicles with status 'sold' that haven't been released yet
  const soldVehicles = vehicles.filter(vehicle => vehicle.status === 'sold' && !vehicle.isReleased);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: `${label} copied successfully`,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleRelease = () => {
    window.open("https://www.dmv.ca.gov/wasapp/nrl/nrlApplication.do", "_blank");
  };

  const handleMarkReleased = async (vehicleId: string) => {
    try {
      await markVehicleAsReleased(vehicleId);
      toast({
        title: "Vehicle marked as released",
        description: "Vehicle has been moved to the Released section",
      });
    } catch (error) {
      console.error('Error marking vehicle as released:', error);
      toast({
        title: "Failed to mark vehicle as released",
        description: "Could not update vehicle status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Releases</h1>
          <p className="text-muted-foreground">
            Vehicles sold and pending release documentation
          </p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Releases</h1>
        <p className="text-muted-foreground">
          Vehicles sold and pending release documentation
        </p>
      </div>

      {soldVehicles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Pending Releases</h3>
            <p className="text-muted-foreground">
              No sold vehicles pending release documentation at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {soldVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="shadow-business hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Sold</Badge>
                    <Button
                      size="sm"
                      onClick={handleRelease}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Release
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vehicle Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Vehicle Details
                  </h4>
                  
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Vehicle ID:</span>
                      <span className="font-mono">{vehicle.vehicleId}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(vehicle.vehicleId, "Vehicle ID")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {vehicle.licensePlate && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">License Plate:</span>
                        <span className="font-mono">{vehicle.licensePlate}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(vehicle.licensePlate || "", "License Plate")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Buyer Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Buyer Information
                  </h4>
                  
                  {(vehicle.buyerFirstName || vehicle.buyerLastName) && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Buyer Name:</span>
                        <span>{vehicle.buyerFirstName} {vehicle.buyerLastName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${vehicle.buyerFirstName} ${vehicle.buyerLastName}`, "Buyer Name")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Buyer Address */}
                  {(vehicle.buyerAddress || vehicle.buyerCity || vehicle.buyerState || vehicle.buyerZip) && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Address:</span>
                        <span className="text-sm">
                          {[
                            vehicle.buyerAddress,
                            vehicle.buyerCity,
                            vehicle.buyerState,
                            vehicle.buyerZip
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const fullAddress = [
                            vehicle.buyerAddress,
                            vehicle.buyerCity,
                            vehicle.buyerState,
                            vehicle.buyerZip
                          ].filter(Boolean).join(', ');
                          copyToClipboard(fullAddress, "Buyer Address");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Sale Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Sale Details
                  </h4>
                  
                  {vehicle.saleDate && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Sale Date:</span>
                        <span>{new Date(vehicle.saleDate).toLocaleDateString()}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(vehicle.saleDate || "", "Sale Date")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {vehicle.salePrice && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Sale Price:</span>
                        <span>${parseFloat(vehicle.salePrice).toLocaleString()}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(vehicle.salePrice || "", "Sale Price")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const fullAddress = [
                        vehicle.buyerAddress,
                        vehicle.buyerCity,
                        vehicle.buyerState,
                        vehicle.buyerZip
                      ].filter(Boolean).join(', ');
                      
                      const allData = [
                        `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                        `Vehicle ID: ${vehicle.vehicleId}`,
                        vehicle.licensePlate ? `License Plate: ${vehicle.licensePlate}` : '',
                        vehicle.buyerFirstName && vehicle.buyerLastName ? `Buyer: ${vehicle.buyerFirstName} ${vehicle.buyerLastName}` : '',
                        fullAddress ? `Address: ${fullAddress}` : '',
                        vehicle.saleDate ? `Sale Date: ${new Date(vehicle.saleDate).toLocaleDateString()}` : '',
                        vehicle.salePrice ? `Sale Price: $${parseFloat(vehicle.salePrice).toLocaleString()}` : ''
                      ].filter(Boolean).join('\n');
                      
                      copyToClipboard(allData, "All vehicle data");
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy All Data
                  </Button>

                  <Button
                    variant="default"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleMarkReleased(vehicle.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Released
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
