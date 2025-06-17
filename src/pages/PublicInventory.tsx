
import { useVehicleStorePaginated } from "@/hooks/useVehicleStorePaginated";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Car, Hash, FileText, Image, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PublicLogin } from "@/components/PublicLogin";

export function PublicInventory() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { vehicles, isLoading, searchTerm, setSearchTerm, loadMore, hasMore } = useVehicleStorePaginated();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <PublicLogin onLogin={handleLogin} />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'yard': return 'bg-blue-500';
      case 'sold': return 'bg-green-500';
      case 'pick-your-part': return 'bg-orange-500';
      case 'sa-recycling': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'yard': return 'In Yard';
      case 'sold': return 'Sold';
      case 'pick-your-part': return 'Pick Your Part';
      case 'sa-recycling': return 'SA Recycling';
      default: return status;
    }
  };

  if (isLoading && vehicles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Logout */}
        <div className="mb-8 flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Vehicle Inventory</h1>
            <p className="text-gray-600">Browse our current vehicle inventory</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by make, model, year, or vehicle ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{vehicles.length}</div>
              <div className="text-sm text-gray-600">Total Vehicles</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {vehicles.filter(v => v.status === 'yard').length}
              </div>
              <div className="text-sm text-gray-600">In Yard</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {vehicles.filter(v => v.status === 'pick-your-part').length}
              </div>
              <div className="text-sm text-gray-600">Pick Your Part</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {vehicles.filter(v => v.status === 'sa-recycling').length}
              </div>
              <div className="text-sm text-gray-600">SA Recycling</div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Grid */}
        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Car className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Vehicles Found</h3>
              <p className="text-gray-600">
                {searchTerm ? "Try adjusting your search terms." : "No vehicles in inventory at this time."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="w-5 h-5" />
                        <span className="text-lg">{vehicle.year} {vehicle.make}</span>
                      </div>
                      <Badge className={`text-white ${getStatusColor(vehicle.status)}`}>
                        {getStatusLabel(vehicle.status)}
                      </Badge>
                    </CardTitle>
                    <p className="text-xl font-semibold text-gray-700">{vehicle.model}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Vehicle ID */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Vehicle ID:</span>
                      <span className="font-mono text-sm">{vehicle.vehicleId}</span>
                    </div>

                    {/* Paperwork Status */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium">Paperwork:</span>
                      <span className="text-sm">
                        {vehicle.paperwork ? 
                          (vehicle.paperwork === 'other' ? vehicle.paperworkOther || 'Other' : vehicle.paperwork)
                          : 'Not specified'
                        }
                      </span>
                    </div>

                    {/* Documents indicator */}
                    {vehicle.documents && vehicle.documents.length > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded">
                        <Image className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">
                          {vehicle.documents.length} document{vehicle.documents.length !== 1 ? 's' : ''} available
                        </span>
                      </div>
                    )}

                    {/* Title Status */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Title Present:</span>
                      <Badge variant={vehicle.titlePresent ? "default" : "secondary"}>
                        {vehicle.titlePresent ? "Yes" : "No"}
                      </Badge>
                    </div>

                    {/* Bill of Sale Status */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Bill of Sale:</span>
                      <Badge variant={vehicle.billOfSale ? "default" : "secondary"}>
                        {vehicle.billOfSale ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && !searchTerm && (
              <div className="text-center mt-8">
                <Button 
                  onClick={loadMore} 
                  disabled={isLoading}
                  variant="outline"
                  size="lg"
                >
                  {isLoading ? "Loading..." : "Load More Vehicles"}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Vehicle inventory is updated in real-time</p>
        </div>
      </div>
    </div>
  );
}
