
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Image, Trash2, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PrintDocument {
  id: string;
  title: string;
  pdfFile?: File;
  pdfUrl?: string;
  imageFile?: File;
  imageUrl?: string;
  createdAt: Date;
}

const STORAGE_KEY = 'print-documents';

export function PrintDocumentManager() {
  const [documents, setDocuments] = useState<PrintDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load documents from localStorage on component mount
  useEffect(() => {
    const savedDocuments = localStorage.getItem(STORAGE_KEY);
    if (savedDocuments) {
      try {
        const parsed = JSON.parse(savedDocuments);
        // Convert date strings back to Date objects
        const documentsWithDates = parsed.map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt)
        }));
        setDocuments(documentsWithDates);
      } catch (error) {
        console.error('Error loading saved documents:', error);
      }
    }
  }, []);

  // Save documents to localStorage whenever documents change
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    }
  }, [documents]);

  const uploadFileToStorage = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('pdf-documents')
      .upload(fileName, file);

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('pdf-documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleNewDocument = async () => {
    const pdfFile = pdfInputRef.current?.files?.[0];
    const imageFile = imageInputRef.current?.files?.[0];

    if (!pdfFile || !imageFile) {
      toast({
        title: "Missing files",
        description: "Please select both a PDF and an image file.",
        variant: "destructive",
      });
      return;
    }

    if (pdfFile.type !== 'application/pdf') {
      toast({
        title: "Invalid PDF file",
        description: "Please select a valid PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (!imageFile.type.startsWith('image/')) {
      toast({
        title: "Invalid image file",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const [pdfUrl, imageUrl] = await Promise.all([
        uploadFileToStorage(pdfFile, 'pdfs'),
        uploadFileToStorage(imageFile, 'previews')
      ]);

      const newDoc: PrintDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: pdfFile.name.replace('.pdf', ''),
        pdfFile,
        pdfUrl,
        imageFile,
        imageUrl,
        createdAt: new Date()
      };

      setDocuments(prev => [...prev, newDoc]);
      
      // Clear inputs
      if (pdfInputRef.current) pdfInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';

      toast({
        title: "Document added",
        description: "Your document is ready for printing.",
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (docId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== docId);
    setDocuments(updatedDocuments);
    
    // Update localStorage immediately
    if (updatedDocuments.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocuments));
    }
  };

  const printPdf = (url?: string) => {
    if (url) {
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const updateTitle = (docId: string, newTitle: string) => {
    setDocuments(docs => docs.map(doc => 
      doc.id === docId 
        ? { ...doc, title: newTitle }
        : doc
    ));
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add New Document</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pdf-input" className="block text-sm font-medium mb-2">
                  PDF Document
                </label>
                <input
                  id="pdf-input"
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  disabled={uploading}
                  className="w-full p-2 border border-input rounded-md text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
              </div>
              <div>
                <label htmlFor="image-input" className="block text-sm font-medium mb-2">
                  Preview Image
                </label>
                <input
                  id="image-input"
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="w-full p-2 border border-input rounded-md text-sm file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                />
              </div>
            </div>
            <Button 
              onClick={handleNewDocument} 
              disabled={uploading}
              className="w-full gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Add Document'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {documents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div key={doc.id} className="space-y-3">
              {/* Header Box */}
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Input
                    value={doc.title}
                    onChange={(e) => updateTitle(doc.id, e.target.value)}
                    className="font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(doc.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>PDF Ready</span>
                  </div>
                  
                  <Button
                    onClick={() => printPdf(doc.pdfUrl)}
                    size="sm"
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>

              {/* Image Display */}
              {doc.imageUrl && (
                <div className="border rounded-lg overflow-hidden bg-background">
                  <img 
                    src={doc.imageUrl} 
                    alt={doc.title}
                    className="w-full h-auto object-contain"
                    style={{ minHeight: '200px' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {documents.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
          <p className="text-muted-foreground">
            Upload your first PDF and image to get started
          </p>
        </div>
      )}
    </div>
  );
}
