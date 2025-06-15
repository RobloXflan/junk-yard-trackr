
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVehicleStorePaginated } from "@/hooks/useVehicleStorePaginated";
import { Vehicle } from "@/stores/vehicleStore";
import { toast } from "sonner";

export function DMVManagement() {
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [submittingToDMV, setSubmittingToDMV] = useState(false);
  
  const { 
    vehicles, 
    isLoading, 
    refreshVehicles,
    submitToDMV
  } = useVehicleStorePaginated();

  // Filter vehicles for DMV management
  const soldVehicles = vehicles.filter(v => v.status === 'sold');
  const eligibleVehicles = soldVehicles.filter(v => 
    v.buyerFirstName && 
    v.buyerLastName &&
    v.dmvStatus === 'pending'
  );

  const handleSelectVehicle = (vehicleId: string, checked: boolean) => {
    const newSelected = new Set(selectedVehicles);
    if (checked) {
      newSelected.add(vehicleId);
    } else {
      newSelected.delete(vehicleId);
    }
    setSelectedVehicles(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVehicles(new Set(eligibleVehicles.map(v => v.id)));
    } else {
      setSelectedVehicles(new Set());
    }
  };

  const handleSubmitToDMV = async () => {
    if (selectedVehicles.size === 0) {
      toast.error("Please select vehicles to submit to DMV");
      return;
    }

    setSubmittingToDMV(true);
    try {
      const result = await submitToDMV(Array.from(selectedVehicles));
      
      if (result.success) {
        const successCount = result.results?.filter((r: any) => r.success).length || 0;
        const failedCount = result.results?.filter((r: any) => !r.success).length || 0;
        
        if (successCount > 0) {
          toast.success(`Successfully submitted ${successCount} vehicle${successCount !== 1 ? 's' : ''} to DMV`);
        }
        if (failedCount > 0) {
          toast.error(`Failed to submit ${failedCount} vehicle${failedCount !== 1 ? 's' : ''}`);
        }
        
        setSelectedVehicles(new Set());
      } else {
        toast.error("Failed to submit vehicles to DMV");
      }
    } catch (error) {
      console.error('Error submitting to DMV:', error);
      toast.error("Failed to submit vehicles to DMV");
    } finally {
      setSubmittingToDMV(false);
    }
  };

  const getDMVStatusInfo = (dmvStatus?: string) => {
    switch (dmvStatus) {
      case 'submitted':
        return { 
          badge: <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Submitted</Badge>,
          description: 'Successfully submitted to DMV'
        };
      case 'processing':
        return { 
          badge: <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Processing</Badge>,
          description: 'Currently being processed'
        };
      case 'failed':
        return { 
          badge: <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>,
          description: 'Submission failed - requires attention'
        };
      case 'pending':
      default:
        return { 
          badge: <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>,
          description: 'Ready for DMV submission'
        };
    }
  };

  const dmvStats = {
    total: soldVehicles.length,
    pending: soldVehicles.filter(v => v.dmvStatus === 'pending').length,
    submitted: soldVehicles.filter(v => v.dmvStatus === 'submitted').length,
    failed: soldVehicles.filter(v => v.dmvStatus === 'failed').length,
    eligible: eligibleVehicles.length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">DMV Management</h2>
          <p className="text-muted-foreground">
            Manage Notice of Release of Liability submissions to California DMV
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshVehicles}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleSubmitToDMV}
            disabled={selectedVehicles.size === 0 || submittingToDMV}
            className="gradient-primary"
          >
            <Send className="w-4 h-4 mr-2" />
            {submittingToDMV ? 'Submitting...' : `Submit to DMV (${selectedVehicles.size})`}
          </Button>
        </div>
      </div>

      {/* DMV Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{dmvStats.total}</div>
            <p className="text-sm text-muted-foreground">Total Sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{dmvStats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{dmvStats.submitted}</div>
            <p className="text-sm text-muted-foreground">Submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{dmvStats.failed}</div>
            <p className="text-sm text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{dmvStats.eligible}</div>
            <p className="text-sm text-muted-foreground">Ready to Submit</p>
          </CardContent>
        </Card>
      </div>

      {/* Sold Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Sold Vehicles DMV Status ({soldVehicles.length} total)
            {eligibleVehicles.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({eligibleVehicles.length} ready for submission)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {soldVehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sold vehicles found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {eligibleVehicles.length > 0 && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedVehicles.size > 0 && selectedVehicles.size === eligibleVehicles.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded"
                      />
                    </TableHead>
                  )}
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>DMV Status</TableHead>
                  <TableHead>Confirmation #</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soldVehicles.map((vehicle) => {
                  const isEligibleForDMV = vehicle.buyerFirstName && 
                    vehicle.buyerLastName &&
                    vehicle.dmvStatus === 'pending';
                  const statusInfo = getDMVStatusInfo(vehicle.dmvStatus);
                  
                  return (
                    <TableRow key={vehicle.id}>
                      {eligibleVehicles.length > 0 && (
                        <TableCell>
                          {isEligibleForDMV && (
                            <input
                              type="checkbox"
                              checked={selectedVehicles.has(vehicle.id)}
                              onChange={(e) => handleSelectVehicle(vehicle.id, e.target.checked)}
                              className="rounded"
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {vehicle.vehicleId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {vehicle.buyerFirstName && vehicle.buyerLastName ? (
                          <div>
                            <div>{vehicle.buyerFirstName} {vehicle.buyerLastName}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No buyer info</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {vehicle.saleDate || '-'}
                      </TableCell>
                      <TableCell>
                        {vehicle.salePrice ? `$${parseFloat(vehicle.salePrice).toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        {statusInfo.badge}
                      </TableCell>
                      <TableCell>
                        {vehicle.dmvConfirmationNumber ? (
                          <span className="font-mono text-sm">{vehicle.dmvConfirmationNumber}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {vehicle.dmvSubmittedAt ? (
                          <span className="text-sm">
                            {new Date(vehicle.dmvSubmittedAt).toLocaleDateString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
