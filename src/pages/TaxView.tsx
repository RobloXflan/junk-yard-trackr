import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Car, Receipt, Printer, Building2, ChevronRight, Calendar, Hash } from "lucide-react";
import { format, getMonth } from "date-fns";

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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper function to parse date strings without timezone shift
// Dates like "2025-05-02" should display as May 2, not May 1
const parseLocalDate = (dateStr: string): Date => {
  // Append T00:00:00 to interpret as local time, not UTC
  return new Date(dateStr + 'T00:00:00');
};

export function TaxView() {
  const [purchases, setPurchases] = useState<BusinessPurchase[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const year = urlParams.get('year') || new Date().getFullYear().toString();
  const token = urlParams.get('token');

  useEffect(() => {
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

      const { data: purchaseData, error: purchaseError } = await supabase
        .from('business_purchases')
        .select('*')
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate)
        .order('purchase_date', { ascending: true });

      if (purchaseError) throw purchaseError;
      setPurchases(purchaseData || []);

      // Fetch all vehicles for the year with pagination to avoid 1000 row limit
      let allVehicles: any[] = [];
      let from = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .gte('purchase_date', startDate)
          .lte('purchase_date', endDate)
          .order('purchase_date', { ascending: true })
          .range(from, from + pageSize - 1);

        if (vehicleError) throw vehicleError;
        
        const batch = vehicleData || [];
        allVehicles = allVehicles.concat(batch);
        
        if (batch.length < pageSize) break;
        from += pageSize;
      }
      
      setVehicles(allVehicles);
    } catch (error) {
      console.error('Error loading tax data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group expenses by month
  const expensesByMonth = useMemo(() => {
    const grouped: Record<number, { items: BusinessPurchase[]; total: number }> = {};
    
    purchases.forEach(p => {
      const month = getMonth(parseLocalDate(p.purchase_date));
      if (!grouped[month]) {
        grouped[month] = { items: [], total: 0 };
      }
      grouped[month].items.push(p);
      grouped[month].total += p.purchase_price;
    });

    return grouped;
  }, [purchases]);

  // Group vehicles by month
  const vehiclesByMonth = useMemo(() => {
    const grouped: Record<number, { items: Vehicle[]; total: number }> = {};
    
    vehicles.forEach(v => {
      if (!v.purchase_date) return;
      const month = getMonth(parseLocalDate(v.purchase_date));
      const price = parseFloat(v.purchase_price || '0') || 0;
      
      if (!grouped[month]) {
        grouped[month] = { items: [], total: 0 };
      }
      grouped[month].items.push(v);
      grouped[month].total += price;
    });

    return grouped;
  }, [vehicles]);

  // Category breakdown
  const expensesByCategory = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let total = 0;

    purchases.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + p.purchase_price;
      total += p.purchase_price;
    });

    return { byCategory, total };
  }, [purchases]);

  const vehicleTotal = useMemo(() => {
    return vehicles.reduce((sum, v) => sum + (parseFloat(v.purchase_price || '0') || 0), 0);
  }, [vehicles]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const expenseMonths = Object.keys(expensesByMonth).map(Number).sort((a, b) => a - b);
  const vehicleMonths = Object.keys(vehiclesByMonth).map(Number).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Header */}
      <header className="bg-blue-600 text-white py-6 px-4 print:bg-white print:text-black print:border-b-2 print:pb-4 sticky top-0 z-10">
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
        
        {/* Quick Navigation - Table of Contents */}
        <Card className="print:hidden bg-white border-2 border-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <Hash className="w-5 h-5" />
              Quick Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expenses Navigation */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Business Expenses
              </h3>
              <div className="space-y-1">
                {expenseMonths.map(month => (
                  <button
                    key={`nav-exp-${month}`}
                    onClick={() => scrollToSection(`expenses-${month}`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      {MONTH_NAMES[month]}
                    </span>
                    <span className="flex items-center gap-2 text-slate-600">
                      <span>{expensesByMonth[month].items.length} receipts</span>
                      <span className="font-semibold text-blue-700">{formatCurrency(expensesByMonth[month].total)}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicles Navigation */}
            <div>
              <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Vehicle Purchases
              </h3>
              <div className="space-y-1">
                {vehicleMonths.map(month => (
                  <button
                    key={`nav-veh-${month}`}
                    onClick={() => scrollToSection(`vehicles-${month}`)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-orange-600" />
                      {MONTH_NAMES[month]}
                    </span>
                    <span className="flex items-center gap-2 text-slate-600">
                      <span>{vehiclesByMonth[month].items.length} vehicles</span>
                      <span className="font-semibold text-orange-700">{formatCurrency(vehiclesByMonth[month].total)}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Annual Summary */}
        <section id="summary" className="print:break-after-page">
          <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b-2 border-blue-600 pb-2">
            {year} Annual Summary
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Total Business Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{formatCurrency(expensesByCategory.total)}</div>
                <p className="text-sm text-blue-700">{purchases.length} receipts across {expenseMonths.length} months</p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Total Vehicle Purchases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">{formatCurrency(vehicleTotal)}</div>
                <p className="text-sm text-orange-700">{vehicles.length} vehicles across {vehicleMonths.length} months</p>
              </CardContent>
            </Card>
          </div>

          {/* Expense Categories */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <FileText className="w-5 h-5" />
                Expense Breakdown by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(expensesByCategory.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => (
                    <div key={category} className="bg-slate-100 rounded-lg p-3 print:border">
                      <div className="text-sm font-medium text-slate-600">{category}</div>
                      <div className="text-lg font-bold text-slate-900">{formatCurrency(amount)}</div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Overview Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-5 h-5" />
                Monthly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2 px-3 font-semibold text-slate-700">Month</th>
                      <th className="text-right py-2 px-3 font-semibold text-blue-700">Expenses</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-500"># Receipts</th>
                      <th className="text-right py-2 px-3 font-semibold text-orange-700">Vehicle Purchases</th>
                      <th className="text-right py-2 px-3 font-semibold text-slate-500"># Vehicles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONTH_NAMES.map((monthName, index) => {
                      const expData = expensesByMonth[index];
                      const vehData = vehiclesByMonth[index];
                      if (!expData && !vehData) return null;
                      
                      return (
                        <tr key={monthName} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium">{monthName}</td>
                          <td className="py-2 px-3 text-right text-blue-700 font-semibold">
                            {expData ? formatCurrency(expData.total) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {expData ? expData.items.length : '-'}
                          </td>
                          <td className="py-2 px-3 text-right text-orange-700 font-semibold">
                            {vehData ? formatCurrency(vehData.total) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {vehData ? vehData.items.length : '-'}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
                      <td className="py-2 px-3">TOTAL</td>
                      <td className="py-2 px-3 text-right text-blue-800">{formatCurrency(expensesByCategory.total)}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{purchases.length}</td>
                      <td className="py-2 px-3 text-right text-orange-800">{formatCurrency(vehicleTotal)}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{vehicles.length}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Business Expenses by Month */}
        <section className="print:break-before-page">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b-2 border-blue-600 pb-2 flex items-center gap-2">
            <Receipt className="w-6 h-6" />
            Business Expenses - Detailed by Month
          </h2>

          {expenseMonths.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                No business expenses recorded for {year}
              </CardContent>
            </Card>
          ) : (
            expenseMonths.map(month => (
              <div key={`expenses-${month}`} id={`expenses-${month}`} className="mb-8 print:break-before-page">
                {/* Month Header */}
                <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {MONTH_NAMES[month]} {year}
                  </h3>
                  <div className="text-right">
                    <div className="text-xl font-bold">{formatCurrency(expensesByMonth[month].total)}</div>
                    <div className="text-sm text-blue-100">{expensesByMonth[month].items.length} receipts</div>
                  </div>
                </div>

                {/* Receipts Grid */}
                <div className="border-2 border-t-0 border-blue-200 rounded-b-lg divide-y divide-slate-100">
                  {expensesByMonth[month].items.map((purchase, idx) => (
                    <div key={purchase.id} className="p-4 print:break-inside-avoid bg-white">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Receipt Image - Clickable to open full size */}
                        {purchase.receipt_url && (
                          <a 
                            href={purchase.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="lg:w-40 flex-shrink-0 block cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <img 
                              src={purchase.receipt_url} 
                              alt="Receipt - Click to view full size" 
                              className="w-full h-auto rounded border shadow-sm object-contain max-h-48 hover:shadow-lg transition-shadow"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </a>
                        )}
                        
                        {/* Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="text-xs text-slate-400 mb-1">#{idx + 1}</div>
                              <h4 className="text-lg font-semibold text-slate-800">{purchase.item_name}</h4>
                              <p className="text-slate-600">{purchase.vendor_store}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-700">
                                {formatCurrency(purchase.purchase_price)}
                              </div>
                              <Badge variant="outline" className="mt-1 text-xs">{purchase.category}</Badge>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm mt-2 text-slate-600">
                            <div>
                              <span className="text-slate-400">Date:</span>{" "}
                              <span className="font-medium">{format(parseLocalDate(purchase.purchase_date), 'MMM d, yyyy')}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Payment:</span>{" "}
                              <span className="font-medium">{purchase.payment_method}</span>
                            </div>
                          </div>
                          
                          {purchase.notes_purpose && (
                            <p className="text-sm bg-slate-50 rounded px-3 py-2 mt-2 text-slate-600">
                              <span className="text-slate-400">Purpose:</span> {purchase.notes_purpose}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Vehicle Purchases by Month */}
        <section className="print:break-before-page">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b-2 border-orange-500 pb-2 flex items-center gap-2">
            <Car className="w-6 h-6" />
            Vehicle Purchases - Detailed by Month
          </h2>

          {vehicleMonths.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                No vehicle purchases recorded for {year}
              </CardContent>
            </Card>
          ) : (
            vehicleMonths.map(month => (
              <div key={`vehicles-${month}`} id={`vehicles-${month}`} className="mb-8 print:break-before-page">
                {/* Month Header */}
                <div className="bg-orange-500 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {MONTH_NAMES[month]} {year}
                  </h3>
                  <div className="text-right">
                    <div className="text-xl font-bold">{formatCurrency(vehiclesByMonth[month].total)}</div>
                    <div className="text-sm text-orange-100">{vehiclesByMonth[month].items.length} vehicles</div>
                  </div>
                </div>

                {/* Vehicles Grid */}
                <div className="border-2 border-t-0 border-orange-200 rounded-b-lg divide-y divide-slate-100">
                  {vehiclesByMonth[month].items.map((vehicle, idx) => {
                    const purchasePrice = parseFloat(vehicle.purchase_price || '0') || 0;
                    const documents = Array.isArray(vehicle.documents) ? vehicle.documents : [];
                    const images = Array.isArray(vehicle.car_images) ? vehicle.car_images : [];

                    return (
                      <div key={vehicle.id} className="p-4 print:break-inside-avoid bg-white">
                        <div className="flex flex-col lg:flex-row gap-4">
                          {/* Vehicle Image */}
                          {images.length > 0 && (
                            <div className="lg:w-40 flex-shrink-0">
                              <img 
                                src={images[0]?.url || images[0]} 
                                alt="Vehicle" 
                                className="w-full h-28 rounded border shadow-sm object-cover"
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
                                <div className="text-xs text-slate-400 mb-1">#{idx + 1}</div>
                                <h4 className="text-lg font-semibold text-slate-800">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </h4>
                                <p className="text-sm text-slate-600 font-mono">
                                  VIN: {vehicle.vehicle_id}
                                </p>
                                {vehicle.license_plate && (
                                  <p className="text-sm text-slate-500">
                                    Plate: {vehicle.license_plate}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-bold text-orange-700">
                                  {formatCurrency(purchasePrice)}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {vehicle.purchase_date ? format(parseLocalDate(vehicle.purchase_date), 'MMM d, yyyy') : 'N/A'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Documents */}
                            {documents.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-slate-400 mb-1">Documents:</div>
                                <div className="flex flex-wrap gap-2">
                                  {documents.map((doc: any, index: number) => (
                                    <a
                                      key={index}
                                      href={doc.url || doc}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {doc.name || `Doc ${index + 1}`}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-slate-500 pt-8 border-t-2 border-slate-200 print:mt-8">
          <div className="bg-slate-100 rounded-lg p-4 print:bg-white print:border">
            <p className="font-semibold text-slate-700">America's Auto Towing LLC</p>
            <p className="mt-1">Tax Year {year} Business Records</p>
            <p className="text-xs mt-2 text-slate-400">
              This report was automatically generated on {format(new Date(), 'MMMM d, yyyy')}. 
              For questions, please contact the business owner.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
