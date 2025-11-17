import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { DocumentUpload, UploadedDocument } from "./forms/DocumentUpload";
import { VehicleDetails } from "./forms/VehicleDetails";
import { PurchaseInfo } from "./forms/PurchaseInfo";
import { DocumentStatus } from "./forms/DocumentStatus";
import { DestinationSelector } from "./forms/DestinationSelector";
import { TitlePDFScanner } from "./TitlePDFScanner";

export function VehicleIntakeFormTest() {
  const { addVehicle } = useVehicleStore();
  
  const [formData, setFormData] = useState({
    year: "",
    make: "",
    model: "",
    vehicleId: "",
    licensePlate: "",
    sellerName: "",
    purchaseDate: "",
    purchasePrice: "",
    paperwork: "",
    paperworkOther: "",
    titlePresent: false,
    billOfSale: false,
    destination: "",
    buyerName: "",
    buyerFirstName: "",
    buyerLastName: "",
    saleDate: "",
    salePrice: "",
    notes: ""
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDataExtracted = (data: any) => {
    // Auto-fill the form with extracted data
    const updates: any = {};
    
    if (data.vin) {
      updates.vehicleId = data.vin;
    }
    if (data.licensePlate) {
      updates.licensePlate = data.licensePlate;
    }
    if (data.year) {
      updates.year = data.year;
    }
    if (data.make) {
      // Expand common abbreviations
      const makeExpansions: Record<string, string> = {
        "TOYT": "Toyota",
        "HOND": "Honda",
        "FORD": "Ford",
        "CHEV": "Chevrolet",
        "DODG": "Dodge",
        "NISS": "Nissan",
        "MAZD": "Mazda",
        "SUBA": "Subaru",
        "VOLK": "Volkswagen",
        "MERC": "Mercedes-Benz",
        "BMWW": "BMW",
      };
      const expandedMake = makeExpansions[data.make.toUpperCase()] || data.make;
      updates.make = expandedMake;
    }

    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.year || !formData.make || !formData.model || !formData.vehicleId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required vehicle details.",
        variant: "destructive",
      });
      return;
    }

    // Check if sold and missing buyer info
    if ((formData.destination === "sold" || formData.destination === "buyer") && 
        (!formData.buyerFirstName || !formData.buyerLastName || !formData.salePrice)) {
      toast({
        title: "Missing Sale Information",
        description: "Please fill in buyer first name, last name, and sale price for sold vehicles.",
        variant: "destructive",
      });
      return;
    }

    // Combine first and last name for backward compatibility
    const combinedBuyerName = formData.buyerFirstName && formData.buyerLastName 
      ? `${formData.buyerFirstName} ${formData.buyerLastName}` 
      : formData.buyerName;

    // Add vehicle to store
    addVehicle({
      ...formData,
      buyerName: combinedBuyerName,
      documents: uploadedDocuments
    });
    
    let successMessage = "Vehicle has been added to inventory.";
    if (uploadedDocuments.length > 0) {
      successMessage += ` ${uploadedDocuments.length} document(s) saved.`;
    }
    
    if (formData.destination === "pick-your-part") {
      successMessage += " Pick Your Part bill of sale will be generated.";
    } else if (formData.destination === "sa-recycling") {
      successMessage += " SA Recycling paperwork will be prepared.";
    } else if (formData.destination === "blank-bill-sale") {
      successMessage += " Blank bill of sale will be generated for manual completion.";
    } else if (formData.destination === "buyer" || formData.destination === "sold") {
      successMessage += " Sale forms will be generated.";
    }

    toast({
      title: "Vehicle Added Successfully",
      description: successMessage,
    });

    // Reset form
    setFormData({
      year: "",
      make: "",
      model: "",
      vehicleId: "",
      licensePlate: "",
      sellerName: "",
      purchaseDate: "",
      purchasePrice: "",
      paperwork: "",
      paperworkOther: "",
      titlePresent: false,
      billOfSale: false,
      destination: "",
      buyerName: "",
      buyerFirstName: "",
      buyerLastName: "",
      saleDate: "",
      salePrice: "",
      notes: ""
    });
    setUploadedDocuments([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Title Scanner - TEST FEATURE */}
      <TitlePDFScanner onDataExtracted={handleDataExtracted} />

      {/* Vehicle Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleDetails 
            formData={formData} 
            onInputChange={handleInputChange} 
          />
        </CardContent>
      </Card>

      {/* Purchase Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Purchase Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseInfo 
            formData={formData} 
            onInputChange={handleInputChange} 
          />
        </CardContent>
      </Card>

      {/* Document Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Document Status</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentStatus 
            formData={formData} 
            onInputChange={handleInputChange} 
          />
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUpload
            uploadedDocuments={uploadedDocuments}
            onDocumentsChange={setUploadedDocuments}
          />
        </CardContent>
      </Card>

      {/* Destination/Sale Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Destination / Sale Information</CardTitle>
        </CardHeader>
        <CardContent>
          <DestinationSelector 
            formData={formData} 
            onInputChange={handleInputChange} 
          />
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about this vehicle..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full">
        <Save className="mr-2 h-5 w-5" />
        Save Vehicle
      </Button>
    </form>
  );
}
