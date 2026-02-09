import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { FileText, Car, Receipt, Share2, Printer, Calendar } from "lucide-react";
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
  created_at: string;
}

export function TaxReports() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [purchases, setPurchases] = useState<BusinessPurchase[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      // Load business purchases
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('business_purchases')
        .select('*')
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate)
        .order('purchase_date', { ascending: false });

      if (purchaseError) throw purchaseError;
      setPurchases(purchaseData || []);

      // Load vehicles (purchased or sold in selected year)
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (vehicleError) throw vehicleError;

      // Filter vehicles by purchase year only
      const filteredVehicles = (vehicleData || []).filter((v: Vehicle) => {
        const purchaseYear = v.purchase_date ? new Date(v.purchase_date).getFullYear().toString() : null;
        return purchaseYear === selectedYear;
      });

      setVehicles(filteredVehicles);
    } catch (error) {
      console.error('Error loading tax data:', error);
      toast({
        title: "Error",
        description: "Failed to load tax report data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateShareLink = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setShareToken(token);
    const url = `${window.location.origin}/tax-view?year=${selectedYear}&token=${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Share Link Copied!",
      description: "The tax report link has been copied to your clipboard. Share it with your tax preparer."
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate summaries
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
      if (v.purchase_date && new Date(v.purchase_date).getFullYear().toString() === selectedYear) {
        totalPurchases += purchasePrice;
      }
    });

    return { totalPurchases };
  }, [vehicles, selectedYear]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Reports</h1>
          <p className="text-muted-foreground">
            Generate tax-ready reports with all receipts and vehicle documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={generateShareLink}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">America's Auto Towing LLC</h1>
        <h2 className="text-xl">Tax Report - {selectedYear}</h2>
        <p className="text-sm text-muted-foreground">Generated on {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
        <Card className="bg-blue-50 border-blue-200">
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

        <Card className="bg-orange-50 border-orange-200">
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
      <Card className="print:break-before-page">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Expense Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(expenseSummary.byCategory).map(([category, amount]) => (
              <div key={category} className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium text-muted-foreground">{category}</div>
                <div className="text-lg font-bold">{formatCurrency(amount)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Expenses and Vehicles */}
      <Tabs defaultValue="expenses" className="print:hidden">
        <TabsList>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Business Expenses ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            Vehicle Transactions ({vehicles.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4 mt-4">
          {purchases.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No business expenses recorded for {selectedYear}
              </CardContent>
            </Card>
          ) : (
            purchases.map(purchase => (
              <Card key={purchase.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Receipt Image */}
                    {purchase.receipt_url && (
                      <div className="lg:w-64 flex-shrink-0">
                        <img 
                          src={purchase.receipt_url} 
                          alt="Receipt" 
                          className="w-full h-auto rounded-lg border shadow-sm object-contain max-h-80"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{purchase.item_name}</h3>
                          <p className="text-muted-foreground">{purchase.vendor_store}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(purchase.purchase_price)}
                          </div>
                          <Badge variant="outline">{purchase.category}</Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          <span className="font-medium">{format(new Date(purchase.purchase_date), 'MMM d, yyyy')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payment:</span>{" "}
                          <span className="font-medium">{purchase.payment_method}</span>
                        </div>
                      </div>
                      
                      {purchase.notes_purpose && (
                        <p className="text-sm bg-muted/50 rounded p-2">
                          <span className="text-muted-foreground">Notes:</span> {purchase.notes_purpose}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4 mt-4">
          {vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No vehicle transactions for {selectedYear}
              </CardContent>
            </Card>
          ) : (
            vehicles.map(vehicle => {
              const purchasePrice = parseFloat(vehicle.purchase_price || '0') || 0;
              const documents = Array.isArray(vehicle.documents) ? vehicle.documents : [];
              const images = Array.isArray(vehicle.car_images) ? vehicle.car_images : [];

              return (
                <Card key={vehicle.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Vehicle Images */}
                      {images.length > 0 && (
                        <div className="lg:w-64 flex-shrink-0">
                          <img 
                            src={images[0]?.url || images[0]} 
                            alt="Vehicle" 
                            className="w-full h-40 rounded-lg border shadow-sm object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              VIN: {vehicle.vehicle_id}
                            </p>
                            {vehicle.license_plate && (
                              <p className="text-sm text-muted-foreground">
                                Plate: {vehicle.license_plate}
                              </p>
                            )}
                          </div>
                          <Badge className={vehicle.status === 'sold' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {vehicle.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm">
                          <div className="bg-muted/50 rounded p-2 inline-block">
                            <div className="text-muted-foreground">Purchased</div>
                            <div className="font-medium">
                              {vehicle.purchase_date ? format(new Date(vehicle.purchase_date), 'MMM d, yyyy') : 'N/A'}
                            </div>
                            <div className="font-bold text-orange-600">{formatCurrency(purchasePrice)}</div>
                          </div>
                        </div>
                        
                        {/* Documents */}
                        {documents.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Documents:</div>
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
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Print View - Shows both expenses and vehicles */}
      <div className="hidden print:block space-y-6">
        <div className="print:break-before-page">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Business Expenses ({purchases.length} receipts)
          </h2>
          {purchases.map(purchase => (
            <div key={purchase.id} className="border rounded-lg p-4 mb-4 print:break-inside-avoid">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold">{purchase.item_name}</div>
                  <div className="text-sm">{purchase.vendor_store}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{formatCurrency(purchase.purchase_price)}</div>
                  <div className="text-sm">{purchase.category}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Date: {format(new Date(purchase.purchase_date), 'MMM d, yyyy')} | Payment: {purchase.payment_method}
              </div>
              {purchase.notes_purpose && (
                <div className="text-sm mt-1">Notes: {purchase.notes_purpose}</div>
              )}
              {purchase.receipt_url && (
                <img 
                  src={purchase.receipt_url} 
                  alt="Receipt" 
                  className="mt-2 max-h-48 object-contain"
                />
              )}
            </div>
          ))}
        </div>

        <div className="print:break-before-page">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Car className="w-5 h-5" />
            Vehicle Transactions ({vehicles.length} vehicles)
          </h2>
          {vehicles.map(vehicle => {
            const purchasePrice = parseFloat(vehicle.purchase_price || '0') || 0;
            const salePrice = parseFloat(vehicle.sale_price || '0') || 0;
            const profit = vehicle.sale_date ? salePrice - purchasePrice : 0;

            return (
              <div key={vehicle.id} className="border rounded-lg p-4 mb-4 print:break-inside-avoid">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                    <div className="text-sm font-mono">VIN: {vehicle.vehicle_id}</div>
                  </div>
                  <div className="text-sm">{vehicle.status}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Purchased</div>
                    <div>{vehicle.purchase_date || 'N/A'}</div>
                    <div className="font-bold">{formatCurrency(purchasePrice)}</div>
                  </div>
                  {vehicle.sale_date && (
                    <>
                      <div>
                        <div className="text-muted-foreground">Sold</div>
                        <div>{vehicle.sale_date}</div>
                        <div className="font-bold">{formatCurrency(salePrice)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Profit/Loss</div>
                        <div className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
