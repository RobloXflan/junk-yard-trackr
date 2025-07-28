import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Move, Type, Save, Printer, Upload, Image, Car, Calendar, Hash, User, Phone, MapPin, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
  fieldType: string;
}

interface PredefinedField {
  id: string;
  label: string;
  defaultWidth: number;
  defaultHeight: number;
  placeholder: string;
  icon: React.ComponentType<any>;
  color: string;
}

interface DocumentTemplate {
  id: string;
  name: string;
  imageUrl: string;
  fields: TextField[];
  createdAt: Date;
  updatedAt: Date;
}

interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
}

export function InteractiveDocumentEditor() {
  const [fields, setFields] = useState<TextField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [templateName, setTemplateName] = useState('DMV Bill of Sale');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState(dmvFormImage);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 816, height: 1056 });

  // Predefined field types with smart defaults
  const predefinedFields: PredefinedField[] = [
    { id: 'vin', label: 'VIN', defaultWidth: 300, defaultHeight: 30, placeholder: 'Enter vehicle identification number', icon: Hash, color: 'text-blue-600' },
    { id: 'license_plate', label: 'License Plate', defaultWidth: 150, defaultHeight: 30, placeholder: 'Enter license plate', icon: Car, color: 'text-green-600' },
    { id: 'year', label: 'Year', defaultWidth: 80, defaultHeight: 30, placeholder: 'YYYY', icon: Calendar, color: 'text-purple-600' },
    { id: 'make', label: 'Make', defaultWidth: 120, defaultHeight: 30, placeholder: 'Vehicle make', icon: Car, color: 'text-orange-600' },
    { id: 'model', label: 'Model', defaultWidth: 150, defaultHeight: 30, placeholder: 'Vehicle model', icon: Car, color: 'text-red-600' },
    { id: 'mileage', label: 'Mileage', defaultWidth: 100, defaultHeight: 30, placeholder: 'Miles', icon: Hash, color: 'text-cyan-600' },
    { id: 'price', label: 'Price', defaultWidth: 120, defaultHeight: 30, placeholder: '$0.00', icon: DollarSign, color: 'text-emerald-600' },
    { id: 'date', label: 'Date', defaultWidth: 120, defaultHeight: 30, placeholder: 'MM/DD/YYYY', icon: Calendar, color: 'text-indigo-600' },
    { id: 'buyer_name', label: 'Buyer Name', defaultWidth: 200, defaultHeight: 30, placeholder: 'Buyer full name', icon: User, color: 'text-pink-600' },
    { id: 'seller_name', label: 'Seller Name', defaultWidth: 200, defaultHeight: 30, placeholder: 'Seller full name', icon: User, color: 'text-teal-600' },
    { id: 'address', label: 'Address', defaultWidth: 250, defaultHeight: 60, placeholder: 'Street address, City, State ZIP', icon: MapPin, color: 'text-yellow-600' },
    { id: 'phone', label: 'Phone Number', defaultWidth: 150, defaultHeight: 30, placeholder: '(555) 123-4567', icon: Phone, color: 'text-violet-600' },
    { id: 'signature', label: 'Signature', defaultWidth: 200, defaultHeight: 50, placeholder: 'Signature line', icon: FileText, color: 'text-rose-600' }
  ];

  useEffect(() => {
    loadTemplates();
    loadUploadedDocuments();
    loadDefaultDMVTemplate();
  }, []);

  const loadDefaultDMVTemplate = () => {
    // Load DMV Bill of Sale as default template with predefined fields
    const defaultFields: TextField[] = [
      // Vehicle Information Section
      { id: 'vin', x: 150, y: 180, width: 300, height: 25, content: '', label: 'VIN', fontSize: 12, fieldType: 'vin' },
      { id: 'year', x: 80, y: 220, width: 80, height: 25, content: '', label: 'Year', fontSize: 12, fieldType: 'year' },
      { id: 'make', x: 180, y: 220, width: 120, height: 25, content: '', label: 'Make', fontSize: 12, fieldType: 'make' },
      { id: 'model', x: 320, y: 220, width: 150, height: 25, content: '', label: 'Model', fontSize: 12, fieldType: 'model' },
      { id: 'license_plate', x: 150, y: 260, width: 150, height: 25, content: '', label: 'License Plate', fontSize: 12, fieldType: 'license_plate' },
      { id: 'mileage', x: 350, y: 260, width: 100, height: 25, content: '', label: 'Mileage', fontSize: 12, fieldType: 'mileage' },
      
      // Seller Information
      { id: 'seller_name', x: 150, y: 340, width: 200, height: 25, content: '', label: 'Seller Name', fontSize: 12, fieldType: 'seller_name' },
      { id: 'seller_address', x: 150, y: 380, width: 250, height: 40, content: '', label: 'Seller Address', fontSize: 12, fieldType: 'address' },
      { id: 'seller_phone', x: 150, y: 430, width: 150, height: 25, content: '', label: 'Seller Phone', fontSize: 12, fieldType: 'phone' },
      
      // Buyer Information  
      { id: 'buyer_name', x: 150, y: 510, width: 200, height: 25, content: '', label: 'Buyer Name', fontSize: 12, fieldType: 'buyer_name' },
      { id: 'buyer_address', x: 150, y: 550, width: 250, height: 40, content: '', label: 'Buyer Address', fontSize: 12, fieldType: 'address' },
      { id: 'buyer_phone', x: 150, y: 600, width: 150, height: 25, content: '', label: 'Buyer Phone', fontSize: 12, fieldType: 'phone' },
      
      // Sale Information
      { id: 'sale_price', x: 150, y: 680, width: 120, height: 25, content: '', label: 'Sale Price', fontSize: 12, fieldType: 'price' },
      { id: 'sale_date', x: 320, y: 680, width: 120, height: 25, content: '', label: 'Sale Date', fontSize: 12, fieldType: 'date' },
      
      // Signatures
      { id: 'seller_signature', x: 150, y: 780, width: 200, height: 50, content: '', label: 'Seller Signature', fontSize: 12, fieldType: 'signature' },
      { id: 'buyer_signature', x: 150, y: 850, width: 200, height: 50, content: '', label: 'Buyer Signature', fontSize: 12, fieldType: 'signature' }
    ];
    
    setFields(defaultFields);
    setCurrentDocumentUrl(dmvFormImage);
    console.log('Loaded default DMV Bill of Sale template with', defaultFields.length, 'fields');
  };

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

  const loadUploadedDocuments = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .list('templates/', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      const documents: UploadedDocument[] = data.map(file => ({
        id: file.id,
        name: file.name,
        url: supabase.storage.from('documents').getPublicUrl(`templates/${file.name}`).data.publicUrl,
        uploadedAt: new Date(file.created_at)
      }));

      setUploadedDocuments(documents);
    } catch (error) {
      console.error('Error loading uploaded documents:', error);
    }
  };

  // Image optimization function
  const optimizeImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      
      img.onload = () => {
        // Calculate optimal dimensions (max 1920px width/height)
        const maxDimension = 1920;
        let { width, height } = img;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const optimizedFile = new File([blob!], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          },
          'image/jpeg',
          0.85 // 85% quality for good balance
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - support only optimized image formats
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (!validImageTypes.includes(file.type)) {
      toast.error('Please select a PNG, JPEG, or WebP image file for best results');
      return;
    }

    // Validate file size (5MB limit for better performance)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB. Please compress your image and try again.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Optimize image before upload
      const optimizedFile = await optimizeImage(file);
      
      // Generate unique filename
      const fileExt = optimizedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `document-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`templates/${fileName}`, optimizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const publicUrl = supabase.storage
        .from('documents')
        .getPublicUrl(`templates/${fileName}`)
        .data.publicUrl;

      // Update current document
      setCurrentDocumentUrl(publicUrl);
      
      // Reload uploaded documents
      await loadUploadedDocuments();
      
      toast.success('Document uploaded and optimized successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document. Please try a different image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const saveTemplate = () => {
    console.log('Attempting to save template...');
    console.log('Template name:', templateName);
    console.log('Current document URL:', currentDocumentUrl);
    console.log('Fields to save:', fields);
    
    // Validation checks
    if (!templateName.trim()) {
      toast.error('Please enter a template name before saving.');
      console.log('Save failed: No template name');
      return;
    }

    if (!currentDocumentUrl) {
      toast.error('Please upload a document image before saving the template.');
      console.log('Save failed: No document image');
      return;
    }

    if (fields.length === 0) {
      toast.error('Please add at least one text field before saving the template.');
      console.log('Save failed: No fields added');
      return;
    }

    try {
      const template: DocumentTemplate = {
        id: Date.now().toString(),
        name: templateName.trim(),
        imageUrl: currentDocumentUrl,
        fields: [...fields], // Create a copy of the fields array
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Template to save:', template);

      const updatedTemplates = [...templates, template];
      setTemplates(updatedTemplates);
      localStorage.setItem('interactive-document-templates', JSON.stringify(updatedTemplates));
      
      console.log('Template saved successfully to localStorage');
      console.log('Updated templates list:', updatedTemplates);
      
      toast.success(`Template "${templateName}" saved successfully with ${fields.length} fields!`);
      
      // Reset the template name for next save
      setTemplateName('');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template. Please try again.');
    }
  };

  const deleteTemplate = (templateId: string) => {
    const templateToDelete = templates.find(t => t.id === templateId);
    if (!templateToDelete) return;

    if (window.confirm(`Are you sure you want to delete the template "${templateToDelete.name}"?`)) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      localStorage.setItem('interactive-document-templates', JSON.stringify(updatedTemplates));
      toast.success(`Template "${templateToDelete.name}" deleted successfully!`);
    }
  };

  const clearCurrentDocument = () => {
    if (window.confirm('Are you sure you want to clear the current document? This will remove the image and all text fields.')) {
      setCurrentDocumentUrl('');
      setFields([]);
      setSelectedField(null);
      toast.success('Document cleared successfully!');
    }
  };

  const deleteUploadedDocument = async (docId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        const { error } = await supabase.storage
          .from('documents')
          .remove([`templates/${fileName}`]);

        if (error) throw error;

        await loadUploadedDocuments();
        toast.success(`Document "${fileName}" deleted successfully!`);
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document. Please try again.');
      }
    }
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
      fontSize: 14,
      fieldType: 'custom'
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  const addPredefinedField = (fieldType: PredefinedField) => {
    const newField: TextField = {
      id: Date.now().toString(),
      x: 100,
      y: 100,
      width: fieldType.defaultWidth,
      height: fieldType.defaultHeight,
      content: fieldType.placeholder,
      label: fieldType.label,
      fontSize: 14,
      fieldType: fieldType.id
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
    toast.success(`Added ${fieldType.label} field`);
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
    
    console.log('Mouse down:', action, 'for field:', fieldId);
    
    if (action === 'drag') {
      setIsDragging(true);
    } else if (action === 'resize') {
      setIsResizing(true);
      console.log('Starting resize');
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        setDragStart({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
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
      console.log('Resizing with delta:', deltaX, deltaY);
      const newWidth = Math.max(50, selectedFieldData.width + deltaX);
      const newHeight = Math.max(20, selectedFieldData.height + deltaY);
      console.log('New dimensions:', newWidth, newHeight);
      updateField(selectedField, {
        width: newWidth,
        height: newHeight
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
            <img src="${currentDocumentUrl}" alt="Document" class="document-bg" />
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
            Add and position text fields on your document template. Upload PNG, JPEG, or WebP images for best results.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Optimizing...' : 'Upload Image'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
          />
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
        {/* Sidebar */}
        <div className="col-span-1 space-y-4">
          {/* Field Library */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Type className="h-4 w-4" />
              Field Library
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {predefinedFields.map((fieldType) => (
                <Button
                  key={fieldType.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addPredefinedField(fieldType)}
                  className="justify-start gap-2 h-auto py-2 px-3"
                >
                  <fieldType.icon className={`h-4 w-4 ${fieldType.color}`} />
                  <span className="text-sm">{fieldType.label}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* File Format Guide */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">File Format Guide</h3>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p><strong>Recommended formats:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>PNG - Best for text documents</li>
                <li>JPEG - Good for photos/scanned docs</li>
                <li>WebP - Modern, efficient format</li>
              </ul>
              <p className="mt-3"><strong>Need to convert a PDF?</strong></p>
              <p>Use online tools like pdf2png.com or your PDF viewer's export function to save as PNG.</p>
            </div>
          </Card>

          {/* Field Properties */}
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
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Move className="h-4 w-4" />
                      Selected Field
                    </h4>
                    {(() => {
                      const field = fields.find(f => f.id === selectedField);
                      if (!field) return null;
                      
                      const fieldTypeInfo = predefinedFields.find(pf => pf.id === field.fieldType);
                      
                      return (
                        <div className="space-y-3">
                          {fieldTypeInfo && (
                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                              <fieldTypeInfo.icon className={`h-4 w-4 ${fieldTypeInfo.color}`} />
                              <span className="text-sm font-medium">{fieldTypeInfo.label} Field</span>
                            </div>
                          )}
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
                                onChange={(e) => updateField(field.id, { width: parseInt(e.target.value) || 200 })}
                                min="50"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Height</label>
                              <Input
                                type="number"
                                value={field.height}
                                onChange={(e) => updateField(field.id, { height: parseInt(e.target.value) || 30 })}
                                min="20"
                              />
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteField(field.id)}
                            className="w-full flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Field
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Templates */}
          {templates.length > 0 && (
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Saved Templates</h3>
                <Button 
                  onClick={clearCurrentDocument} 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFields(template.fields);
                        setCurrentDocumentUrl(template.imageUrl);
                        setTemplateName(template.name);
                        toast.success(`Loaded template: ${template.name}`);
                      }}
                      className="flex-1 justify-start text-sm"
                    >
                      {template.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Uploaded Documents */}
          {uploadedDocuments.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Uploaded Documents</h3>
              <div className="space-y-2">
                {uploadedDocuments.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCurrentDocumentUrl(doc.url);
                        toast.success(`Loaded document: ${doc.name}`);
                      }}
                      className="flex-1 justify-start text-sm truncate"
                    >
                      {doc.name}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteUploadedDocument(doc.id, doc.name)}
                      className="text-destructive hover:text-destructive p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

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
                src={currentDocumentUrl}
                alt="Document Template"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
              
              {fields.map((field) => {
                const fieldTypeInfo = predefinedFields.find(pf => pf.id === field.fieldType);
                return (
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
                          className="absolute -top-2 -right-2 w-6 h-6 bg-primary border-2 border-white rounded-full cursor-se-resize flex items-center justify-center"
                          onMouseDown={(e) => {
                            console.log('Resize handle clicked');
                            handleMouseDown(e, field.id, 'resize');
                          }}
                        >
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        {fieldTypeInfo && (
                          <div className="absolute -top-6 -left-2 flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                            <fieldTypeInfo.icon className="h-3 w-3" />
                            <span>{fieldTypeInfo.label}</span>
                          </div>
                        )}
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
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}