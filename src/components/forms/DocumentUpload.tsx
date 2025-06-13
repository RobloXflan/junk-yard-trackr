
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UploadedDocument {
  id: string;
  file: File;
  url: string;
}

interface DocumentUploadProps {
  uploadedDocuments: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
}

export function DocumentUpload({ uploadedDocuments, onDocumentsChange }: DocumentUploadProps) {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} - Please upload a PDF or image file (JPG, PNG).`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} - Please upload a file smaller than 10MB.`,
          variant: "destructive",
        });
        return;
      }

      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const url = URL.createObjectURL(file);
      
      const newDocument: UploadedDocument = {
        id: documentId,
        file: file,
        url: url
      };

      onDocumentsChange([...uploadedDocuments, newDocument]);
      
      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    });

    event.target.value = '';
  };

  const removeDocument = (documentId: string) => {
    const documentToRemove = uploadedDocuments.find(doc => doc.id === documentId);
    if (documentToRemove) {
      URL.revokeObjectURL(documentToRemove.url);
    }
    onDocumentsChange(uploadedDocuments.filter(doc => doc.id !== documentId));
  };

  const viewDocument = (document: UploadedDocument) => {
    window.open(document.url, '_blank');
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="documents" className="text-foreground font-medium">Upload Paperwork (PDF/Image)</Label>
      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
        <input
          type="file"
          id="documents"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          multiple
          className="hidden"
        />
        <label htmlFor="documents" className="cursor-pointer">
          <Upload className="w-8 h-8 mx-auto mb-2 text-foreground" />
          <p className="text-sm text-foreground">
            Click to upload or drag and drop multiple documents
          </p>
          <p className="text-xs text-foreground mt-1">
            PDF, JPG, PNG up to 10MB each
          </p>
        </label>
      </div>

      {uploadedDocuments.length > 0 && (
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Uploaded Documents ({uploadedDocuments.length})</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {uploadedDocuments.map((document) => (
              <div key={document.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{document.file.name}</p>
                  <p className="text-xs text-foreground">{(document.file.size / 1024 / 1024).toFixed(2)} MB</p>
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
