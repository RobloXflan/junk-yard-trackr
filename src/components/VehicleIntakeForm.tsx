
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useToast } from "@/hooks/use-toast"
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { DocumentUpload, UploadedDocument } from "@/components/forms/DocumentUpload";
import type { PendingIntakeDocument, ExtractedVehicleInfo } from "@/types/pendingIntake";

interface VehicleIntakeFormProps {
  onNavigate?: (page: string) => void;
  pendingIntakeId?: string;
}

export function VehicleIntakeForm({ onNavigate, pendingIntakeId }: VehicleIntakeFormProps) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [licensePlate, setLicensePlate] = useState<string | undefined>("");
  const [sellerName, setSellerName] = useState<string | undefined>("");
  const [purchaseDate, setPurchaseDate] = useState<string | undefined>("");
  const [purchasePrice, setPurchasePrice] = useState<string | undefined>("");
  const [titlePresent, setTitlePresent] = useState(false);
  const [billOfSale, setBillOfSale] = useState(false);
  const [destination, setDestination] = useState<string | undefined>("");
  const [buyerName, setBuyerName] = useState<string | undefined>("");
  const [buyerFirstName, setBuyerFirstName] = useState<string | undefined>("");
  const [buyerLastName, setBuyerLastName] = useState<string | undefined>("");
  const [saleDate, setSaleDate] = useState<string | undefined>("");
  const [salePrice, setSalePrice] = useState<string | undefined>("");
  const [notes, setNotes] = useState<string | undefined>("");
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { pendingIntakeId: urlPendingIntakeId } = useParams<{ pendingIntakeId?: string }>();

  // Use pendingIntakeId from props or URL params
  const currentPendingIntakeId = pendingIntakeId || urlPendingIntakeId;

  useEffect(() => {
    const loadPendingIntake = async () => {
      if (!currentPendingIntakeId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pending_intakes')
          .select('*')
          .eq('id', currentPendingIntakeId)
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

        if (data) {
          // Safely parse the documents JSON with proper type checking
          let documents: PendingIntakeDocument[] = [];
          if (data.documents && Array.isArray(data.documents)) {
            documents = (data.documents as any[]).filter(doc => 
              doc && typeof doc === 'object' && 
              doc.id && doc.name && doc.size && doc.url
            ).map(doc => ({
              id: doc.id,
              name: doc.name,
              size: doc.size,
              url: doc.url,
              contentType: doc.contentType
            }));
          }

          // Safely parse the extracted_info JSON
          const extractedInfo = data.extracted_info as ExtractedVehicleInfo || {};

          // Pre-populate form with extracted data
          if (extractedInfo.year) setYear(extractedInfo.year);
          if (extractedInfo.make) setMake(extractedInfo.make);
          if (extractedInfo.model) setModel(extractedInfo.model);
          if (extractedInfo.vehicleId) setVehicleId(extractedInfo.vehicleId);

          // Convert documents to the format expected by DocumentUpload
          const uploadedDocs: UploadedDocument[] = documents.map(doc => ({
            id: doc.id,
            file: new File([], doc.name, { type: doc.contentType || 'application/octet-stream' }),
            url: doc.url,
            name: doc.name,
            size: doc.size
          }));

          setUploadedDocuments(uploadedDocs);
          
          toast({
            title: "Data Loaded",
            description: "Pending intake data has been loaded into the form.",
          });
        }
      } catch (error) {
        console.error('Error loading pending intake:', error);
        toast({
          title: "Error",
          description: "An error occurred while loading the data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPendingIntake();
  }, [currentPendingIntakeId]);

  // Helper function to serialize documents for Supabase storage
  const serializeDocuments = (documents: UploadedDocument[]) => {
    return documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      size: doc.size,
      url: doc.url,
      // Don't store the File object, just the essential data
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const vehicleData = {
        year,
        make,
        model,
        vehicle_id: vehicleId,
        license_plate: licensePlate,
        seller_name: sellerName,
        purchase_date: purchaseDate,
        purchase_price: purchasePrice,
        title_present: titlePresent,
        bill_of_sale: billOfSale,
        destination,
        buyer_name: buyerName,
        buyer_first_name: buyerFirstName,
        buyer_last_name: buyerLastName,
        sale_date: saleDate,
        sale_price: salePrice,
        notes,
        documents: serializeDocuments(uploadedDocuments),
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select();

      if (error) {
        console.error('Error adding vehicle:', error);
        toast({
          title: "Error",
          description: "Failed to add vehicle. Please check the form and try again.",
          variant: "destructive",
        });
        return;
      }

      // If currentPendingIntakeId is present, update the pending intake status to 'completed'
      if (currentPendingIntakeId) {
        const { error: updateError } = await supabase
          .from('pending_intakes')
          .update({ status: 'completed' })
          .eq('id', currentPendingIntakeId);

        if (updateError) {
          console.error('Error updating pending intake status:', updateError);
          toast({
            title: "Warning",
            description: "Vehicle added, but failed to update pending intake status.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Vehicle added and pending intake status updated.",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Vehicle added successfully.",
        });
      }

      // Reset the form
      setYear("");
      setMake("");
      setModel("");
      setVehicleId("");
      setLicensePlate(undefined);
      setSellerName(undefined);
      setPurchaseDate(undefined);
      setPurchasePrice(undefined);
      setTitlePresent(false);
      setBillOfSale(false);
      setDestination(undefined);
      setBuyerName(undefined);
      setBuyerFirstName(undefined);
      setBuyerLastName(undefined);
      setSaleDate(undefined);
      setSalePrice(undefined);
      setNotes(undefined);
      setUploadedDocuments([]);

      // Navigate to the inventory page
      navigate('/inventory');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to add vehicle. Please check the form and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg rounded-lg">
        <CardHeader className="bg-secondary text-secondary-foreground">
          <CardTitle className="text-lg font-bold">Vehicle Intake Form</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  type="text"
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  type="text"
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  type="text"
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vehicleId">Vehicle ID</Label>
                <Input
                  type="text"
                  id="vehicleId"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  type="text"
                  id="licensePlate"
                  value={licensePlate || ""}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="sellerName">Seller Name</Label>
                <Input
                  type="text"
                  id="sellerName"
                  value={sellerName || ""}
                  onChange={(e) => setSellerName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  type="date"
                  id="purchaseDate"
                  value={purchaseDate || ""}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  type="number"
                  id="purchasePrice"
                  value={purchasePrice || ""}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titlePresent">Title Present</Label>
                <Input
                  type="checkbox"
                  id="titlePresent"
                  checked={titlePresent}
                  onChange={(e) => setTitlePresent(e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <Label htmlFor="billOfSale">Bill of Sale</Label>
                <Input
                  type="checkbox"
                  id="billOfSale"
                  checked={billOfSale}
                  onChange={(e) => setBillOfSale(e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  type="text"
                  id="destination"
                  value={destination || ""}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="buyerName">Buyer Name</Label>
                <Input
                  type="text"
                  id="buyerName"
                  value={buyerName || ""}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="buyerFirstName">Buyer First Name</Label>
                <Input
                  type="text"
                  id="buyerFirstName"
                  value={buyerFirstName || ""}
                  onChange={(e) => setBuyerFirstName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="buyerLastName">Buyer Last Name</Label>
                <Input
                  type="text"
                  id="buyerLastName"
                  value={buyerLastName || ""}
                  onChange={(e) => setBuyerLastName(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="saleDate">Sale Date</Label>
                <Input
                  type="date"
                  id="saleDate"
                  value={saleDate || ""}
                  onChange={(e) => setSaleDate(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="salePrice">Sale Price</Label>
                <Input
                  type="number"
                  id="salePrice"
                  value={salePrice || ""}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                type="textarea"
                id="notes"
                value={notes || ""}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                className="min-h-[80px]"
              />
            </div>

            <DocumentUpload
              uploadedDocuments={uploadedDocuments}
              onDocumentsChange={setUploadedDocuments}
            />

            <Button type="submit" disabled={loading} className="w-full gradient-primary">
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
