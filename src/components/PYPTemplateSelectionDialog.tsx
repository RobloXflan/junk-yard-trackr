import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Printer, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

interface Template {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  required: boolean;
  uploadedImage?: string;
}

const PYP_TEMPLATES: Template[] = [
  {
    id: "bill-of-sale",
    name: "Bill of Sale",
    description: "Vehicle purchase agreement and transfer document",
    previewImage: "/api/placeholder/300/400",
    required: true
  },
  {
    id: "title-transfer",
    name: "Title Transfer",
    description: "Official vehicle title transfer form",
    previewImage: "/api/placeholder/300/400", 
    required: true
  },
  {
    id: "inventory-receipt",
    name: "Inventory Receipt",
    description: "Parts inventory and condition report",
    previewImage: "/api/placeholder/300/400",
    required: true
  },
  {
    id: "parts-manifest",
    name: "Parts Manifest",
    description: "Detailed parts listing and valuation",
    previewImage: "/api/placeholder/300/400",
    required: false
  },
  {
    id: "inspection-report",
    name: "Inspection Report",
    description: "Vehicle condition and safety inspection",
    previewImage: "/api/placeholder/300/400",
    required: false
  },
  {
    id: "environmental-compliance",
    name: "Environmental Compliance",
    description: "Fluid removal and environmental safety certification",
    previewImage: "/api/placeholder/300/400",
    required: false
  }
];

interface PYPTemplateSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplatesSelected: (templates: Template[]) => void;
  vehicleInfo?: {
    year: string;
    make: string;
    model: string;
    vin: string;
  };
}

export function PYPTemplateSelectionDialog({
  isOpen,
  onClose,
  onTemplatesSelected,
  vehicleInfo
}: PYPTemplateSelectionDialogProps) {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(
    // Pre-select required templates
    PYP_TEMPLATES.filter(t => t.required).map(t => t.id)
  );
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});

  const handleImageUpload = useCallback((templateId: string, files: File[]) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedImages(prev => ({
        ...prev,
        [templateId]: dataUrl
      }));
      toast({
        title: "Template uploaded",
        description: `${file.name} uploaded successfully`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Could not read image file.",
        variant: "destructive"
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = (templateId: string) => {
    setUploadedImages(prev => {
      const newImages = { ...prev };
      if (newImages[templateId]) {
        delete newImages[templateId];
      }
      return newImages;
    });
  };

  const handleTemplateToggle = (templateId: string, required: boolean) => {
    if (required) return; // Can't unselect required templates
    
    setSelectedTemplates(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleProceed = () => {
    const selected = PYP_TEMPLATES.filter(t => selectedTemplates.includes(t.id)).map(template => ({
      ...template,
      uploadedImage: uploadedImages[template.id]
    }));
    
    if (selected.length === 0) {
      toast({
        title: "No templates selected",
        description: "Please select at least one document template.",
        variant: "destructive"
      });
      return;
    }

    onTemplatesSelected(selected);
    onClose();
  };

  // Template upload component
  const TemplateUploadZone = ({ templateId, templateName }: { templateId: string; templateName: string }) => {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      accept: {
        'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
      },
      maxFiles: 1,
      onDrop: (files) => handleImageUpload(templateId, files)
    });

    const hasUpload = uploadedImages[templateId];

    if (hasUpload) {
      return (
        <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
          <img
            src={uploadedImages[templateId]}
            alt={`${templateName} template`}
            className="w-full h-full object-cover"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage(templateId);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div
        {...getRootProps()}
        className={`aspect-[3/4] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-center text-muted-foreground px-2">
          {isDragActive ? 'Drop PNG template here' : 'Click or drag PNG template'}
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Pick Your Part Document Templates
          </DialogTitle>
          {vehicleInfo && (
            <p className="text-sm text-muted-foreground">
              Vehicle: {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model} - VIN: {vehicleInfo.vin}
            </p>
          )}
          <DialogDescription className="sr-only">
            Select the documents you need for this vehicle and upload PNG templates. Required documents are pre-selected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Select the documents you need for this vehicle and upload PNG templates. Required documents are pre-selected.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PYP_TEMPLATES.map((template) => {
              const isSelected = selectedTemplates.includes(template.id);
              
              return (
                <Card 
                  key={template.id}
                  className={`transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-primary border-primary bg-primary/5' 
                      : 'hover:shadow-md border-border'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Upload Zone */}
                      <TemplateUploadZone templateId={template.id} templateName={template.name} />

                      {/* Template Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">{template.name}</h3>
                          <Checkbox
                            checked={isSelected}
                            disabled={template.required}
                            onCheckedChange={() => handleTemplateToggle(template.id, template.required)}
                          />
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {template.description}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          {template.required && (
                            <div className="text-xs text-orange-600 font-medium">
                              Required Document
                            </div>
                          )}
                          {uploadedImages[template.id] && (
                            <div className="text-xs text-green-600 font-medium">
                              Template Uploaded
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{selectedTemplates.length}</span> document(s) selected
              </div>
              <div className="text-xs text-muted-foreground">
                Click templates to select/deselect • Required documents cannot be removed
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleProceed}
            className="flex items-center gap-2"
            disabled={selectedTemplates.length === 0}
          >
            <Printer className="w-4 h-4" />
            Create Documents ({selectedTemplates.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}