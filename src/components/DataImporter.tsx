
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
  saleDate?: string;
  salePrice?: string;
  buyerFirstName?: string;
  buyerLastName?: string;
  buyerName?: string;
  sellerName?: string;
  status: 'yard' | 'sold';
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
      
      console.log(`Line ${index + 1} parts:`, parts);

      if (parts.length < 4) {
        console.warn(`Line ${index + 1} has insufficient data (need at least 4 columns):`, parts);
        return;
      }

      // Expected format: YEAR, MAKE, MODEL, VIN, PLATE, DATE, BUYER, PRICE
      const [
        yearRaw = "",
        makeRaw = "",
        modelRaw = "",
        vin = "",
        plate = "",
        date = "",
        buyer = "",
        price = ""
      ] = parts;

      console.log(`Parsing line ${index + 1}:`, {
        yearRaw, makeRaw, modelRaw, vin, plate, date, buyer, price
      });

      // Parse year/make/model flexibly
      let year = "", make = "", model = "";
      
      // Check if first field looks like a year (4 digits)
      if (/^\d{4}$/.test(yearRaw)) {
        year = yearRaw;
        make = makeRaw;
        model = modelRaw;
      } else {
        // Handle cases like "1999 mustang" or "ford mustang" etc.
        const combined = `${yearRaw} ${makeRaw} ${modelRaw}`.trim();
        const words = combined.split(/\s+/);
        
        // Look for year in the combined text
        const yearMatch = words.find(word => /^\d{4}$/.test(word));
        if (yearMatch) {
          year = yearMatch;
          // Remove year from words and split remaining into make/model
          const remainingWords = words.filter(word => word !== yearMatch);
          make = remainingWords[0] || "";
          model = remainingWords.slice(1).join(" ") || "";
        } else {
          // No year found, treat as make/model
          make = words[0] || "";
          model = words.slice(1).join(" ") || "";
        }
      }

      // Clean up make names
      if (make) {
        make = make.replace(/MERZ/gi, 'MERCEDES')
                   .replace(/CHEV/gi, 'CHEVROLET')
                   .replace(/VOLK/gi, 'VOLKSWAGEN')
                   .replace(/MNNI/gi, 'MINI')
                   .replace(/TOYOYA/gi, 'TOYOTA');
      }

      // Process license plate
      let processedPlate: string | undefined;
      if (plate && plate !== "" && !plate.toLowerCase().includes("out of state")) {
        processedPlate = plate;
      }

      // Process date - handle both purchase and sale dates
      let processedPurchaseDate: string | undefined;
      let processedSaleDate: string | undefined;
      
      if (date && date !== "") {
        try {
          const dateParts = date.split('/');
          if (dateParts.length === 3) {
            const [month, day, year] = dateParts;
            const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            
            // If there's a buyer, this is a sale date, otherwise purchase date
            if (buyer && buyer.trim() && buyer.toLowerCase() !== "n/a") {
              processedSaleDate = formattedDate;
            } else {
              processedPurchaseDate = formattedDate;
            }
          }
        } catch (error) {
          console.warn(`Failed to parse date: ${date}`);
        }
      }

      // Process buyer information
      let buyerFirstName: string | undefined;
      let buyerLastName: string | undefined;
      let buyerName: string | undefined;
      
      if (buyer && buyer.trim() && buyer.toLowerCase() !== "n/a") {
        buyerName = buyer.trim();
        const buyerParts = buyerName.split(/\s+/);
        buyerFirstName = buyerParts[0] || "";
        buyerLastName = buyerParts.slice(1).join(" ") || "";
      }

      // Process price - handle both purchase and sale prices
      let processedPurchasePrice: string | undefined;
      let processedSalePrice: string | undefined;
      
      if (price && price !== "") {
        let processedPrice = "";
        const priceStr = price.toLowerCase();
        
        if (priceStr.includes("free")) {
          processedPrice = "0";
        } else if (priceStr === "0" || priceStr === "$0") {
          processedPrice = "0";
        } else {
          // Extract numeric value from price string
          const numericMatch = price.match(/[\d,]+\.?\d*/);
          if (numericMatch) {
            const numericValue = numericMatch[0].replace(/,/g, '');
            if (!isNaN(parseFloat(numericValue))) {
              processedPrice = numericValue;
            }
          }
        }
        
        // If there's a buyer, this is a sale price, otherwise purchase price
        if (buyer && buyer.trim() && buyer.toLowerCase() !== "n/a") {
          processedSalePrice = processedPrice || undefined;
        } else {
          processedPurchasePrice = processedPrice || undefined;
        }
      }

      // Determine status based on whether there's buyer information
      const status: 'yard' | 'sold' = (buyer && buyer.trim() && buyer.toLowerCase() !== "n/a") ? 'sold' : 'yard';

      // Create notes for special cases
      let notes: string | undefined;
      if (plate && plate.toLowerCase().includes("out of state")) {
        notes = "Out of state vehicle";
      }
      if (price && price.toLowerCase().includes("free")) {
        const existingNotes = notes || "";
        notes = existingNotes ? `${existingNotes}; Free vehicle (${price})` : `Free vehicle (${price})`;
      }

      const vehicle: ParsedVehicleData = {
        year: year || "",
        make: make || "",
        model: model || "",
        vehicleId: vin || "",
        licensePlate: processedPlate,
        purchaseDate: processedPurchaseDate,
        purchasePrice: processedPurchasePrice,
        saleDate: processedSaleDate,
        salePrice: processedSalePrice,
        buyerFirstName,
        buyerLastName,
        buyerName,
        status,
        titlePresent: false,
        billOfSale: false,
        notes
      };

      console.log(`Parsed vehicle ${index + 1}:`, vehicle);
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
              Paste your Excel data here (YEAR, MAKE, MODEL, VIN, PLATE, DATE, BUYER, PRICE):
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
                          {vehicle.year && `${vehicle.year} `}
                          {vehicle.make && `${vehicle.make} `}
                          {vehicle.model || '[No Model]'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          VIN: {vehicle.vehicleId || '[No VIN]'}
                        </p>
                        {vehicle.licensePlate && (
                          <p className="text-sm text-muted-foreground">
                            Plate: {vehicle.licensePlate}
                          </p>
                        )}
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {vehicle.purchaseDate && (
                            <Badge variant="outline">Purchase: {vehicle.purchaseDate}</Badge>
                          )}
                          {vehicle.saleDate && (
                            <Badge variant="outline">Sale: {vehicle.saleDate}</Badge>
                          )}
                          {vehicle.purchasePrice && (
                            <Badge variant="outline">
                              Purchase: ${vehicle.purchasePrice === "0" ? "FREE" : vehicle.purchasePrice}
                            </Badge>
                          )}
                          {vehicle.salePrice && (
                            <Badge variant="outline">
                              Sale: ${vehicle.salePrice === "0" ? "FREE" : vehicle.salePrice}
                            </Badge>
                          )}
                          {vehicle.buyerName && (
                            <Badge variant="outline">Buyer: {vehicle.buyerName}</Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={vehicle.status === 'sold' ? 'default' : 'secondary'}>
                        {vehicle.status === 'sold' ? 'Sold' : 'Yard'}
                      </Badge>
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
