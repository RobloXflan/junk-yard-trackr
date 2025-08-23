import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  required: boolean;
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

  const handleTemplateToggle = (templateId: string, required: boolean) => {
    if (required) return; // Can't unselect required templates
    
    setSelectedTemplates(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleProceed = () => {
    const selected = PYP_TEMPLATES.filter(t => selectedTemplates.includes(t.id));
    
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
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Select the documents you need for this vehicle. Required documents are pre-selected.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PYP_TEMPLATES.map((template) => {
              const isSelected = selectedTemplates.includes(template.id);
              
              return (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-primary border-primary bg-primary/5' 
                      : 'hover:shadow-md border-border'
                  }`}
                  onClick={() => handleTemplateToggle(template.id, template.required)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Preview Image */}
                      <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src={template.previewImage}
                          alt={`${template.name} preview`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRvY3VtZW50IFByZXZpZXc8L3RleHQ+PC9zdmc+';
                          }}
                        />
                      </div>

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
                        
                        {template.required && (
                          <div className="text-xs text-orange-600 font-medium">
                            Required Document
                          </div>
                        )}
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