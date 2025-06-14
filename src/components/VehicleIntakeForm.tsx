
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Save, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useVehicleStore } from "@/hooks/useVehicleStore";
import { DocumentUpload, UploadedDocument } from "./forms/DocumentUpload";
import { VehicleDetails } from "./forms/VehicleDetails";
import { PurchaseInfo } from "./forms/PurchaseInfo";
import { DocumentStatus } from "./forms/DocumentStatus";
import { DestinationSelector } from "./forms/DestinationSelector";
import { supabase } from "@/integrations/supabase/client";
import type { ExtractedVehicleInfo, PendingIntakeDocument } from "@/types/pendingIntake";

interface VehicleIntakeFormProps {
  pendingIntakeId?: string;
}

export function VehicleIntakeForm({ pendingIntakeId }: VehicleIntakeFormProps) {
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
  const [pendingIntake, setPendingIntake] = useState<any>(null);
  const [loadingPendingIntake, setLoadingPendingIntake] = useState(false);

  useEffect(() => {
    if (pendingIntakeId) {
      loadPendingIntake(pendingIntakeId);
    }
  }, [pendingIntakeId]);

  const loadPendingIntake = async (id: string) => {
    setLoadingPendingIntake(true);
    try {
      const { data, error } = await supabase
        .from('pending_intakes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading pending intake:', error);
        toast({
          title: "Error",
          description: "Failed to load pending intake data.",
          variant: "destructive",
        });
        return;
      }

      setPendingIntake(data);
      
      // Pre-populate form with extracted info - properly handle JSON type
      if (data.extracted_info) {
        const extractedInfo = data.extracted_info as ExtractedVehicleInfo;
        setFormData(prev => ({
          ...prev,
          year: extractedInfo.year || "",
          make: extractedInfo.make || "",
          model: extractedInfo.model || "",
          vehicleId: extractedInfo.vehicleId || "",
          sellerName: data.email_from || "",
          notes: `Email processed from: ${data.email_from}\nSubject: ${data.email_subject || 'N/A'}\nReceived: ${new Date(data.email_received_at).toLocaleString()}`
        }));
      }

      // Convert email documents to uploaded documents format - properly handle JSON array
      if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) {
        const convertedDocs: UploadedDocument[] = (data.documents as PendingIntakeDocument[]).map((doc: PendingIntakeDocument) => ({
          id: doc.id,
          file: new File([], doc.name, { type: doc.contentType || 'application/octet-stream' }),
          url: doc.url,
          name: doc.name,
          size: doc.size || 0
        }));
        setUploadedDocuments(convertedDocs);
      }

      // Mark as in progress
      await supabase
        .from('pending_intakes')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', id);

    } catch (error) {
      console.error('Error loading pending intake:', error);
    } finally {
      setLoadingPendingIntake(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      // Add vehicle to store
      await addVehicle({
        ...formData,
        buyerName: combinedBuyerName,
        documents: uploadedDocuments
      });

      // If this was from a pending intake, mark it as completed
      if (pendingIntakeId) {
        await supabase
          .from('pending_intakes')
          .update({ 
            status: 'completed', 
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', pendingIntakeId);
      }
      
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

      if (pendingIntakeId) {
        successMessage += " Email intake completed successfully.";
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
      setPendingIntake(null);

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to save vehicle. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {pendingIntake && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Mail className="w-5 h-5" />
              Processing Email Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">From:</span> {pendingIntake.email_from}
              </div>
              <div>
                <span className="font-medium">Subject:</span> {pendingIntake.email_subject || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Received:</span> {new Date(pendingIntake.email_received_at).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Documents:</span> {Array.isArray(pendingIntake.documents) ? pendingIntake.documents.length : 0} attached
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-business border-border">
        <CardHeader className="bg-card border-b border-border">
          <CardTitle className="flex items-center gap-2 text-foreground font-bold">
            <Upload className="w-5 h-5 text-primary" />
            Vehicle Intake Form
            {pendingIntake && <span className="text-sm text-blue-600 ml-2">(Email Intake)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loadingPendingIntake ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading pending intake...</p>
              </div>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
