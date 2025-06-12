
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function VehicleIntakeForm() {
  const [formData, setFormData] = useState({
    year: "",
    make: "",
    model: "",
    vin: "",
    licensePlate: "",
    sellerName: "",
    purchaseDate: "",
    purchasePrice: "",
    titlePresent: false,
    billOfSale: false,
    destination: "",
    buyerName: "",
    saleDate: "",
    salePrice: "",
    notes: ""
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.year || !formData.make || !formData.model || !formData.vin) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required vehicle details.",
        variant: "destructive",
      });
      return;
    }

    console.log("Submitting vehicle data:", formData);
    console.log("Uploaded file:", uploadedFile);
    
    // Different messages based on destination
    let successMessage = "Vehicle has been added to inventory.";
    if (formData.destination === "pick-your-part") {
      successMessage += " Pick Your Part bill of sale will be generated.";
    } else if (formData.destination === "sa-recycling") {
      successMessage += " SA Recycling paperwork will be prepared.";
    } else if (formData.destination === "blank-bill-sale") {
      successMessage += " Blank bill of sale will be generated for manual completion.";
    } else if (formData.destination === "buyer") {
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
      vin: "",
      licensePlate: "",
      sellerName: "",
      purchaseDate: "",
      purchasePrice: "",
      titlePresent: false,
      billOfSale: false,
      destination: "",
      buyerName: "",
      saleDate: "",
      salePrice: "",
      notes: ""
    });
    setUploadedFile(null);
  };

  return (
    <Card className="shadow-business">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Vehicle Intake Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Upload */}
          <div className="space-y-2">
            <Label htmlFor="document">Upload Paperwork (PDF/Image)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <input
                type="file"
                id="document"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="document" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {uploadedFile ? uploadedFile.name : "Click to upload or drag and drop"}
                </p>
              </label>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                placeholder="2015"
                value={formData.year}
                onChange={(e) => handleInputChange("year", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input
                id="make"
                placeholder="Honda"
                value={formData.make}
                onChange={(e) => handleInputChange("make", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                placeholder="Civic"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vin">VIN *</Label>
              <Input
                id="vin"
                placeholder="1HGBH41JXMN109186"
                value={formData.vin}
                onChange={(e) => handleInputChange("vin", e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                placeholder="ABC123"
                value={formData.licensePlate}
                onChange={(e) => handleInputChange("licensePlate", e.target.value)}
              />
            </div>
          </div>

          {/* Purchase Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellerName">Seller Name</Label>
              <Input
                id="sellerName"
                placeholder="John Doe"
                value={formData.sellerName}
                onChange={(e) => handleInputChange("sellerName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                type="number"
                placeholder="500"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
              />
            </div>
          </div>

          {/* Document Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="titlePresent"
                checked={formData.titlePresent}
                onCheckedChange={(checked) => handleInputChange("titlePresent", checked)}
              />
              <Label htmlFor="titlePresent">Title Present</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="billOfSale"
                checked={formData.billOfSale}
                onCheckedChange={(checked) => handleInputChange("billOfSale", checked)}
              />
              <Label htmlFor="billOfSale">Handwritten Bill of Sale</Label>
            </div>
          </div>

          {/* Vehicle Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination">Vehicle Destination</Label>
            <Select value={formData.destination} onValueChange={(value) => handleInputChange("destination", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yard">Still in Yard</SelectItem>
                <SelectItem value="buyer">Sold to Buyer</SelectItem>
                <SelectItem value="pick-your-part">Send to Pick Your Part</SelectItem>
                <SelectItem value="sa-recycling">SA Recycling</SelectItem>
                <SelectItem value="blank-bill-sale">Blank Bill of Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional fields for "Sold to Buyer" */}
          {formData.destination === "buyer" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="buyerName">Buyer Name</Label>
                <Input
                  id="buyerName"
                  placeholder="Jane Smith"
                  value={formData.buyerName}
                  onChange={(e) => handleInputChange("buyerName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleDate">Date of Sale</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => handleInputChange("saleDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price</Label>
                <Input
                  id="salePrice"
                  type="number"
                  placeholder="1500"
                  value={formData.salePrice}
                  onChange={(e) => handleInputChange("salePrice", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Information panels for other destinations */}
          {formData.destination === "pick-your-part" && (
            <div className="p-4 bg-info/10 border border-info rounded-lg">
              <p className="text-sm text-info font-medium">
                📋 Pick Your Part bill of sale will be auto-generated with vehicle details
              </p>
            </div>
          )}

          {formData.destination === "sa-recycling" && (
            <div className="p-4 bg-success/10 border border-success rounded-lg">
              <p className="text-sm text-success font-medium">
                ♻️ SA Recycling paperwork will be prepared with vehicle information
              </p>
            </div>
          )}

          {formData.destination === "blank-bill-sale" && (
            <div className="p-4 bg-warning/10 border border-warning rounded-lg">
              <p className="text-sm text-warning font-medium">
                📝 Blank bill of sale will be generated for manual completion and handwriting
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information about the vehicle..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full gradient-primary">
            <Save className="w-4 h-4 mr-2" />
            Save Vehicle & Generate Forms
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
