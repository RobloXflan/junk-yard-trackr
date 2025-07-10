
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Car, User, Calendar, MapPin, Hash, CreditCard, CheckCircle, RefreshCw, Undo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { Vehicle, CarImage } from "@/stores/vehicleStore";

export function Released() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { unmarkVehicleAsReleased } = useVehicleStore();
  const { toast } = useToast();

  const deserializeCarImages = (carImagesData: any): CarImage[] => {
    if (!carImagesData || !Array.isArray(carImagesData)) {
      return [];
    }
    
    return carImagesData.map(img => ({
      id: img.id || `img_${Date.now()}`,
      name: img.name || 'Untitled Image',
      size: img.size || 0,
      url: img.url || '',
      uploadedAt: img.uploadedAt || new Date().toISOString()
    }));
  };

  // Load ALL released vehicles
  useEffect(() => {
    const loadReleasedVehicles = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            id,
            year,
            make,
            model,
            vehicle_id,
            license_plate,
            seller_name,
            purchase_date,
            purchase_price,
            title_present,
            bill_of_sale,
            destination,
            buyer_name,
            buyer_first_name,
            buyer_last_name,
            buyer_address,
            buyer_city,
            buyer_state,
            buyer_zip,
            sale_date,
            sale_price,
            notes,
            paperwork,
            paperwork_other,
            status,
            is_released,
            car_images,
            created_at,
            updated_at
          `)
          .eq('status', 'sold')
          .eq('is_released', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transformedVehicles: Vehicle[] = (data || []).map(vehicle => ({
          id: vehicle.id,
          year: vehicle.year || '',
          make: vehicle.make || '',
          model: vehicle.model || '',
          vehicleId: vehicle.vehicle_id || '',
          licensePlate: vehicle.license_plate || undefined,
          sellerName: vehicle.seller_name || undefined,
          purchaseDate: vehicle.purchase_date || undefined,
          purchasePrice: vehicle.purchase_price || undefined,
          titlePresent: Boolean(vehicle.title_present),
          billOfSale: Boolean(vehicle.bill_of_sale),
          destination: vehicle.destination || undefined,
          buyerName: vehicle.buyer_name || undefined,
          buyerFirstName: vehicle.buyer_first_name || undefined,
          buyerLastName: vehicle.buyer_last_name || undefined,
          buyerAddress: vehicle.buyer_address || undefined,
          buyerCity: vehicle.buyer_city || undefined,
          buyerState: vehicle.buyer_state || undefined,
          buyerZip: vehicle.buyer_zip || undefined,
          saleDate: vehicle.sale_date || undefined,
          salePrice: vehicle.sale_price || undefined,
          notes: vehicle.notes || undefined,
          paperwork: vehicle.paperwork || undefined,
          paperworkOther: vehicle.paperwork_other || undefined,
          status: (vehicle.status as Vehicle['status']) || 'yard',
          isReleased: Boolean(vehicle.is_released),
          carImages: deserializeCarImages(vehicle.car_images),
          createdAt: vehicle.created_at,
          documents: []
        }));

        setVehicles(transformedVehicles);
      } catch (error) {
        console.error('Error loading released vehicles:', error);
        setVehicles([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReleasedVehicles();
  }, []);

  // Filter vehicles that are sold and have been marked as released
  const releasedVehicles = vehicles;

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

  const handleMoveToPending = async (vehicleId: string) => {
    try {
      await unmarkVehicleAsReleased(vehicleId);
      toast({
        title: "Vehicle moved to pending releases",
        description: "Vehicle has been moved back to pending releases",
      });
    } catch (error) {
      console.error('Error moving vehicle to pending:', error);
      toast({
        title: "Failed to move vehicle",
        description: "Could not update vehicle status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Released Vehicles</h1>
          <p className="text-muted-foreground">
            Vehicles that have been released and processed
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
        <h1 className="text-3xl font-bold tracking-tight">Released Vehicles</h1>
        <p className="text-muted-foreground">
          Vehicles that have been released and processed ({releasedVehicles.length} total)
        </p>
      </div>

      {releasedVehicles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Released Vehicles</h3>
            <p className="text-muted-foreground">
              No vehicles have been marked as released yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {releasedVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="shadow-business hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">Sold</Badge>
                    <Badge className="bg-green-100 text-green-800">Released</Badge>
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
                {(vehicle.buyerFirstName || vehicle.buyerLastName) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Buyer Information
                    </h4>
                    
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
                )}

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
                    variant="outline"
                    className="w-full"
                    onClick={() => handleMoveToPending(vehicle.id)}
                  >
                    <Undo className="w-4 h-4 mr-2" />
                    Move to Pending Releases
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

