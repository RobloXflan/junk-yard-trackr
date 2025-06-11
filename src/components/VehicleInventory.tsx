
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Download, Edit } from "lucide-react";

// Mock data - in a real app this would come from your database
const mockVehicles = [
  {
    id: 1,
    year: 2015,
    make: "Honda",
    model: "Civic",
    vin: "1HGBH41JXMN109186",
    licensePlate: "ABC123",
    sellerName: "John Doe",
    purchasePrice: 500,
    purchaseDate: "2024-01-15",
    buyerName: "Jane Smith",
    salePrice: 1500,
    saleDate: "2024-01-20",
    destination: "buyer",
    status: "complete",
  },
  {
    id: 2,
    year: 2018,
    make: "Toyota",
    model: "Camry",
    vin: "4T1BF1FK5GU260429",
    licensePlate: "XYZ789",
    sellerName: "Bob Wilson",
    purchasePrice: 800,
    purchaseDate: "2024-01-18",
    destination: "pick-your-part",
    status: "dmv-submitted",
  },
  {
    id: 3,
    year: 2012,
    make: "Ford",
    model: "F-150",
    vin: "1FTFW1ET5CFA12345",
    licensePlate: "DEF456",
    sellerName: "Alice Johnson",
    purchasePrice: 1200,
    purchaseDate: "2024-01-22",
    destination: "yard",
    status: "pending",
  },
];

export function VehicleInventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");

  const getStatusBadge = (status: string) => {
    const variants = {
      complete: "bg-success text-white",
      "dmv-submitted": "bg-info text-white",
      "pyp-sent": "bg-warning text-white",
      pending: "bg-muted text-muted-foreground",
    };
    
    const labels = {
      complete: "Complete",
      "dmv-submitted": "DMV Submitted",
      "pyp-sent": "PYP Bill Sent",
      pending: "Pending",
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getDestinationBadge = (destination: string) => {
    const variants = {
      buyer: "bg-primary text-primary-foreground",
      "pick-your-part": "bg-accent text-accent-foreground",
      yard: "bg-secondary text-secondary-foreground",
    };
    
    const labels = {
      buyer: "Sold to Buyer",
      "pick-your-part": "Pick Your Part",
      yard: "Still in Yard",
    };

    return (
      <Badge className={variants[destination as keyof typeof variants]}>
        {labels[destination as keyof typeof labels]}
      </Badge>
    );
  };

  const filteredVehicles = mockVehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    const matchesDestination = destinationFilter === "all" || vehicle.destination === destinationFilter;
    
    return matchesSearch && matchesStatus && matchesDestination;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="shadow-business">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Vehicle Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Input
                placeholder="Search by VIN, License, Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="dmv-submitted">DMV Submitted</SelectItem>
                  <SelectItem value="pyp-sent">PYP Bill Sent</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Destinations</SelectItem>
                  <SelectItem value="yard">Still in Yard</SelectItem>
                  <SelectItem value="buyer">Sold to Buyer</SelectItem>
                  <SelectItem value="pick-your-part">Pick Your Part</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Table */}
      <Card className="shadow-business">
        <CardHeader>
          <CardTitle>Vehicle Inventory ({filteredVehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Vehicle</th>
                  <th className="text-left p-3 font-medium">VIN</th>
                  <th className="text-left p-3 font-medium">Seller/Price</th>
                  <th className="text-left p-3 font-medium">Buyer/Sale</th>
                  <th className="text-left p-3 font-medium">Destination</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.licensePlate}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {vehicle.vin}
                      </code>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="text-sm">{vehicle.sellerName}</div>
                        <div className="text-sm font-medium text-success">
                          ${vehicle.purchasePrice}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {vehicle.purchaseDate}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {vehicle.buyerName ? (
                        <div>
                          <div className="text-sm">{vehicle.buyerName}</div>
                          <div className="text-sm font-medium text-primary">
                            ${vehicle.salePrice}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {vehicle.saleDate}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {getDestinationBadge(vehicle.destination)}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(vehicle.status)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <FileText className="w-3 h-3 mr-1" />
                          Docs
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Forms
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
