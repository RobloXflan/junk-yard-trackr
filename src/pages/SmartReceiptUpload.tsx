import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Scan, Save, X, Eye } from "lucide-react";
import { format } from "date-fns";
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

export const SmartReceiptUpload = () => {
  const [receipts, setReceipts] = useState<ReceiptUpload[]>([]);
  const [editingReceipt, setEditingReceipt] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    item_name: "",
    purchase_date: undefined as Date | undefined,
    purchase_price: "",
    vendor_store: "",
    category: "",
    payment_method: "Business Card",
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

  const startEditing = (receipt: ReceiptUpload) => {
    if (!receipt.extractedData) return;
    
    setEditingReceipt(receipt.id);
    setFormData({
      item_name: receipt.extractedData.item_name || "",
      purchase_date: receipt.extractedData.purchase_date ? new Date(receipt.extractedData.purchase_date) : undefined,
      purchase_price: receipt.extractedData.purchase_price?.toString() || "",
      vendor_store: receipt.extractedData.vendor_store || "",
      category: receipt.extractedData.category || "",
      payment_method: "Business Card",
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

      // Remove from list
      setReceipts(prev => prev.filter(r => r.id !== receipt.id));
      setEditingReceipt(null);
      
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Smart Receipt Upload
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
                Upload one or multiple receipt images/PDFs. AI will automatically extract the purchase information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {receipts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No receipts uploaded</h3>
            <p className="text-muted-foreground">
              Upload receipt images or PDFs above to get started. AI will automatically extract purchase information for you to review and save.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};