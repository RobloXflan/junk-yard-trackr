import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ViewOnlyVehicleDialog } from "@/components/ViewOnlyVehicleDialog";
import { Search, LogOut, CheckCircle, XCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  year: string;
  make: string;
  model: string;
  vehicle_id: string;
  status: string;
  paperwork: string;
  title_present: boolean;
  bill_of_sale: boolean;
  documents: any[];
}

interface ViewOnlyInventoryProps {
  onLogout: () => void;
  username: string;
}

export const ViewOnlyInventory = ({ onLogout, username }: ViewOnlyInventoryProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = vehicles.filter((vehicle) =>
        `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.vehicle_id}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [searchTerm, vehicles]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, year, make, model, vehicle_id, status, paperwork, title_present, bill_of_sale, documents")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Vehicle interface, ensuring documents is always an array
      const transformedData: Vehicle[] = (data || []).map(vehicle => ({
        id: vehicle.id,
        year: vehicle.year || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        vehicle_id: vehicle.vehicle_id || '',
        status: vehicle.status || '',
        paperwork: vehicle.paperwork || '',
        title_present: Boolean(vehicle.title_present),
        bill_of_sale: Boolean(vehicle.bill_of_sale),
        documents: Array.isArray(vehicle.documents) ? vehicle.documents : [],
      }));

      setVehicles(transformedData);
      setFilteredVehicles(transformedData);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast({
        title: "Error",
        description: "Failed to load vehicle inventory",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "yard":
        return "bg-blue-100 text-blue-800";
      case "sold":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaperworkColor = (paperwork: string) => {
    switch (paperwork?.toLowerCase()) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "missing":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vehicle Inventory</h1>
              <p className="text-sm text-gray-600">Logged in as: {username} (View Only)</p>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading inventory...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <Card 
                key={vehicle.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleVehicleClick(vehicle)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(vehicle.status)}>
                      {vehicle.status || "Unknown"}
                    </Badge>
                    <Badge className={getPaperworkColor(vehicle.paperwork)}>
                      {vehicle.paperwork || "Unknown"} Paperwork
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Vehicle ID</p>
                    <p className="font-semibold">{vehicle.vehicle_id}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {vehicle.title_present ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">Title</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {vehicle.bill_of_sale ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">Bill of Sale</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {vehicle.documents && vehicle.documents.length > 0 ? (
                        <>
                          <Eye className="w-4 h-4" />
                          <span>{vehicle.documents.length} document(s)</span>
                        </>
                      ) : (
                        <span className="text-gray-400">No documents</span>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVehicleClick(vehicle);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredVehicles.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? "No vehicles match your search." : "No vehicles in inventory."}
            </p>
          </div>
        )}
      </div>

      <ViewOnlyVehicleDialog 
        vehicle={selectedVehicle}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};
