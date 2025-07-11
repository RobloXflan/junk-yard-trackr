import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Download, DollarSign, Receipt, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BusinessPurchase {
  id: string;
  item_name: string;
  purchase_date: string;
  purchase_price: number;
  vendor_store: string;
  category: string;
  receipt_url?: string;
  payment_method: string;
  notes_purpose?: string;
  created_at: string;
}

const categories = [
  "Equipment",
  "Supplies", 
  "Software",
  "Marketing",
  "Travel",
  "Office Rent",
  "Utilities",
  "Professional Services",
  "Insurance",
  "Other"
];

const paymentMethods = [
  "Business Card",
  "Bank Transfer", 
  "PayPal",
  "Cash",
  "Check",
  "Other"
];

export const BusinessPurchases = () => {
  const [purchases, setPurchases] = useState<BusinessPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [formData, setFormData] = useState({
    item_name: "",
    purchase_date: undefined as Date | undefined,
    purchase_price: "",
    vendor_store: "",
    category: "",
    payment_method: "",
    notes_purpose: ""
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const { toast } = useToast();

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('business_purchases')
        .select('*')
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast({
        title: "Error",
        description: "Failed to load business purchases",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.item_name || !formData.purchase_date || !formData.purchase_price || 
        !formData.vendor_store || !formData.category || !formData.payment_method) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      let receiptUrl = null;

      // Upload receipt if provided
      if (receiptFile) {
        const fileName = `${Date.now()}-${receiptFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('business-receipts')
          .upload(fileName, receiptFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('business-receipts')
          .getPublicUrl(fileName);
        
        receiptUrl = publicUrl;
      }

      const { error } = await supabase
        .from('business_purchases')
        .insert([{
          item_name: formData.item_name,
          purchase_date: format(formData.purchase_date, 'yyyy-MM-dd'),
          purchase_price: parseFloat(formData.purchase_price),
          vendor_store: formData.vendor_store,
          category: formData.category,
          payment_method: formData.payment_method,
          notes_purpose: formData.notes_purpose || null,
          receipt_url: receiptUrl
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Business purchase added successfully"
      });

      // Reset form
      setFormData({
        item_name: "",
        purchase_date: undefined,
        purchase_price: "",
        vendor_store: "",
        category: "",
        payment_method: "",
        notes_purpose: ""
      });
      setReceiptFile(null);
      setShowForm(false);
      
      // Refresh data
      fetchPurchases();
    } catch (error) {
      console.error('Error adding purchase:', error);
      toast({
        title: "Error",
        description: "Failed to add business purchase",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    const filteredPurchases = getFilteredPurchases();
    const csvContent = [
      ['Item Name', 'Purchase Date', 'Price', 'Vendor', 'Category', 'Payment Method', 'Notes'],
      ...filteredPurchases.map(p => [
        p.item_name,
        p.purchase_date,
        p.purchase_price.toString(),
        p.vendor_store,
        p.category,
        p.payment_method,
        p.notes_purpose || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-purchases-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getFilteredPurchases = () => {
    return purchases.filter(purchase => {
      const matchesSearch = searchTerm === "" || 
        purchase.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.vendor_store.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.notes_purpose?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === "" || purchase.category === filterCategory;
      const matchesVendor = filterVendor === "" || purchase.vendor_store === filterVendor;
      
      return matchesSearch && matchesCategory && matchesVendor;
    });
  };

  const totalSpent = getFilteredPurchases().reduce((sum, p) => sum + p.purchase_price, 0);
  const uniqueVendors = [...new Set(purchases.map(p => p.vendor_store))];

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getFilteredPurchases().length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Large Expenses ($2,500+)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getFilteredPurchases().filter(p => p.purchase_price >= 2500).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterVendor} onValueChange={setFilterVendor}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Vendors</SelectItem>
              {uniqueVendors.map(vendor => (
                <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Purchase"}
          </Button>
        </div>
      </div>

      {/* Add Purchase Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Business Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item_name">Item Name *</Label>
                  <Input
                    id="item_name"
                    value={formData.item_name}
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                    placeholder="e.g., MacBook Pro, Office Printer"
                  />
                </div>

                <div>
                  <Label>Purchase Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.purchase_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.purchase_date ? format(formData.purchase_date, "yyyy-MM-dd") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.purchase_date}
                        onSelect={(date) => setFormData({...formData, purchase_date: date})}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="purchase_price">Purchase Price (USD) *</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="vendor_store">Vendor/Store *</Label>
                  <Input
                    id="vendor_store"
                    value={formData.vendor_store}
                    onChange={(e) => setFormData({...formData, vendor_store: e.target.value})}
                    placeholder="e.g., Amazon, Best Buy"
                  />
                </div>

                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Payment Method *</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="receipt">Receipt Upload</Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <Label htmlFor="notes_purpose">Notes/Purpose</Label>
                <Textarea
                  id="notes_purpose"
                  value={formData.notes_purpose}
                  onChange={(e) => setFormData({...formData, notes_purpose: e.target.value})}
                  placeholder="What is this used for in the business?"
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">Add Purchase</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Business Purchases ({getFilteredPurchases().length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredPurchases().map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">{purchase.item_name}</TableCell>
                  <TableCell>{purchase.purchase_date}</TableCell>
                  <TableCell className={purchase.purchase_price >= 2500 ? "font-bold text-orange-600" : ""}>
                    ${purchase.purchase_price.toLocaleString()}
                    {purchase.purchase_price >= 2500 && <span className="ml-1 text-xs">⚠️</span>}
                  </TableCell>
                  <TableCell>{purchase.vendor_store}</TableCell>
                  <TableCell>{purchase.category}</TableCell>
                  <TableCell>{purchase.payment_method}</TableCell>
                  <TableCell>
                    {purchase.receipt_url ? (
                      <a href={purchase.receipt_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Receipt className="w-4 h-4" />
                        </Button>
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{purchase.notes_purpose || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};