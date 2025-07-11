import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Upload, Scan, Save, X, Plus, DollarSign, Receipt, ChevronDown, ChevronUp, FileText, AlertTriangle } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ExtractedData {
  item_name?: string;
  purchase_price?: number;
  purchase_date?: string;
  vendor_store?: string;
  category?: string;
  notes_purpose?: string;
}

interface ReceiptUpload {
  id: string;
  file: File;
  imageUrl: string;
  extractedData: ExtractedData | null;
  isProcessing: boolean;
  error?: string;
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
  "Fuel",
  "Meals",
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

export const SmartReceiptUpload = () => {
  const [receipts, setReceipts] = useState<ReceiptUpload[]>([]);
  const [editingReceipt, setEditingReceipt] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [savedPurchases, setSavedPurchases] = useState<BusinessPurchase[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    item_name: "",
    purchase_date: undefined as Date | undefined,
    purchase_price: "",
    vendor_store: "",
    category: "",
    payment_method: "Cash",
    notes_purpose: ""
  });
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
        toast({
          title: "Invalid file type",
          description: "Please upload only images or PDF files",
          variant: "destructive"
        });
        continue;
      }

      const id = crypto.randomUUID();
      const imageUrl = URL.createObjectURL(file);
      
      const newReceipt: ReceiptUpload = {
        id,
        file,
        imageUrl,
        extractedData: null,
        isProcessing: true
      };

      setReceipts(prev => [...prev, newReceipt]);
      
      // Process with AI
      try {
        await processReceiptWithAI(id, file);
      } catch (error) {
        console.error('Error processing receipt:', error);
        updateReceiptError(id, 'Failed to process receipt');
      }
    }
  };

  const processReceiptWithAI = async (receiptId: string, file: File) => {
    try {
      // Convert file to base64
      const base64 = await fileToBase64(file);
      
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { image: base64 }
      });

      if (error) throw error;

      if (data.success) {
        updateReceiptData(receiptId, data.extractedData);
      } else {
        updateReceiptError(receiptId, data.error || 'Failed to extract data');
      }
    } catch (error) {
      console.error('AI processing error:', error);
      updateReceiptError(receiptId, 'AI processing failed');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const updateReceiptData = (receiptId: string, extractedData: ExtractedData) => {
    setReceipts(prev => prev.map(receipt => 
      receipt.id === receiptId 
        ? { ...receipt, extractedData, isProcessing: false }
        : receipt
    ));
  };

  const updateReceiptError = (receiptId: string, error: string) => {
    setReceipts(prev => prev.map(receipt => 
      receipt.id === receiptId 
        ? { ...receipt, error, isProcessing: false }
        : receipt
    ));
  };

  // Helper function to safely parse YYYY-MM-DD dates without timezone issues
  const parseYYYYMMDD = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return undefined;
    
    const [, year, month, day] = match;
    // Create date in local timezone without UTC conversion
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  };

  const startEditing = (receipt: ReceiptUpload) => {
    if (!receipt.extractedData) return;
    
    setEditingReceipt(receipt.id);
    setFormData({
      item_name: receipt.extractedData.item_name || "",
      purchase_date: parseYYYYMMDD(receipt.extractedData.purchase_date || ""),
      purchase_price: receipt.extractedData.purchase_price?.toString() || "",
      vendor_store: receipt.extractedData.vendor_store || "",
      category: receipt.extractedData.category || "",
      payment_method: "Cash",
      notes_purpose: receipt.extractedData.notes_purpose || ""
    });
  };

  const saveReceipt = async (receipt: ReceiptUpload) => {
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
      // Upload receipt image
      const fileName = `${Date.now()}-${receipt.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('business-receipts')
        .upload(fileName, receipt.file);

      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('business-receipts')
        .getPublicUrl(fileName);

      // Save to database
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
          receipt_url: publicUrl
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Receipt saved successfully"
      });

      // Remove from list and refresh saved purchases
      setReceipts(prev => prev.filter(r => r.id !== receipt.id));
      setEditingReceipt(null);
      fetchSavedPurchases();
      
    } catch (error) {
      console.error('Error saving receipt:', error);
      toast({
        title: "Error",
        description: "Failed to save receipt",
        variant: "destructive"
      });
    }
  };

  const removeReceipt = (receiptId: string) => {
    setReceipts(prev => prev.filter(r => r.id !== receiptId));
    if (editingReceipt === receiptId) {
      setEditingReceipt(null);
    }
  };

  const fetchSavedPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('business_purchases')
        .select('*')
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setSavedPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  useEffect(() => {
    fetchSavedPurchases();
  }, []);

  const saveManualEntry = async () => {
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
          receipt_url: null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tax receipt entry saved successfully"
      });

      // Reset form
      setFormData({
        item_name: "",
        purchase_date: undefined,
        purchase_price: "",
        vendor_store: "",
        category: "",
        payment_method: "Cash",
        notes_purpose: ""
      });
      setShowManualEntry(false);
      
      // Refresh data
      fetchSavedPurchases();
    } catch (error) {
      console.error('Error saving manual entry:', error);
      toast({
        title: "Error",
        description: "Failed to save tax receipt entry",
        variant: "destructive"
      });
    }
  };

  // Tax-focused financial calculations
  const taxData = useMemo(() => {
    const totalAmount = savedPurchases.reduce((sum, p) => sum + p.purchase_price, 0);
    
    // Group by purchase date for daily breakdown
    const dailyBreakdown = savedPurchases.reduce((acc, purchase) => {
      const purchaseDate = purchase.purchase_date;
      const purchaseAmount = purchase.purchase_price;
      
      if (!acc[purchaseDate]) {
        acc[purchaseDate] = {
          total: 0,
          purchases: []
        };
      }
      
      acc[purchaseDate].total += purchaseAmount;
      acc[purchaseDate].purchases.push(purchase);
      
      return acc;
    }, {} as Record<string, { total: number; purchases: BusinessPurchase[] }>);

    // Sort dates in descending order
    const sortedDates = Object.keys(dailyBreakdown).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    return {
      totalAmount,
      dailyBreakdown,
      sortedDates,
      totalReceipts: savedPurchases.length
    };
  }, [savedPurchases]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'MMMM d, yyyy');
      }
    } catch (error) {
      // Fallback
    }
    return dateString;
  };

  const toggleDateExpansion = (date: string) => {
    const newExpandedDates = new Set(expandedDates);
    if (newExpandedDates.has(date)) {
      newExpandedDates.delete(date);
    } else {
      newExpandedDates.add(date);
    }
    setExpandedDates(newExpandedDates);
  };

  // Filter dates based on selected date
  const filteredDates = selectedDate 
    ? taxData.sortedDates.filter(date => date.includes(selectedDate))
    : taxData.sortedDates;

  return (
    <div className="space-y-6">
      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Total Tax Deductions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(taxData.totalAmount)}
            </div>
            <p className="text-sm text-muted-foreground">Business expenses tracked</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Receipt Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxData.totalReceipts}</div>
            <p className="text-sm text-muted-foreground">Tax receipts saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Large Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {savedPurchases.filter(p => p.purchase_price >= 2500).length}
            </div>
            <p className="text-sm text-muted-foreground">$2,500+ expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload and Manual Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              AI Receipt Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="receipts">Upload Receipt Images or PDFs</Label>
                <Input
                  id="receipts"
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="mt-2"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  AI will scan and extract tax information with high accuracy for IRS compliance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Manual Tax Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!showManualEntry ? (
                <Button 
                  onClick={() => setShowManualEntry(true)}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manual Entry
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manual_item">Item Name *</Label>
                      <Input
                        id="manual_item"
                        value={formData.item_name}
                        onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                        placeholder="Business expense item"
                      />
                    </div>
                    <div>
                      <Label>Date *</Label>
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
                            {formData.purchase_date ? format(formData.purchase_date, "yyyy-MM-dd") : "Pick date"}
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
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manual_price">Amount *</Label>
                      <Input
                        id="manual_price"
                        type="number"
                        step="0.01"
                        value={formData.purchase_price}
                        onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="manual_vendor">Vendor *</Label>
                      <Input
                        id="manual_vendor"
                        value={formData.vendor_store}
                        onChange={(e) => setFormData({...formData, vendor_store: e.target.value})}
                        placeholder="Store/vendor name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tax category" />
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
                          <SelectValue placeholder="Payment method" />
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
                    <Label htmlFor="manual_notes">Business Purpose</Label>
                    <Textarea
                      id="manual_notes"
                      value={formData.notes_purpose}
                      onChange={(e) => setFormData({...formData, notes_purpose: e.target.value})}
                      placeholder="Describe business use for tax purposes"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={saveManualEntry}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Entry
                    </Button>
                    <Button variant="outline" onClick={() => setShowManualEntry(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Processing List */}
      {receipts.length > 0 && (
        <div className="space-y-4">
          {receipts.map((receipt) => (
            <Card key={receipt.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Receipt Image Preview */}
                  <div className="flex-shrink-0">
                    <img
                      src={receipt.imageUrl}
                      alt="Receipt"
                      className="w-32 h-40 object-cover rounded border"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-4">
                    {receipt.isProcessing && (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p>Processing receipt with AI...</p>
                      </div>
                    )}

                    {receipt.error && (
                      <div className="text-center py-8 text-red-600">
                        <p>Error: {receipt.error}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => removeReceipt(receipt.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}

                    {receipt.extractedData && editingReceipt !== receipt.id && (
                      <div className="space-y-2">
                        <h3 className="font-semibold">Extracted Information:</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>Item:</strong> {receipt.extractedData.item_name}</div>
                          <div><strong>Amount:</strong> ${receipt.extractedData.purchase_price}</div>
                          <div><strong>Date:</strong> {receipt.extractedData.purchase_date}</div>
                          <div><strong>Vendor:</strong> {receipt.extractedData.vendor_store}</div>
                          <div><strong>Category:</strong> {receipt.extractedData.category}</div>
                          <div><strong>Notes:</strong> {receipt.extractedData.notes_purpose}</div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => startEditing(receipt)}
                            size="sm"
                          >
                            Edit & Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeReceipt(receipt.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {editingReceipt === receipt.id && (
                      <div className="space-y-4">
                        <h3 className="font-semibold">Edit & Save Purchase</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="item_name">Item Name *</Label>
                            <Input
                              id="item_name"
                              value={formData.item_name}
                              onChange={(e) => setFormData({...formData, item_name: e.target.value})}
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
                            />
                          </div>

                          <div>
                            <Label htmlFor="vendor_store">Vendor/Store *</Label>
                            <Input
                              id="vendor_store"
                              value={formData.vendor_store}
                              onChange={(e) => setFormData({...formData, vendor_store: e.target.value})}
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
                          <Label htmlFor="notes_purpose">Notes/Purpose</Label>
                          <Textarea
                            id="notes_purpose"
                            value={formData.notes_purpose}
                            onChange={(e) => setFormData({...formData, notes_purpose: e.target.value})}
                            placeholder="What is this used for in the business?"
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => saveReceipt(receipt)}
                            className="flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save Purchase
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingReceipt(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => removeReceipt(receipt.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tax Records by Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Tax Records by Date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Input
              type="date"
              placeholder="Filter by date (yyyy-mm-dd)"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
            {selectedDate && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedDate("")}
                size="sm"
              >
                Clear Filter
              </Button>
            )}
          </div>

          {filteredDates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {selectedDate ? "No tax records found for the selected date." : "No tax records saved yet."}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredDates.map((date) => {
                const dayData = taxData.dailyBreakdown[date];
                const isExpanded = expandedDates.has(date);
                
                return (
                  <Collapsible key={date}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto"
                        onClick={() => toggleDateExpansion(date)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">
                            {date}
                          </Badge>
                          <span className="font-medium">
                            {formatDate(date)}
                          </span>
                          <span className="text-muted-foreground">
                            ({dayData.purchases.length} receipt{dayData.purchases.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            {formatCurrency(dayData.total)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <div className="space-y-2 border-l-2 border-muted pl-4 ml-2">
                        {dayData.purchases.map((purchase) => (
                          <div key={purchase.id} className="flex justify-between items-start p-3 bg-muted/30 rounded">
                            <div className="text-sm space-y-1">
                              <div className="font-medium">{purchase.item_name}</div>
                              <div className="text-muted-foreground">
                                {purchase.vendor_store} • {purchase.category}
                              </div>
                              {purchase.notes_purpose && (
                                <div className="text-xs text-muted-foreground">
                                  Purpose: {purchase.notes_purpose}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(purchase.purchase_price)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {purchase.payment_method}
                              </div>
                              {purchase.receipt_url && (
                                <a href={purchase.receipt_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="mt-1">
                                    <Receipt className="w-3 h-3" />
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {receipts.length === 0 && taxData.totalReceipts === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Tracking Tax Receipts</h3>
            <p className="text-muted-foreground">
              Upload receipt images/PDFs for AI scanning or manually enter business expenses. All data is saved for tax reporting.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};