import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Car, User, Calendar, MapPin, Hash, CreditCard, Clock, ExternalLink, CheckCircle, Bot, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { Vehicle, CarImage } from "@/stores/vehicleStore";
import { formatDate } from "@/lib/utils";

export function PendingReleases() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoFillLoading, setAutoFillLoading] = useState<string | null>(null);
  const [screenshotDialog, setScreenshotDialog] = useState<{ open: boolean; screenshots: string[]; vehicleName: string; error?: string; visibleFields?: any[] }>({
    open: false,
    screenshots: [],
    vehicleName: '',
  });
  const { markVehicleAsReleased } = useVehicleStore();
  const { toast } = useToast();

  const deserializeCarImages = (carImagesData: any): CarImage[] => {
    if (!carImagesData || !Array.isArray(carImagesData)) return [];
    return carImagesData.map(img => ({
      id: img.id || `img_${Date.now()}`,
      name: img.name || 'Untitled Image',
      size: img.size || 0,
      url: img.url || '',
      uploadedAt: img.uploadedAt || new Date().toISOString()
    }));
  };

  useEffect(() => {
    const loadSoldVehicles = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            id, year, make, model, vehicle_id, license_plate, seller_name,
            purchase_date, purchase_price, title_present, bill_of_sale,
            destination, buyer_name, buyer_first_name, buyer_last_name,
            buyer_address, buyer_city, buyer_state, buyer_zip,
            sale_date, sale_price, notes, paperwork, paperwork_other,
            status, is_released, car_images, created_at, updated_at
          `)
          .eq('status', 'sold')
          .eq('is_released', false)
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
        console.error('Error loading sold vehicles:', error);
        setVehicles([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSoldVehicles();
  }, []);

  const soldVehicles = vehicles;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", description: `${label} copied successfully` });
    } catch (err) {
      toast({ title: "Failed to copy", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };

  const handleRelease = () => {
    window.open("https://www.dmv.ca.gov/wasapp/nrl/nrlApplication.do", "_blank");
  };

  const handleAutoFillDMV = async (vehicle: Vehicle) => {
    if (!vehicle.licensePlate || !vehicle.vehicleId) {
      toast({
        title: "Missing required data",
        description: "License plate and Vehicle ID (VIN) are required for DMV autofill",
        variant: "destructive",
      });
      return;
    }

    setAutoFillLoading(vehicle.id);

    try {
      const { data, error } = await supabase.functions.invoke('dmv-autofill', {
        body: {
          vehicleId: vehicle.vehicleId,
          licensePlate: vehicle.licensePlate,
          buyerFirstName: vehicle.buyerFirstName || '',
          buyerLastName: vehicle.buyerLastName || '',
          buyerAddress: vehicle.buyerAddress || '',
          buyerCity: vehicle.buyerCity || '',
          buyerState: vehicle.buyerState || 'CA',
          buyerZip: vehicle.buyerZip || '',
          saleDate: vehicle.saleDate || '',
        },
      });

      if (error) throw error;

      if (data.success) {
        setScreenshotDialog({
          open: true,
          screenshots: data.screenshots || [],
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          visibleFields: data.visibleFields,
        });
        toast({
          title: "DMV Form Filled",
          description: data.buyerFieldsFilled
            ? "License plate, VIN, and buyer info were filled successfully"
            : "License plate and VIN were filled. Buyer fields may need manual entry.",
        });
      } else {
        setScreenshotDialog({
          open: true,
          screenshots: data.screenshots || [],
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          error: data.error || 'Unknown error from DMV site',
          visibleFields: data.visibleFields,
        });
        toast({
          title: "DMV Autofill Issue",
          description: data.error || "There was an issue filling the DMV form",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('DMV autofill error:', error);
      toast({
        title: "Auto-Fill Failed",
        description: error.message || "Could not connect to DMV autofill service",
        variant: "destructive",
      });
    } finally {
      setAutoFillLoading(null);
    }
  };

  const handleMarkReleased = async (vehicleId: string) => {
    try {
      await markVehicleAsReleased(vehicleId);
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      toast({ title: "Vehicle marked as released", description: "Vehicle has been moved to the Released section" });
    } catch (error) {
      console.error('Error marking vehicle as released:', error);
      toast({ title: "Failed to mark vehicle as released", description: "Could not update vehicle status", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Releases</h1>
          <p className="text-muted-foreground">Vehicles sold and pending release documentation</p>
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
        <p className="text-muted-foreground">Vehicles sold and pending release documentation</p>
      </div>

      {soldVehicles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Pending Releases</h3>
            <p className="text-muted-foreground">No sold vehicles pending release documentation at this time.</p>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vehicle Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Vehicle Details</h4>
                  
                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Vehicle ID:</span>
                      <span className="font-mono">{vehicle.vehicleId}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vehicle.vehicleId, "Vehicle ID")}>
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
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vehicle.licensePlate || "", "License Plate")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Buyer Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Buyer Information</h4>
                  
                  {(vehicle.buyerFirstName || vehicle.buyerLastName) && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Buyer Name:</span>
                        <span>{vehicle.buyerFirstName} {vehicle.buyerLastName}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${vehicle.buyerFirstName} ${vehicle.buyerLastName}`, "Buyer Name")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {vehicle.buyerAddress && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Address:</span>
                        <span className="text-sm">{vehicle.buyerAddress}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vehicle.buyerAddress || "", "Address")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {vehicle.buyerCity && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">City:</span>
                        <span className="text-sm">{vehicle.buyerCity}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vehicle.buyerCity || "", "City")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {vehicle.buyerState && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">State:</span>
                        <span className="text-sm">{vehicle.buyerState}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vehicle.buyerState || "", "State")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {vehicle.buyerZip && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Zip Code:</span>
                        <span className="text-sm">{vehicle.buyerZip}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vehicle.buyerZip || "", "Zip Code")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Sale Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Sale Details</h4>
                  
                  {vehicle.saleDate && (
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Sale Date:</span>
                        <span>{formatDate(vehicle.saleDate)}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vehicle.saleDate || "", "Sale Date")}>
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
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(vehicle.salePrice || "", "Sale Price")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t space-y-3">
                  {/* Auto-Fill DMV Button */}
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleAutoFillDMV(vehicle)}
                    disabled={autoFillLoading === vehicle.id || !vehicle.licensePlate || !vehicle.vehicleId}
                  >
                    {autoFillLoading === vehicle.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Filling DMV Form...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4 mr-2" />
                        Auto-Fill DMV Release
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRelease}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open DMV Manually
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const fullAddress = [vehicle.buyerAddress, vehicle.buyerCity, vehicle.buyerState, vehicle.buyerZip].filter(Boolean).join(', ');
                      const allData = [
                        `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                        `Vehicle ID: ${vehicle.vehicleId}`,
                        vehicle.licensePlate ? `License Plate: ${vehicle.licensePlate}` : '',
                        vehicle.buyerFirstName && vehicle.buyerLastName ? `Buyer: ${vehicle.buyerFirstName} ${vehicle.buyerLastName}` : '',
                        fullAddress ? `Address: ${fullAddress}` : '',
                        vehicle.saleDate ? `Sale Date: ${formatDate(vehicle.saleDate)}` : '',
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

      {/* Screenshot Preview Dialog */}
      <Dialog open={screenshotDialog.open} onOpenChange={(open) => setScreenshotDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>DMV Autofill Result — {screenshotDialog.vehicleName}</DialogTitle>
          </DialogHeader>
          
          {screenshotDialog.error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
              <p className="font-semibold">Error from DMV:</p>
              <p className="text-sm">{screenshotDialog.error}</p>
            </div>
          )}

          {screenshotDialog.screenshots.length > 0 ? (
            <div className="space-y-4">
              {screenshotDialog.screenshots.map((url, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    {index === 0 ? 'Step 1: Vehicle Lookup (Filled)' : 'Step 2: Buyer Information'}
                  </h4>
                  <img 
                    src={url} 
                    alt={`DMV Form Step ${index + 1}`}
                    className="w-full border rounded-lg shadow-sm"
                  />
                </div>
              ))}
              <p className="text-sm text-muted-foreground">
                Review the screenshots above. The form was filled but <strong>not submitted</strong>. 
                Click "Open DMV Manually" to complete the submission yourself.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">No screenshots were captured.</p>
          )}

          {screenshotDialog.visibleFields && screenshotDialog.visibleFields.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground">Debug: Form fields found on page</summary>
              <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
                {JSON.stringify(screenshotDialog.visibleFields, null, 2)}
              </pre>
            </details>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
