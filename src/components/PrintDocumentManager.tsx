import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Image, X, Eye, Plus } from "lucide-react";
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

export function PrintDocumentManager() {
  const [documents, setDocuments] = useState<PrintDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

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

  const createNewDocument = () => {
    const newDoc: PrintDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Document ${documents.length + 1}`,
      createdAt: new Date()
    };
    setDocuments([...documents, newDoc]);
  };

  const handlePdfUpload = async (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a PDF smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(`${docId}-pdf`);

    try {
      const url = await uploadFileToStorage(file, 'pdfs');
      
      setDocuments(docs => docs.map(doc => 
        doc.id === docId 
          ? { ...doc, pdfFile: file, pdfUrl: url }
          : doc
      ));

      toast({
        title: "PDF uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('PDF upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  };

  const handleImageUpload = async (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(`${docId}-image`);

    try {
      const url = await uploadFileToStorage(file, 'previews');
      
      setDocuments(docs => docs.map(doc => 
        doc.id === docId 
          ? { ...doc, imageFile: file, imageUrl: url }
          : doc
      ));

      toast({
        title: "Image uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Image upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  };

  const removeDocument = (docId: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== docId));
  };

  const viewFile = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Document Collection</h2>
          <p className="text-muted-foreground">Upload PDFs with preview images</p>
        </div>
        <Button onClick={createNewDocument} className="gap-2">
          <Plus className="w-4 h-4" />
          New Document
        </Button>
      </div>

      <div className="grid gap-6">
        {documents.map((doc) => (
          <Card key={doc.id} className="border border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <input
                    type="text"
                    value={doc.title}
                    onChange={(e) => updateTitle(doc.id, e.target.value)}
                    className="text-lg font-medium bg-transparent border-none outline-none text-foreground focus:bg-muted/20 rounded px-2 py-1 -mx-2"
                    placeholder="Document title..."
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDocument(doc.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* PDF Upload */}
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF Document
                  </h3>
                  
                  {doc.pdfFile ? (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">{doc.pdfFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(doc.pdfFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewFile(doc.pdfUrl)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        id={`pdf-${doc.id}`}
                        accept=".pdf"
                        onChange={(e) => handlePdfUpload(doc.id, e)}
                        disabled={uploading === `${doc.id}-pdf`}
                        className="hidden"
                      />
                      <label htmlFor={`pdf-${doc.id}`} className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-foreground">
                          {uploading === `${doc.id}-pdf` ? 'Uploading PDF...' : 'Upload PDF Document'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF up to 10MB
                        </p>
                      </label>
                    </div>
                  )}
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Preview Image
                  </h3>
                  
                  {doc.imageFile ? (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Image className="w-8 h-8 text-primary" />
                            <div>
                              <p className="font-medium text-foreground">{doc.imageFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(doc.imageFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewFile(doc.imageUrl)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                        {doc.imageUrl && (
                          <div className="rounded-lg overflow-hidden border border-border">
                            <img
                              src={doc.imageUrl}
                              alt="Document preview"
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        id={`image-${doc.id}`}
                        accept="image/*"
                        onChange={(e) => handleImageUpload(doc.id, e)}
                        disabled={uploading === `${doc.id}-image`}
                        className="hidden"
                      />
                      <label htmlFor={`image-${doc.id}`} className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-foreground">
                          {uploading === `${doc.id}-image` ? 'Uploading image...' : 'Upload Preview Image'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG up to 5MB
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {documents.length === 0 && (
          <Card className="border-2 border-dashed border-border">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first document to start organizing your PDFs with preview images
                </p>
                <Button onClick={createNewDocument} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Document
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}