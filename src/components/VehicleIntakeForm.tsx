
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

export function VehicleIntakeForm() {
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
    
    // Clean up document URLs and reset
    uploadedDocuments.forEach(doc => {
      if (doc.url.startsWith('blob:')) {
        URL.revokeObjectURL(doc.url);
      }
    });
    setUploadedDocuments([]);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-business border-border">
        <CardHeader className="bg-card border-b border-border">
          <CardTitle className="flex items-center gap-2 text-foreground font-bold">
            <Upload className="w-5 h-5 text-primary" />
            Vehicle Intake Form
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DocumentUpload 
              uploadedDocuments={uploadedDocuments}
              onDocumentsChange={setUploadedDocuments}
            />

            <VehicleDetails 
              formData={formData}
              onInputChange={handleInputChange}
            />

            <PurchaseInfo 
              formData={formData}
              onInputChange={handleInputChange}
            />

            <DocumentStatus 
              formData={formData}
              onInputChange={handleInputChange}
            />

            <DestinationSelector 
              formData={formData}
              onInputChange={handleInputChange}
            />

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-foreground font-medium">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information about the vehicle..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
                className="border-border focus:border-primary text-foreground"
              />
            </div>

            <Button type="submit" className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Vehicle & Generate Forms
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
