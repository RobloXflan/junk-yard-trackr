
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, ArrowLeft, FileText, Send } from "lucide-react";
import { Vehicle } from "@/stores/vehicleStore";
import { toast } from "sonner";

interface DMVPreviewPageProps {
  vehicles: Vehicle[];
  onBack: () => void;
  onConfirmSubmission: (vehicleIds: string[]) => Promise<void>;
}

export function DMVPreviewPage({ vehicles, onBack, onConfirmSubmission }: DMVPreviewPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    try {
      const vehicleIds = vehicles.map(v => v.id);
      await onConfirmSubmission(vehicleIds);
      toast.success("DMV submission process started");
    } catch (error) {
      console.error('Error submitting to DMV:', error);
      toast.error("Failed to start DMV submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDMVFormData = (vehicle: Vehicle) => {
    return {
      // Seller Information (Americas Auto Towing)
      seller: {
        isCompany: "Yes",
        companyName: "Americas Auto Towing",
        address: "4735 Cecilia St",
        city: "Cudahy",
        state: "CA",
        zipCode: "90201"
      },
      // Buyer Information
      buyer: {
        isCompany: "No",
        firstName: vehicle.buyerFirstName || "",
        lastName: vehicle.buyerLastName || "",
        fullName: `${vehicle.buyerFirstName || ""} ${vehicle.buyerLastName || ""}`.trim()
      },
      // Vehicle Information
      vehicle: {
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vehicleId: vehicle.vehicleId,
        licensePlate: vehicle.licensePlate || "N/A"
      },
      // Sale Information
      sale: {
        price: vehicle.salePrice || "0",
        date: vehicle.saleDate || new Date().toISOString().split('T')[0],
        calculatedPrice: vehicle.purchasePrice ? 
          (parseFloat(vehicle.purchasePrice) + 100).toString() : 
          vehicle.salePrice || "0"
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Button>
          <div>
            <h1 className="text-2xl font-bold">DMV Submission Preview</h1>
            <p className="text-muted-foreground">
              Review the information that will be submitted to the CA DMV NRL system
            </p>
          </div>
        </div>
        <Button 
          onClick={handleConfirmSubmission}
          disabled={isSubmitting || vehicles.length === 0}
          className="bg-green-600 hover:bg-green-700"
        >
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? "Submitting..." : `Confirm DMV Submission (${vehicles.length})`}
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Vehicles Selected</h3>
            <p className="text-muted-foreground">
              No vehicles are currently selected for DMV submission.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Submission Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">{vehicles.length}</div>
                  <div className="text-sm text-muted-foreground">Vehicles to Submit</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    ${vehicles.reduce((sum, v) => sum + parseFloat(v.salePrice || "0"), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sale Value</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">CA DMV NRL</div>
                  <div className="text-sm text-muted-foreground">Submission Type</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          {vehicles.map((vehicle, index) => {
            const formData = formatDMVFormData(vehicle);
            
            return (
              <Card key={vehicle.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Vehicle #{index + 1}: {vehicle.year} {vehicle.make} {vehicle.model}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ready for Submission
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Seller Information */}
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        Seller Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Company:</span>
                          <span className="font-medium">{formData.seller.companyName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Address:</span>
                          <span className="font-medium">{formData.seller.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">City, State ZIP:</span>
                          <span className="font-medium">
                            {formData.seller.city}, {formData.seller.state} {formData.seller.zipCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Buyer Information */}
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        Buyer Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">Individual</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">First Name:</span>
                          <span className="font-medium">{formData.buyer.firstName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Name:</span>
                          <span className="font-medium">{formData.buyer.lastName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        Vehicle Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Year:</span>
                          <span className="font-medium">{formData.vehicle.year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Make:</span>
                          <span className="font-medium">{formData.vehicle.make}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Model:</span>
                          <span className="font-medium">{formData.vehicle.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">VIN:</span>
                          <span className="font-medium font-mono">{formData.vehicle.vehicleId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">License Plate:</span>
                          <span className="font-medium">{formData.vehicle.licensePlate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sale Information */}
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                        Sale Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sale Date:</span>
                          <span className="font-medium">{formData.sale.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sale Price:</span>
                          <span className="font-medium">${parseFloat(formData.sale.price).toLocaleString()}</span>
                        </div>
                        {vehicle.purchasePrice && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Purchase Price:</span>
                            <span className="font-medium">${parseFloat(vehicle.purchasePrice).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* DMV Form Preview */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                      DMV Form Data Preview
                    </h4>
                    <div className="bg-muted/50 p-4 rounded-lg text-xs font-mono space-y-1">
                      <div><span className="text-muted-foreground">Form:</span> CA DMV Notice of Release of Liability (NRL)</div>
                      <div><span className="text-muted-foreground">URL:</span> https://www.dmv.ca.gov/wasapp/nrl/nrlApplication.do</div>
                      <div><span className="text-muted-foreground">Seller Type:</span> Business</div>
                      <div><span className="text-muted-foreground">Buyer Type:</span> Individual</div>
                      <div><span className="text-muted-foreground">Transaction Type:</span> Sale</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Important Notice */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900 mb-2">Important Notice</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• This preview shows the exact data that will be submitted to the CA DMV</li>
                    <li>• Once submitted, you will receive confirmation numbers for tracking</li>
                    <li>• The submission process may take a few minutes to complete</li>
                    <li>• You can track the status of each submission in the vehicle inventory</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
