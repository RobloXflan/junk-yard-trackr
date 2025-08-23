import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Move, Type, Printer, Upload, Image, Car, Calendar, Hash, User, Phone, MapPin, DollarSign, FileText } from 'lucide-react';
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

interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
}

interface PYPDocumentEditorProps {
  onNavigate?: (page: string) => void;
}

// Separate PYP Document Editor - No saved templates functionality
export function PYPDocumentEditor({ onNavigate }: PYPDocumentEditorProps) {
  const [fields, setFields] = useState<TextField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState(dmvFormImage);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 816, height: 1056 });

  // Predefined field types for PYP
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
    loadUploadedDocuments();
  }, []);

  // Load uploaded documents (PYP specific storage)
  const loadUploadedDocuments = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .list('pyp-uploads/', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      if (data) {
        const documents: UploadedDocument[] = data
          .filter(file => file.name !== '.emptyFolderPlaceholder')
          .map(file => ({
            id: file.id || file.name,
            name: file.name,
            url: supabase.storage.from('documents').getPublicUrl(`pyp-uploads/${file.name}`).data.publicUrl,
            uploadedAt: new Date(file.created_at || Date.now())
          }));

        setUploadedDocuments(documents);
      }
    } catch (error) {
      console.error('Error loading uploaded documents:', error);
    }
  };

  // Handle file upload for PYP documents
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    setIsUploading(true);
    try {
      // Create optimized version
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img') as HTMLImageElement;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Set canvas size to 8.5x11 inches at 96 DPI (816x1056 pixels)
      canvas.width = 816;
      canvas.height = 1056;
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const aspectRatio = img.width / img.height;
        const canvasAspectRatio = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        
        if (aspectRatio > canvasAspectRatio) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / aspectRatio;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawHeight = canvas.height;
          drawWidth = canvas.height * aspectRatio;
          offsetX = (canvas.width - drawWidth) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }

      // Convert to optimized file
      const optimizedBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      });

      if (!optimizedBlob) throw new Error('Failed to create optimized image');

      const optimizedFile = new File([optimizedBlob], file.name, { type: 'image/jpeg' });
      const fileName = `${Date.now()}-${file.name}`;

      // Upload to PYP specific folder in Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`pyp-uploads/${fileName}`, optimizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage
        .from('documents')
        .getPublicUrl(`pyp-uploads/${fileName}`)
        .data.publicUrl;

      // Update current document and reload list
      setCurrentDocumentUrl(publicUrl);
      await loadUploadedDocuments();
      
      toast.success('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add text field
  const addTextField = () => {
    const newField: TextField = {
      id: `field-${Date.now()}`,
      x: 100,
      y: 100,
      width: 200,
      height: 30,
      content: '',
      label: 'Text Field',
      fontSize: 14,
      fieldType: 'text'
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  // Add predefined field
  const addPredefinedField = (fieldType: string) => {
    const predefinedField = predefinedFields.find(f => f.id === fieldType);
    if (!predefinedField) return;

    const newField: TextField = {
      id: `field-${Date.now()}`,
      x: 100,
      y: 100,
      width: predefinedField.defaultWidth,
      height: predefinedField.defaultHeight,
      content: '',
      label: predefinedField.label,
      fontSize: 14,
      fieldType: fieldType
    };
    setFields([...fields, newField]);
    setSelectedField(newField.id);
  };

  // Delete field
  const deleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  // Update field content
  const updateField = (fieldId: string, updates: Partial<TextField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  // Mouse event handlers for drag and resize
  const handleMouseDown = (e: React.MouseEvent, fieldId: string, action: 'drag' | 'resize') => {
    e.preventDefault();
    setSelectedField(fieldId);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    } else {
      setIsResizing(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedField || (!isDragging && !isResizing)) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isDragging) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      updateField(selectedField, {
        x: Math.max(0, Math.min(canvasSize.width - 50, mouseX - 10)),
        y: Math.max(0, Math.min(canvasSize.height - 20, mouseY - 10))
      });
    } else if (isResizing) {
      const field = fields.find(f => f.id === selectedField);
      if (field) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        updateField(selectedField, {
          width: Math.max(50, field.width + deltaX),
          height: Math.max(20, field.height + deltaY)
        });
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Print functionality
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PYP Document</title>
          <style>
            @media print {
              @page { margin: 0; size: 8.5in 11in; }
              body { margin: 0; padding: 0; }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .document-container {
              position: relative;
              width: 816px;
              height: 1056px;
              margin: 0 auto;
              background-image: url('${currentDocumentUrl}');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
            }
            .field {
              position: absolute;
              display: flex;
              align-items: center;
              padding: 2px;
              font-weight: bold;
              color: black;
              background: rgba(255, 255, 255, 0.8);
              border: 1px solid #ccc;
              box-sizing: border-box;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            ${fields.map(field => `
              <div class="field" style="
                left: ${field.x}px;
                top: ${field.y}px;
                width: ${field.width}px;
                height: ${field.height}px;
                font-size: ${field.fontSize}px;
              ">${field.content || field.label}</div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">PYP Document Editor</h2>
          
          {/* Document Upload */}
          <div className="space-y-2 mb-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Uploaded Documents */}
          {uploadedDocuments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {uploadedDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setCurrentDocumentUrl(doc.url)}
                    className={`w-full text-left px-2 py-1 rounded text-xs truncate transition-colors ${
                      currentDocumentUrl === doc.url
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title={doc.name}
                  >
                    {doc.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Field Library */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Basic Fields</h3>
              <Button
                onClick={addTextField}
                className="w-full mb-2"
                variant="outline"
                size="sm"
              >
                <Type className="w-4 h-4 mr-2" />
                Add Text Field
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Vehicle Fields</h3>
              <div className="grid grid-cols-1 gap-1">
                {predefinedFields.map((field) => (
                  <Button
                    key={field.id}
                    onClick={() => addPredefinedField(field.id)}
                    className="w-full justify-start text-xs p-2"
                    variant="outline"
                    size="sm"
                  >
                    <field.icon className={`w-3 h-3 mr-1 ${field.color}`} />
                    {field.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Field Properties */}
        {selectedField && (
          <div className="border-t border-gray-200 p-4">
            {(() => {
              const field = fields.find(f => f.id === selectedField);
              if (!field) return null;

              return (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Field Properties</h3>
                  
                  <div>
                    <label className="text-xs text-gray-600">Content</label>
                    <Textarea
                      value={field.content}
                      onChange={(e) => updateField(field.id, { content: e.target.value })}
                      placeholder={field.label}
                      className="mt-1 text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">Label</label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-600">Font Size</label>
                    <Input
                      type="number"
                      value={field.fontSize}
                      onChange={(e) => updateField(field.id, { fontSize: parseInt(e.target.value) || 14 })}
                      className="mt-1 text-sm"
                      min="8"
                      max="72"
                    />
                  </div>

                  <Button
                    onClick={() => deleteField(field.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Field
                  </Button>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">PYP Document Editor</h1>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePrint}
              className="flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </Button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="mx-auto" style={{ width: canvasSize.width, height: canvasSize.height }}>
            <Card className="relative bg-white shadow-lg overflow-hidden" style={{ width: '100%', height: '100%' }}>
              <div
                ref={canvasRef}
                className="relative w-full h-full cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  backgroundImage: `url(${currentDocumentUrl})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              >
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className={`absolute border-2 bg-white bg-opacity-75 cursor-move flex items-center px-1 ${
                      selectedField === field.id
                        ? 'border-blue-500 shadow-lg'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{
                      left: field.x,
                      top: field.y,
                      width: field.width,
                      height: field.height,
                      fontSize: field.fontSize,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, field.id, 'drag')}
                    onClick={() => setSelectedField(field.id)}
                  >
                    <span className="truncate font-medium text-black">
                      {field.content || field.label}
                    </span>
                    
                    {selectedField === field.id && (
                      <>
                        <div
                          className="absolute -right-1 -bottom-1 w-3 h-3 bg-blue-500 cursor-se-resize"
                          onMouseDown={(e) => handleMouseDown(e, field.id, 'resize')}
                        />
                        <div
                          className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                        >
                          {field.label}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PYPDocumentEditor;