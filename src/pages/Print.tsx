
import { useState } from "react";
import { Printer, Upload, FileText, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentUpload, UploadedDocument } from "@/components/forms/DocumentUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function Print() {
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handlePrint = (document: UploadedDocument) => {
    // Create a new window for printing the document
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      if (document.file.type === 'application/pdf') {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print - ${document.name}</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100vw; height: 100vh; border: none; }
                @media print {
                  body { margin: 0; }
                  iframe { width: 100%; height: 100%; }
                }
              </style>
            </head>
            <body>
              <iframe src="${document.url}" onload="window.print()"></iframe>
            </body>
          </html>
        `);
      } else {
        // For images
        printWindow.document.write(`
          <html>
            <head>
              <title>Print - ${document.name}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh; 
                }
                img { 
                  max-width: 100%; 
                  max-height: 100vh; 
                  object-fit: contain; 
                }
                @media print {
                  body { padding: 0; }
                  img { width: 100%; height: auto; }
                }
              </style>
            </head>
            <body>
              <img src="${document.url}" onload="window.print()" alt="${document.name}" />
            </body>
          </html>
        `);
      }
    }
  };

  const viewDocument = (document: UploadedDocument) => {
    setSelectedDocument(document);
    setPreviewOpen(true);
  };

  const deleteDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Print Documents</h1>
        <p className="text-muted-foreground mt-2">Upload and manage documents for printing</p>
      </div>
      
      {/* Upload Section */}
      <div className="mb-8">
        <DocumentUpload 
          uploadedDocuments={uploadedDocuments}
          onDocumentsChange={setUploadedDocuments}
        />
      </div>

      {/* Documents List */}
      {uploadedDocuments.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Your Documents ({uploadedDocuments.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedDocuments.map((document) => (
              <div key={document.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <FileText className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 truncate">{document.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {(document.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handlePrint(document)}
                        className="flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        Print
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewDocument(document)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDocument(document.id)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedDocuments.length === 0 && (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
          <p className="text-muted-foreground">Upload documents above to start printing them</p>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {selectedDocument && (
              selectedDocument.file.type === 'application/pdf' ? (
                <iframe
                  src={selectedDocument.url}
                  className="w-full h-[600px] border-none"
                  title={selectedDocument.name}
                />
              ) : (
                <img
                  src={selectedDocument.url}
                  alt={selectedDocument.name}
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
