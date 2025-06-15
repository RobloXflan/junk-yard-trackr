
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { useVehicleStorePaginated } from "@/hooks/useVehicleStorePaginated";
import { useState } from "react";

export function DMVPreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { vehicles, submitToDMV, refreshVehicles } = useVehicleStorePaginated();
  const [submitting, setSubmitting] = useState(false);

  // Location state from link (selected vehicle IDs)
  const selectedIds: string[] = (location.state && location.state.selectedVehicles) || [];

  // Collect full vehicle data for those IDs
  const vehiclesToSubmit = vehicles.filter(v => selectedIds.includes(v.id));

  const handleBack = () => {
    navigate(-1); // Go back to inventory page
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const result = await submitToDMV(selectedIds);
      let successCount = result.results?.filter((r: any) => r.success).length || 0;
      let failCount = result.results?.filter((r: any) => !r.success).length || 0;
      if (successCount) toast.success(`Submitted ${successCount} vehicle${successCount > 1 ? "s" : ""} to DMV`);
      if (failCount) toast.error(`Failed to submit ${failCount} vehicle${failCount > 1 ? "s" : ""}`);
      await refreshVehicles();
      navigate("/inventory"); // or your inventory route
    } catch (error) {
      toast.error("Submission failed.");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Review DMV Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-muted-foreground">
              Please review the following vehicle data before submitting to the CA DMV. 
              Click "Back" to make changes or "Confirm" to proceed.
            </p>
          </div>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full border text-left text-sm">
              <thead>
                <tr className="text-muted-foreground">
                  <th>Year</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Plate</th>
                  <th>Buyer</th>
                  <th>Sale Price</th>
                  <th>Sale Date</th>
                </tr>
              </thead>
              <tbody>
                {vehiclesToSubmit.map((v) => (
                  <tr key={v.id} className="border-b">
                    <td>{v.year}</td>
                    <td>{v.make}</td>
                    <td>{v.model}</td>
                    <td>{v.licensePlate || "-"}</td>
                    <td>
                      {v.buyerFirstName} {v.buyerLastName} <br />
                    </td>
                    <td>{v.salePrice ? `$${v.salePrice}` : "-"}</td>
                    <td>{v.saleDate || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={handleBack} disabled={submitting}>
              Back
            </Button>
            <Button onClick={handleConfirm} disabled={submitting || !vehiclesToSubmit.length}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
