import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Car, FileText, Eye, Printer, Trash2 } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";

interface TripData {
  tripNumber: number;
  date: string;
  vehicle1?: any;
  vehicle2?: any;
  savedAt?: string;
  printed?: boolean;
}

export function SATrips() {
  const [trips, setTrips] = useState<TripData[]>([]);

  useEffect(() => {
    loadSavedTrips();
  }, []);

  const loadSavedTrips = () => {
    const savedTrips: TripData[] = [];
    
    // Scan localStorage for SA trip data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sa-trip-')) {
        try {
          const tripData = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Extract date and trip number from key: sa-trip-YYYY-MM-DD-N
          const keyParts = key.split('-');
          if (keyParts.length >= 6) {
            const dateStr = `${keyParts[2]}-${keyParts[3]}-${keyParts[4]}`;
            const tripNumber = parseInt(keyParts[5]);
            
            if (tripData.vehicle1 || tripData.vehicle2) {
              savedTrips.push({
                tripNumber,
                date: dateStr,
                vehicle1: tripData.vehicle1,
                vehicle2: tripData.vehicle2,
                savedAt: tripData.savedAt,
                printed: tripData.printed
              });
            }
          }
        } catch (error) {
          console.error('Error parsing trip data:', error);
        }
      }
    }
    
    // Sort by date (newest first) then by trip number
    savedTrips.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.tripNumber - a.tripNumber;
    });
    
    setTrips(savedTrips);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return isValid(date) ? format(date, 'MMM d, yyyy') : dateStr;
    } catch {
      return dateStr;
    }
  };

  const handleViewTrip = (trip: TripData) => {
    // Store the trip data for the document editor
    const tripKey = `sa-trip-${trip.date}-${trip.tripNumber}`;
    localStorage.setItem('current-sa-trip', tripKey);
    
    // Navigate to documents page
    window.location.href = '/documents';
  };

  const handlePrintTrip = (trip: TripData) => {
    // Similar to view but with print flag
    const tripKey = `sa-trip-${trip.date}-${trip.tripNumber}`;
    localStorage.setItem('current-sa-trip', tripKey);
    localStorage.setItem('auto-print-trip', 'true');
    
    // Navigate to documents page
    window.location.href = '/documents';
  };

  const handleClearAllTrips = () => {
    if (!confirm('Are you sure you want to clear all SA trips? This action cannot be undone.')) {
      return;
    }

    let clearedCount = 0;
    const keysToRemove: string[] = [];
    
    // Collect all SA trip keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sa-trip-')) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all SA trip keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      clearedCount++;
    });
    
    // Also clear any related temporary data
    localStorage.removeItem('current-sa-trip');
    localStorage.removeItem('auto-print-trip');
    localStorage.removeItem('documents-vehicle-data-1');
    localStorage.removeItem('documents-vehicle-data-2');
    localStorage.removeItem('documents-next-vehicle-slot');
    
    // Refresh the trips list
    loadSavedTrips();
    
    toast.success(`Cleared ${clearedCount} SA trips successfully`);
  };

  const getTripStatus = (trip: TripData) => {
    const vehicleCount = (trip.vehicle1 ? 1 : 0) + (trip.vehicle2 ? 1 : 0);
    if (vehicleCount === 2) return { label: 'Complete', color: 'bg-green-100 text-green-700' };
    if (vehicleCount === 1) return { label: 'Partial', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Empty', color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SA Trips</h1>
          <p className="text-muted-foreground">
            Manage and view SA Recycling trip documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadSavedTrips} variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {trips.length > 0 && (
            <Button onClick={handleClearAllTrips} variant="outline" className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Trips
            </Button>
          )}
        </div>
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No SA Trips Found</h3>
            <p className="text-muted-foreground">
              Start by selecting vehicles from the inventory and creating trip documents.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip, index) => {
            const status = getTripStatus(trip);
            
            return (
              <Card key={`${trip.date}-${trip.tripNumber}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      Trip {trip.tripNumber} - {formatDate(trip.date)}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={status.color}>
                        {status.label}
                      </Badge>
                      {trip.printed && (
                        <Badge variant="outline">
                          Printed
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Vehicle Information */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Vehicle 1 */}
                      <div className="p-3 rounded-lg border">
                        <h4 className="font-medium text-sm mb-2">Vehicle Slot 1</h4>
                        {trip.vehicle1 ? (
                          <div className="space-y-1">
                            <div className="font-medium">
                              {trip.vehicle1.year} {trip.vehicle1.make} {trip.vehicle1.model}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {trip.vehicle1.vehicleId}
                            </div>
                            {trip.vehicle1.sellerName && (
                              <div className="text-sm text-muted-foreground">
                                Seller: {trip.vehicle1.sellerName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Empty</div>
                        )}
                      </div>

                      {/* Vehicle 2 */}
                      <div className="p-3 rounded-lg border">
                        <h4 className="font-medium text-sm mb-2">Vehicle Slot 2</h4>
                        {trip.vehicle2 ? (
                          <div className="space-y-1">
                            <div className="font-medium">
                              {trip.vehicle2.year} {trip.vehicle2.make} {trip.vehicle2.model}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {trip.vehicle2.vehicleId}
                            </div>
                            {trip.vehicle2.sellerName && (
                              <div className="text-sm text-muted-foreground">
                                Seller: {trip.vehicle2.sellerName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Empty</div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewTrip(trip)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Documents
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePrintTrip(trip)}
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Trip
                      </Button>
                    </div>

                    {/* Metadata */}
                    {trip.savedAt && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Saved: {format(new Date(trip.savedAt), 'MMM d, yyyy h:mm a')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}