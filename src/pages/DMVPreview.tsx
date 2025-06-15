
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DMVPreviewPage } from "@/components/DMVPreviewPage";
import { useVehicleStorePaginated } from "@/hooks/useVehicleStorePaginated";
import { Vehicle } from "@/stores/vehicleStore";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export default function DMVPreview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { vehicles, isLoading, submitToDMV } = useVehicleStorePaginated();
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const vehicleIds = searchParams.get('vehicles')?.split(',') || [];
    
    if (vehicleIds.length > 0 && vehicles.length > 0) {
      const filtered = vehicles.filter(v => 
        vehicleIds.includes(v.id) && 
        v.status === 'sold' && 
        v.buyerFirstName && 
        v.buyerLastName &&
        v.dmvStatus === 'pending'
      );
      setSelectedVehicles(filtered);
    }
  }, [searchParams, vehicles]);

  const handleBack = () => {
    navigate('/inventory-optimized');
  };

  const handleConfirmSubmission = async (vehicleIds: string[]) => {
    await submitToDMV(vehicleIds);
    navigate('/inventory-optimized');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading vehicle data...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <DMVPreviewPage
          vehicles={selectedVehicles}
          onBack={handleBack}
          onConfirmSubmission={handleConfirmSubmission}
        />
      </div>
    </div>
  );
}
