
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Eye, Save, AlertCircle } from "lucide-react";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { Vehicle } from "@/stores/vehicleStore";
import { toast } from "sonner";

interface ParsedVehicleData {
  year: string;
  make: string;
  model: string;
  vehicleId: string;
  licensePlate?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  sellerName?: string;
  status: 'yard';
  titlePresent: boolean;
  billOfSale: boolean;
  notes?: string;
}

export function DataImporter() {
  const [rawData, setRawData] = useState("");
  const [parsedData, setParsedData] = useState<ParsedVehicleData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const { addVehicle } = useVehicleStore();

  const parseExcelData = (data: string): ParsedVehicleData[] => {
    const lines = data.trim().split('\n');
    const vehicles: ParsedVehicleData[] = [];

    lines.forEach((line, index) => {
      if (!line.trim()) return;

      // Split by tabs or multiple spaces
      const parts = line.split(/\t+|\s{2,}/).map(part => part.trim()).filter(part => part);
      
      if (parts.length < 6) {
        console.warn(`Line ${index + 1} has insufficient data:`, parts);
        return;
      }

      const [year, make, model = "", vin, plate, date, buyer = "", price = ""] = parts;

      // Handle special price cases
      let processedPrice = "";
      if (price && price !== "") {
        if (price.toLowerCase().includes("free")) {
          processedPrice = "0";
        } else if (price === "0") {
          processedPrice = "0";
        } else if (!isNaN(parseFloat(price))) {
          processedPrice = price;
        }
      }

      // Handle date format (convert M/D/YYYY to YYYY-MM-DD)
      let processedDate = "";
      if (date && date !== "") {
        try {
          const dateParts = date.split('/');
          if (dateParts.length === 3) {
            const [month, day, year] = dateParts;
            processedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        } catch (error) {
          console.warn(`Failed to parse date: ${date}`);
        }
      }

      // Clean up make names
      const cleanMake = make.replace(/MERZ/gi, 'MERCEDES')
                           .replace(/CHEV/gi, 'CHEVROLET')
                           .replace(/VOLK/gi, 'VOLKSWAGEN')
                           .replace(/MNNI/gi, 'MINI')
                           .replace(/TOYOYA/gi, 'TOYOTA');

      const vehicle: ParsedVehicleData = {
        year: year || "",
        make: cleanMake || "",
        model: model || "",
        vehicleId: vin || "",
        licensePlate: (plate && plate !== "" && !plate.toLowerCase().includes("out of state")) ? plate : undefined,
        purchaseDate: processedDate || undefined,
        purchasePrice: processedPrice || undefined,
        sellerName: buyer || undefined,
        status: 'yard',
        titlePresent: false,
        billOfSale: false,
        notes: plate && plate.toLowerCase().includes("out of state") ? "Out of state vehicle" : undefined
      };

      vehicles.push(vehicle);
    });

    return vehicles;
  };

  const handleParseData = () => {
    try {
      const parsed = parseExcelData(rawData);
      setParsedData(parsed);
      setShowPreview(true);
      toast.success(`Successfully parsed ${parsed.length} vehicles`);
    } catch (error) {
      console.error('Error parsing data:', error);
      toast.error("Failed to parse data. Please check the format.");
    }
  };

  const handleImportToStore = async () => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const vehicle of parsedData) {
        try {
          await addVehicle(vehicle);
          successCount++;
        } catch (error) {
          console.error('Error adding vehicle:', vehicle.vehicleId, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} vehicles${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} vehicles`);
      }

      // Clear the data after import
      setRawData("");
      setParsedData([]);
      setShowPreview(false);
    } catch (error) {
      console.error('Error importing vehicles:', error);
      toast.error("Failed to import vehicles to store");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Vehicle Data Importer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Paste your Excel data here:
            </label>
            <Textarea
              placeholder="Paste your tab-separated or space-separated vehicle data..."
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleParseData}
              disabled={!rawData.trim()}
              variant="outline"
            >
              <Eye className="w-4 h-4 mr-2" />
              Parse & Preview
            </Button>
            
            {parsedData.length > 0 && (
              <Button 
                onClick={handleImportToStore}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Import {parsedData.length} Vehicles
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showPreview && parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview ({parsedData.length} vehicles)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <div className="grid gap-2">
                {parsedData.slice(0, 10).map((vehicle, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model || '[No Model]'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          VIN: {vehicle.vehicleId}
                        </p>
                        {vehicle.licensePlate && (
                          <p className="text-sm text-muted-foreground">
                            Plate: {vehicle.licensePlate}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1">
                          {vehicle.purchaseDate && (
                            <Badge variant="outline">Date: {vehicle.purchaseDate}</Badge>
                          )}
                          {vehicle.purchasePrice && (
                            <Badge variant="outline">
                              Price: ${vehicle.purchasePrice === "0" ? "FREE" : vehicle.purchasePrice}
                            </Badge>
                          )}
                          {vehicle.sellerName && (
                            <Badge variant="outline">Seller: {vehicle.sellerName}</Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">Yard</Badge>
                    </div>
                    {vehicle.notes && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {vehicle.notes}
                      </p>
                    )}
                  </div>
                ))}
                {parsedData.length > 10 && (
                  <p className="text-center text-muted-foreground text-sm py-2">
                    ... and {parsedData.length - 10} more vehicles
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
