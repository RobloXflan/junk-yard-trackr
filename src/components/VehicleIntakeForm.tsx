
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload, Save, FileText, X, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useVehicleStore } from "@/hooks/useVehicleStore";

interface UploadedDocument {
  id: string;
  file: File;
  url: string;
}

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
    titlePresent: false,
    billOfSale: false,
    destination: "",
    buyerName: "",
    saleDate: "",
    salePrice: "",
    notes: ""
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} - Please upload a PDF or image file (JPG, PNG).`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} - Please upload a file smaller than 10MB.`,
          variant: "destructive",
        });
        return;
      }

      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const url = URL.createObjectURL(file);
      
      const newDocument: UploadedDocument = {
        id: documentId,
        file: file,
        url: url
      };

      setUploadedDocuments(prev => [...prev, newDocument]);
      
      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    });

    event.target.value = '';
  };

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => {
      const documentToRemove = prev.find(doc => doc.id === documentId);
      if (documentToRemove) {
        URL.revokeObjectURL(documentToRemove.url);
      }
      return prev.filter(doc => doc.id !== documentId);
    });
  };

  const viewDocument = (document: UploadedDocument) => {
    window.open(document.url, '_blank');
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

    // Add vehicle to store
    addVehicle({
      ...formData,
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
      vehicleId: "",
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
    
    // Clean up document URLs and reset
    uploadedDocuments.forEach(doc => URL.revokeObjectURL(doc.url));
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
            {/* Document Upload */}
            <div className="space-y-4">
              <Label htmlFor="documents" className="text-foreground font-medium">Upload Paperwork (PDF/Image)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="documents"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                <label htmlFor="documents" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-foreground">
                    Click to upload or drag and drop multiple documents
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG up to 10MB each
                  </p>
                </label>
              </div>

              {/* Display uploaded documents */}
              {uploadedDocuments.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-foreground font-medium">Uploaded Documents ({uploadedDocuments.length})</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {uploadedDocuments.map((document) => (
                      <div key={document.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                        <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{document.file.name}</p>
                          <p className="text-xs text-muted-foreground">{(document.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => viewDocument(document)}
                            className="text-primary hover:text-primary"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeDocument(document.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year" className="text-foreground font-medium">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2015"
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  required
                  className="border-border focus:border-primary text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="make" className="text-foreground font-medium">Make *</Label>
                <Input
                  id="make"
                  placeholder="Honda"
                  value={formData.make}
                  onChange={(e) => handleInputChange("make", e.target.value)}
                  required
                  className="border-border focus:border-primary text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model" className="text-foreground font-medium">Model *</Label>
                <Input
                  id="model"
                  placeholder="Civic"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  required
                  className="border-border focus:border-primary text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleId" className="text-foreground font-medium">Vehicle ID (Last 5 of VIN) *</Label>
                <Input
                  id="vehicleId"
                  placeholder="09186"
                  value={formData.vehicleId}
                  onChange={(e) => handleInputChange("vehicleId", e.target.value.toUpperCase())}
                  required
                  maxLength={5}
                  className="border-border focus:border-primary text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate" className="text-foreground font-medium">License Plate</Label>
                <Input
                  id="licensePlate"
                  placeholder="ABC123"
                  value={formData.licensePlate}
                  onChange={(e) => handleInputChange("licensePlate", e.target.value)}
                  className="border-border focus:border-primary text-foreground"
                />
              </div>
            </div>

            {/* Purchase Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellerName" className="text-foreground font-medium">Seller Name</Label>
                <Input
                  id="sellerName"
                  placeholder="John Doe"
                  value={formData.sellerName}
                  onChange={(e) => handleInputChange("sellerName", e.target.value)}
                  className="border-border focus:border-primary text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate" className="text-foreground font-medium">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
                  className="border-border focus:border-primary text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice" className="text-foreground font-medium">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="500"
                  value={formData.purchasePrice}
                  onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                  className="border-border focus:border-primary text-foreground"
                />
              </div>
            </div>

            {/* Document Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border">
                <Switch
                  id="titlePresent"
                  checked={formData.titlePresent}
                  onCheckedChange={(checked) => handleInputChange("titlePresent", checked)}
                />
                <Label htmlFor="titlePresent" className="text-foreground font-medium">Title Present</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border">
                <Switch
                  id="billOfSale"
                  checked={formData.billOfSale}
                  onCheckedChange={(checked) => handleInputChange("billOfSale", checked)}
                />
                <Label htmlFor="billOfSale" className="text-foreground font-medium">Handwritten Bill of Sale</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination" className="text-foreground font-medium">Vehicle Destination</Label>
              <Select value={formData.destination} onValueChange={(value) => handleInputChange("destination", value)}>
                <SelectTrigger className="border-border focus:border-primary text-foreground">
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

            {formData.destination === "buyer" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card border border-border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="buyerName" className="text-foreground font-medium">Buyer Name</Label>
                  <Input
                    id="buyerName"
                    placeholder="Jane Smith"
                    value={formData.buyerName}
                    onChange={(e) => handleInputChange("buyerName", e.target.value)}
                    className="border-border focus:border-primary text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleDate" className="text-foreground font-medium">Date of Sale</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => handleInputChange("saleDate", e.target.value)}
                    className="border-border focus:border-primary text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice" className="text-foreground font-medium">Sale Price</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    placeholder="1500"
                    value={formData.salePrice}
                    onChange={(e) => handleInputChange("salePrice", e.target.value)}
                    className="border-border focus:border-primary text-foreground"
                  />
                </div>
              </div>
            )}

            {formData.destination === "pick-your-part" && (
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-sm text-foreground font-medium">
                  📋 Pick Your Part bill of sale will be auto-generated with vehicle details
                </p>
              </div>
            )}

            {formData.destination === "sa-recycling" && (
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-sm text-foreground font-medium">
                  ♻️ SA Recycling paperwork will be prepared with vehicle information
                </p>
              </div>
            )}

            {formData.destination === "blank-bill-sale" && (
              <div className="p-4 bg-card border border-border rounded-lg">
                <p className="text-sm text-foreground font-medium">
                  📝 Blank bill of sale will be generated for manual completion and handwriting
                </p>
              </div>
            )}

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
