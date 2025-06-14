import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ScannerInterface } from "./ScannerInterface";

interface UploadedDocument {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
}

interface DocumentUploadProps {
  uploadedDocuments: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
}

export function DocumentUpload({ uploadedDocuments, onDocumentsChange }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = fileName;

    console.log('Uploading file to storage:', filePath);

    const { data, error } = await supabase.storage
      .from('vehicle-documents')
      .upload(filePath, file);

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('vehicle-documents')
      .getPublicUrl(filePath);

    console.log('File uploaded successfully, URL:', urlData.publicUrl);
    return urlData.publicUrl;
  };

  const processFile = async (file: File): Promise<UploadedDocument | null> => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `${file.name} - Please upload a PDF or image file (JPG, PNG).`,
        variant: "destructive",
      });
      return null;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `${file.name} - Please upload a file smaller than 10MB.`,
        variant: "destructive",
      });
      return null;
    }

    try {
      const url = await uploadFileToStorage(file);
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newDocument: UploadedDocument = {
        id: documentId,
        file: file,
        url: url,
        name: file.name,
        size: file.size
      };

      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });

      return newDocument;
    } catch (error) {
      console.error('Upload failed for file:', file.name, error);
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(file => processFile(file));
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(doc => doc !== null) as UploadedDocument[];
      
      if (successfulUploads.length > 0) {
        onDocumentsChange([...uploadedDocuments, ...successfulUploads]);
      }
    } catch (error) {
      console.error('Upload process failed:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred during file upload. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleScanComplete = async (scannedFile: File) => {
    setUploading(true);
    const document = await processFile(scannedFile);
    if (document) {
      onDocumentsChange([...uploadedDocuments, document]);
    }
    setUploading(false);
  };

  const removeDocument = async (documentId: string) => {
    const documentToRemove = uploadedDocuments.find(doc => doc.id === documentId);
    if (documentToRemove) {
      // Extract the file path from the URL to delete from storage
      try {
        const url = new URL(documentToRemove.url);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        if (fileName) {
          const { error } = await supabase.storage
            .from('vehicle-documents')
            .remove([fileName]);
          
          if (error) {
            console.error('Error deleting file from storage:', error);
          }
        }
      } catch (error) {
        console.error('Error parsing URL for deletion:', error);
      }
    }
    
    onDocumentsChange(uploadedDocuments.filter(doc => doc.id !== documentId));
  };

  const viewDocument = (document: UploadedDocument) => {
    if (document.file.type === 'application/pdf') {
      window.open(document.url, '_blank');
    } else {
      // For images, create a new window to display them
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${document.name}</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;">
              <img src="${document.url}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="${document.name}" />
            </body>
          </html>
        `);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="documents" className="text-foreground font-medium">Upload Paperwork (PDF/Image)</Label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* File Upload Area */}
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
          <input
            type="file"
            id="documents"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            multiple
            disabled={uploading}
            className="hidden"
          />
          <label htmlFor="documents" className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
            <Upload className="w-8 h-8 mx-auto mb-2 text-foreground" />
            <p className="text-sm text-foreground">
              {uploading ? 'Uploading files...' : 'Click to upload documents'}
            </p>
            <p className="text-xs text-foreground mt-1">
              PDF, JPG, PNG up to 10MB each
            </p>
          </label>
        </div>

        {/* Scanner Interface */}
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
          <div className="flex flex-col items-center justify-center h-full">
            <ScannerInterface onScanComplete={handleScanComplete} />
            <p className="text-xs text-foreground mt-2">
              Scan documents directly from your Epson ES-580W scanner
            </p>
          </div>
        </div>
      </div>

      {uploadedDocuments.length > 0 && (
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Uploaded Documents ({uploadedDocuments.length})</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {uploadedDocuments.map((document) => (
              <div key={document.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{document.name}</p>
                  <p className="text-xs text-foreground">{(document.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => viewDocument(document)}
                    className="text-primary hover:text-primary"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDocument(document.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { UploadedDocument };
