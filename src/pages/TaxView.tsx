import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Car, Receipt, Printer, Building2 } from "lucide-react";
import { format } from "date-fns";

interface BusinessPurchase {
  id: string;
  item_name: string;
  purchase_date: string;
  purchase_price: number;
  vendor_store: string;
  category: string;
  receipt_url: string | null;
  payment_method: string;
  notes_purpose: string | null;
}

interface Vehicle {
  id: string;
  year: string;
  make: string;
  model: string;
  vehicle_id: string;
  license_plate: string | null;
  purchase_date: string | null;
  purchase_price: string | null;
  sale_date: string | null;
  sale_price: string | null;
  status: string;
  documents: any;
  car_images: any;
}

export function TaxView() {
  const [purchases, setPurchases] = useState<BusinessPurchase[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Get year and token from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const year = urlParams.get('year') || new Date().getFullYear().toString();
  const token = urlParams.get('token');

  useEffect(() => {
    // Simple token validation - in production you'd validate against stored tokens
    if (token && token.length >= 10) {
      setIsAuthorized(true);
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [year, token]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      // Load business purchases
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('business_purchases')
        .select('*')
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate)
        .order('purchase_date', { ascending: false });

      if (purchaseError) throw purchaseError;
      setPurchases(purchaseData || []);

      // Load vehicles
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (vehicleError) throw vehicleError;

      // Filter vehicles by purchase year only
      const filteredVehicles = (vehicleData || []).filter((v: Vehicle) => {
        const purchaseYear = v.purchase_date ? new Date(v.purchase_date).getFullYear().toString() : null;
        return purchaseYear === year;
      });

      setVehicles(filteredVehicles);
    } catch (error) {
      console.error('Error loading tax data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const expenseSummary = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let total = 0;

    purchases.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + p.purchase_price;
      total += p.purchase_price;
    });

    return { byCategory, total };
  }, [purchases]);

  const vehicleSummary = useMemo(() => {
    let totalPurchases = 0;

    vehicles.forEach(v => {
      const purchasePrice = parseFloat(v.purchase_price || '0') || 0;
      if (v.purchase_date && new Date(v.purchase_date).getFullYear().toString() === year) {
        totalPurchases += purchasePrice;
      }
    });

    return { totalPurchases };
  }, [vehicles, year]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (!isAuthorized && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
            <p className="text-slate-600">
              This tax report requires a valid access link. Please contact the business owner for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Header */}
      <header className="bg-blue-600 text-white py-6 px-4 print:bg-white print:text-black print:border-b-2">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center print:bg-blue-100">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">America's Auto Towing LLC</h1>
                <p className="text-blue-100 print:text-slate-600">Tax Report for {year}</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => window.print()} 
              className="print:hidden"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
          </div>
          <p className="text-sm text-blue-100 mt-2 print:text-slate-500">
            Generated on {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 print:p-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
          <Card className="bg-blue-50 border-blue-200 print:border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Business Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(expenseSummary.total)}</div>
              <p className="text-xs text-blue-700">{purchases.length} receipts</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200 print:border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Vehicle Purchases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{formatCurrency(vehicleSummary.totalPurchases)}</div>
              <p className="text-xs text-orange-700">{vehicles.length} vehicles</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Expense Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(expenseSummary.byCategory).map(([category, amount]) => (
                <div key={category} className="bg-slate-100 rounded-lg p-3 print:border">
                  <div className="text-sm font-medium text-slate-600">{category}</div>
                  <div className="text-lg font-bold text-slate-900">{formatCurrency(amount)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Expenses Section */}
        <section className="print:break-before-page">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Business Expenses ({purchases.length} receipts)
          </h2>
          
          {purchases.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                No business expenses recorded for {year}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {purchases.map(purchase => (
                <Card key={purchase.id} className="overflow-hidden print:break-inside-avoid">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Receipt Image */}
                      {purchase.receipt_url && (
                        <div className="lg:w-48 flex-shrink-0">
                          <img 
                            src={purchase.receipt_url} 
                            alt="Receipt" 
                            className="w-full h-auto rounded-lg border shadow-sm object-contain max-h-64"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">{purchase.item_name}</h3>
                            <p className="text-slate-600">{purchase.vendor_store}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                              {formatCurrency(purchase.purchase_price)}
                            </div>
                            <Badge variant="outline" className="mt-1">{purchase.category}</Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                          <div>
                            <span className="text-slate-500">Date:</span>{" "}
                            <span className="font-medium">{format(new Date(purchase.purchase_date), 'MMM d, yyyy')}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Payment:</span>{" "}
                            <span className="font-medium">{purchase.payment_method}</span>
                          </div>
                        </div>
                        
                        {purchase.notes_purpose && (
                          <p className="text-sm bg-slate-50 rounded p-2 mt-3">
                            <span className="text-slate-500">Notes:</span> {purchase.notes_purpose}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Vehicle Transactions Section */}
        <section className="print:break-before-page">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Vehicle Transactions ({vehicles.length} vehicles)
          </h2>
          
          {vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                No vehicle transactions for {year}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {vehicles.map(vehicle => {
                const purchasePrice = parseFloat(vehicle.purchase_price || '0') || 0;
                const documents = Array.isArray(vehicle.documents) ? vehicle.documents : [];
                const images = Array.isArray(vehicle.car_images) ? vehicle.car_images : [];

                return (
                  <Card key={vehicle.id} className="overflow-hidden print:break-inside-avoid">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Vehicle Image */}
                        {images.length > 0 && (
                          <div className="lg:w-48 flex-shrink-0">
                            <img 
                              src={images[0]?.url || images[0]} 
                              alt="Vehicle" 
                              className="w-full h-32 rounded-lg border shadow-sm object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </h3>
                              <p className="text-sm text-slate-600 font-mono">
                                VIN: {vehicle.vehicle_id}
                              </p>
                              {vehicle.license_plate && (
                                <p className="text-sm text-slate-500">
                                  Plate: {vehicle.license_plate}
                                </p>
                              )}
                            </div>
                            <Badge className={vehicle.status === 'sold' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                              {vehicle.status}
                            </Badge>
                          </div>
                          
                          <div className="text-sm mt-3">
                            <div className="bg-slate-50 rounded p-2 inline-block">
                              <div className="text-slate-500">Purchased</div>
                              <div className="font-medium">
                                {vehicle.purchase_date ? format(new Date(vehicle.purchase_date), 'MMM d, yyyy') : 'N/A'}
                              </div>
                              <div className="font-bold text-orange-600">{formatCurrency(purchasePrice)}</div>
                            </div>
                          </div>
                          
                          {/* Documents */}
                          {documents.length > 0 && (
                            <div className="mt-3">
                              <div className="text-sm font-medium text-slate-500 mb-1">Documents:</div>
                              <div className="flex flex-wrap gap-2">
                                {documents.map((doc: any, index: number) => (
                                  <a
                                    key={index}
                                    href={doc.url || doc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                                  >
                                    <FileText className="w-3 h-3" />
                                    {doc.name || `Document ${index + 1}`}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-slate-500 pt-8 border-t print:mt-8">
          <p>This report was generated from America's Auto Towing LLC business records.</p>
          <p>For questions, please contact the business owner.</p>
        </footer>
      </main>
    </div>
  );
}
