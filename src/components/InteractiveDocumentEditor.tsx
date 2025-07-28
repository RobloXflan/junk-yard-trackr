import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Move, Type, Save, Printer } from 'lucide-react';
import { toast } from 'sonner';
import dmvFormImage from '@/assets/dmv-bill-of-sale.png';

interface TextField {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  label: string;
  fontSize: number;
}

interface DocumentTemplate {
  id: string;
  name: string;
  imageUrl: string;
  fields: TextField[];
  createdAt: Date;
  updatedAt: Date;
}

export function InteractiveDocumentEditor() {
  const [fields, setFields] = useState<TextField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [templateName, setTemplateName] = useState('DMV Bill of Sale');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 816, height: 1056 });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const saved = localStorage.getItem('interactive-document-templates');
    if (saved) {
      const parsedTemplates = JSON.parse(saved);
      const templatesWithDates = parsedTemplates.map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      }));
      setTemplates(templatesWithDates);
    }
  };

  const saveTemplate = () => {
    const template: DocumentTemplate = {
      id: Date.now().toString(),
      name: templateName,
      imageUrl: dmvFormImage,
      fields,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedTemplates = [...templates, template];
    setTemplates(updatedTemplates);
    localStorage.setItem('interactive-document-templates', JSON.stringify(updatedTemplates));
    toast.success('Template saved successfully!');
  };

  const addTextField = () => {
    const newField: TextField = {
      id: Date.now().toString(),
      x: 100,
      y: 100,
      width: 200,
      height: 30,
      content: 'Enter text here',
      label: `Field ${fields.length + 1}`,
      fontSize: 14
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const deleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const updateField = (fieldId: string, updates: Partial<TextField>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string, action: 'drag' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedField(fieldId);
    
    if (action === 'drag') {
      setIsDragging(true);
    } else {
      setIsResizing(true);
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedField || (!isDragging && !isResizing)) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;

    const selectedFieldData = fields.find(f => f.id === selectedField);
    if (!selectedFieldData) return;

    if (isDragging) {
      updateField(selectedField, {
        x: Math.max(0, Math.min(canvasSize.width - selectedFieldData.width, selectedFieldData.x + deltaX)),
        y: Math.max(0, Math.min(canvasSize.height - selectedFieldData.height, selectedFieldData.y + deltaY))
      });
    } else if (isResizing) {
      updateField(selectedField, {
        width: Math.max(50, selectedFieldData.width + deltaX),
        height: Math.max(20, selectedFieldData.height + deltaY)
      });
    }

    setDragStart({ x: currentX, y: currentY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <html>
        <head>
          <title>Print Document</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .document-container { position: relative; width: 816px; height: 1056px; margin: 0 auto; }
            .document-bg { width: 100%; height: 100%; object-fit: contain; }
            .text-field { position: absolute; background: transparent; border: none; font-family: Arial, sans-serif; }
            @media print { 
              body { margin: 0; padding: 0; }
              .document-container { width: 100%; height: 100vh; }
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            <img src="${dmvFormImage}" alt="Document" class="document-bg" />
            ${fields.map(field => `
              <div class="text-field" style="
                left: ${field.x}px;
                top: ${field.y}px;
                width: ${field.width}px;
                height: ${field.height}px;
                font-size: ${field.fontSize}px;
                line-height: ${field.height}px;
              ">${field.content}</div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interactive Document Editor</h1>
          <p className="text-muted-foreground">
            Add and position text fields on your document template
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addTextField} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Text Field
          </Button>
          <Button onClick={saveTemplate} variant="outline" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Template
          </Button>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Document Canvas */}
        <div className="col-span-3">
          <Card className="p-4">
            <div
              ref={canvasRef}
              className="relative bg-white border rounded-lg overflow-hidden"
              style={{ width: canvasSize.width, height: canvasSize.height }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={dmvFormImage}
                alt="Document Template"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
              
              {fields.map((field) => (
                <div
                  key={field.id}
                  className={`absolute border-2 bg-white/80 cursor-move ${
                    selectedField === field.id 
                      ? 'border-primary shadow-lg' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    left: field.x,
                    top: field.y,
                    width: field.width,
                    height: field.height,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, field.id, 'drag')}
                >
                  <Textarea
                    value={field.content}
                    onChange={(e) => updateField(field.id, { content: e.target.value })}
                    className="w-full h-full border-none bg-transparent resize-none p-1 text-sm"
                    style={{ fontSize: field.fontSize }}
                    onMouseDown={(e) => e.stopPropagation()}
                  />
                  
                  {selectedField === field.id && (
                    <>
                      <div
                        className="absolute -top-2 -right-2 w-4 h-4 bg-primary border-2 border-white rounded-full cursor-se-resize"
                        onMouseDown={(e) => handleMouseDown(e, field.id, 'resize')}
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute -top-8 -right-2 h-6 w-6 p-0"
                        onClick={() => deleteField(field.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Template Properties</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>

              {selectedField && (
                <>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Selected Field</h4>
                    {(() => {
                      const field = fields.find(f => f.id === selectedField);
                      if (!field) return null;
                      
                      return (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Label</label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Font Size</label>
                            <Input
                              type="number"
                              value={field.fontSize}
                              onChange={(e) => updateField(field.id, { fontSize: parseInt(e.target.value) || 14 })}
                              min="8"
                              max="72"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-sm font-medium">Width</label>
                              <Input
                                type="number"
                                value={field.width}
                                onChange={(e) => updateField(field.id, { width: parseInt(e.target.value) || 100 })}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Height</label>
                              <Input
                                type="number"
                                value={field.height}
                                onChange={(e) => updateField(field.id, { height: parseInt(e.target.value) || 30 })}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </Card>

          {templates.length > 0 && (
            <Card className="p-4 mt-4">
              <h3 className="font-semibold mb-4">Saved Templates</h3>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex justify-between items-center p-2 border rounded hover:bg-muted cursor-pointer"
                    onClick={() => {
                      setFields(template.fields);
                      setTemplateName(template.name);
                      toast.success(`Loaded template: ${template.name}`);
                    }}
                  >
                    <span className="text-sm">{template.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {template.fields.length} fields
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}