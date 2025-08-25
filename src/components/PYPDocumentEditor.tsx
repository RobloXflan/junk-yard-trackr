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
  const [documentFields, setDocumentFields] = useState<Record<string, TextField[]>>({});
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 816, height: 1056 });
  
  // Dual vehicle state management (for bill of sale documents)
  const [vehicleData1, setVehicleData1] = useState<any>(null);
  const [vehicleData2, setVehicleData2] = useState<any>(null);
  const [currentVehicleSlot, setCurrentVehicleSlot] = useState<1 | 2>(1);
  const [currentTripData, setCurrentTripData] = useState<any>(null);

  // Get current document and its fields
  const currentDocument = uploadedDocuments[currentDocumentIndex];
  const currentDocumentUrl = currentDocument?.url || dmvFormImage;
  const fields = documentFields[currentDocument?.id || 'default'] || [];

  // Check if current document is bill of sale (supports dual vehicles)
  const isBillOfSale = currentDocument?.name.toLowerCase().includes('bill of sale') || 
                       currentDocument?.name.toLowerCase().includes('bill-of-sale');

  // Predefined field types for PYP - Vehicle 1
  const predefinedFieldsVehicle1: PredefinedField[] = [
    { id: 'vin', label: 'VIN (Vehicle 1)', defaultWidth: 300, defaultHeight: 30, placeholder: 'Enter vehicle identification number', icon: Hash, color: 'text-blue-600' },
    { id: 'license_plate', label: 'License Plate (Vehicle 1)', defaultWidth: 150, defaultHeight: 30, placeholder: 'Enter license plate', icon: Car, color: 'text-green-600' },
    { id: 'year', label: 'Year (Vehicle 1)', defaultWidth: 80, defaultHeight: 30, placeholder: 'YYYY', icon: Calendar, color: 'text-purple-600' },
    { id: 'make', label: 'Make (Vehicle 1)', defaultWidth: 120, defaultHeight: 30, placeholder: 'Vehicle make', icon: Car, color: 'text-orange-600' },
    { id: 'model', label: 'Model (Vehicle 1)', defaultWidth: 150, defaultHeight: 30, placeholder: 'Vehicle model', icon: Car, color: 'text-red-600' },
    { id: 'mileage', label: 'Mileage (Vehicle 1)', defaultWidth: 100, defaultHeight: 30, placeholder: 'Miles', icon: Hash, color: 'text-cyan-600' },
    { id: 'price', label: 'Price (Vehicle 1)', defaultWidth: 120, defaultHeight: 30, placeholder: '$0.00', icon: DollarSign, color: 'text-emerald-600' },
    { id: 'date', label: 'Date (Vehicle 1)', defaultWidth: 120, defaultHeight: 30, placeholder: 'MM/DD/YYYY', icon: Calendar, color: 'text-indigo-600' },
    { id: 'buyer_name', label: 'Buyer Name', defaultWidth: 200, defaultHeight: 30, placeholder: 'Buyer full name', icon: User, color: 'text-pink-600' },
    { id: 'seller_name', label: 'Seller Name', defaultWidth: 200, defaultHeight: 30, placeholder: 'Seller full name', icon: User, color: 'text-teal-600' },
    { id: 'address', label: 'Address', defaultWidth: 250, defaultHeight: 60, placeholder: 'Street address, City, State ZIP', icon: MapPin, color: 'text-yellow-600' },
    { id: 'phone', label: 'Phone Number', defaultWidth: 150, defaultHeight: 30, placeholder: '(555) 123-4567', icon: Phone, color: 'text-violet-600' },
    { id: 'signature', label: 'Signature', defaultWidth: 200, defaultHeight: 50, placeholder: 'Signature line', icon: FileText, color: 'text-rose-600' }
  ];

  // Predefined field types for PYP - Vehicle 2 (only for Bill of Sale)
  const predefinedFieldsVehicle2: PredefinedField[] = [
    { id: 'vin_2', label: 'VIN (Vehicle 2)', defaultWidth: 300, defaultHeight: 30, placeholder: 'Enter vehicle identification number', icon: Hash, color: 'text-blue-400' },
    { id: 'license_plate_2', label: 'License Plate (Vehicle 2)', defaultWidth: 150, defaultHeight: 30, placeholder: 'Enter license plate', icon: Car, color: 'text-green-400' },
    { id: 'year_2', label: 'Year (Vehicle 2)', defaultWidth: 80, defaultHeight: 30, placeholder: 'YYYY', icon: Calendar, color: 'text-purple-400' },
    { id: 'make_2', label: 'Make (Vehicle 2)', defaultWidth: 120, defaultHeight: 30, placeholder: 'Vehicle make', icon: Car, color: 'text-orange-400' },
    { id: 'model_2', label: 'Model (Vehicle 2)', defaultWidth: 150, defaultHeight: 30, placeholder: 'Vehicle model', icon: Car, color: 'text-red-400' },
    { id: 'mileage_2', label: 'Mileage (Vehicle 2)', defaultWidth: 100, defaultHeight: 30, placeholder: 'Miles', icon: Hash, color: 'text-cyan-400' },
    { id: 'price_2', label: 'Price (Vehicle 2)', defaultWidth: 120, defaultHeight: 30, placeholder: '$0.00', icon: DollarSign, color: 'text-emerald-400' },
    { id: 'date_2', label: 'Date (Vehicle 2)', defaultWidth: 120, defaultHeight: 30, placeholder: 'MM/DD/YYYY', icon: Calendar, color: 'text-indigo-400' },
  ];

  // Combined predefined fields based on document type
  const predefinedFields = isBillOfSale 
    ? [...predefinedFieldsVehicle1, ...predefinedFieldsVehicle2]
    : predefinedFieldsVehicle1;

  useEffect(() => {
    const initializeEditor = async () => {
      // Check for current PYP trip and auto-load data
      const currentTripKey = localStorage.getItem('current-pyp-trip');
      
      if (currentTripKey) {
        console.log('Loading PYP trip data from:', currentTripKey);
        const tripData = localStorage.getItem(currentTripKey);
        
        if (tripData) {
          const parsedTripData = JSON.parse(tripData);
          setCurrentTripData(parsedTripData);
          
          // Load vehicles from trip data
          if (parsedTripData.vehicle1) {
            setVehicleData1(parsedTripData.vehicle1);
            localStorage.setItem('documents-vehicle-data-1', JSON.stringify(parsedTripData.vehicle1));
          }
          if (parsedTripData.vehicle2) {
            setVehicleData2(parsedTripData.vehicle2);
            localStorage.setItem('documents-vehicle-data-2', JSON.stringify(parsedTripData.vehicle2));
          }
        }
      } else {
        // Check for vehicle data in localStorage (fallback)
        const v1Str = localStorage.getItem('documents-vehicle-data-1');
        const v2Str = localStorage.getItem('documents-vehicle-data-2');
        
        let v1: any = null;
        let v2: any = null;
        
        try { v1 = v1Str ? JSON.parse(v1Str) : null; } catch (e) { console.error('Error parsing vehicle 1 data:', e); }
        try { v2 = v2Str ? JSON.parse(v2Str) : null; } catch (e) { console.error('Error parsing vehicle 2 data:', e); }
        
        if (v1) {
          console.log('Found Vehicle 1 data for PYP:', v1);
          setVehicleData1(v1);
        }
        
        if (v2) {
          console.log('Found Vehicle 2 data for PYP:', v2);
          setVehicleData2(v2);
        }
      }
      
      // Load existing templates and documents
      await loadUploadedDocuments();
    };
    
    initializeEditor();
  }, []);

  // Load selected PYP templates and saved field positions
  useEffect(() => {
    try {
      const raw = localStorage.getItem('selected-pyp-templates');
      if (!raw) return;
      const templates: Array<{ name: string; uploadedImage?: string } | any> = JSON.parse(raw);
      if (Array.isArray(templates) && templates.length) {
        const docs = templates
          .filter((t) => t && typeof t === 'object' && t.uploadedImage)
          .map((t, idx) => ({
            id: `pyp-local-${idx}-${Date.now()}`,
            name: t.name || `Template ${idx + 1}.png`,
            url: t.uploadedImage as string,
            uploadedAt: new Date(),
          }));
        if (docs.length) {
          setUploadedDocuments(docs);
          setCurrentDocumentIndex(0);
          
          // Load saved field positions for each template
          docs.forEach(doc => {
            const savedFields = localStorage.getItem(`pyp-template-fields-${doc.name}`);
            if (savedFields) {
              try {
                const parsedFields = JSON.parse(savedFields);
                setDocumentFields(prev => ({
                  ...prev,
                  [doc.id]: parsedFields
                }));
              } catch (e) {
                console.error('Error loading saved fields for', doc.name, e);
              }
            }
          });
          
          toast.success(`Loaded ${docs.length} template${docs.length > 1 ? 's' : ''} with saved field positions`);
        }
      }
    } catch (e) {
      console.error('Failed to load selected PYP templates:', e);
    }
  }, []);

  // Load vehicle data for auto-population (similar to SA recycling process)
  useEffect(() => {
    
  }, []);
    
  // Live update Vehicle 2 fields when vehicleData2 changes (similar to SA recycling)
  useEffect(() => {
    if (!currentDocument || fields.length === 0) return; // Don't run during initial load
    
    console.log('vehicleData2 changed:', vehicleData2);
    
    const docId = currentDocument.id;
    
    setDocumentFields(prevFields => {
      const currentFields = prevFields[docId] || [];
      let updatedFields = [...currentFields];
      
      if (vehicleData2 && isBillOfSale) {
        // Vehicle 2 was added - check if we need to add fields or just prefill existing ones
        const hasVehicle2Fields = updatedFields.some(field => 
          field.fieldType.endsWith('_2') || (field.label && field.label.includes('Vehicle 2'))
        );
        
        if (!hasVehicle2Fields) {
          console.log('Auto-adding Vehicle 2 fields...');
          const vehicle2Fields = addVehicle2FieldsAutomatically(updatedFields, vehicleData2);
          updatedFields = [...updatedFields, ...vehicle2Fields];
        } else {
          console.log('Pre-filling existing Vehicle 2 fields...');
          updatedFields = updatedFields.map(field => {
            const updatedField = { ...field };
            
            // Try exact fieldType match first, then compatibility patterns
            let vehicle2FieldType = field.fieldType;
            if (!vehicle2FieldType.endsWith('_2')) {
              if (field.label && (field.label.includes('Vehicle 2') || field.label.includes('(Vehicle 2)'))) {
                if (field.label.toLowerCase().includes('vin')) vehicle2FieldType = 'vin_2';
                else if (field.label.toLowerCase().includes('year')) vehicle2FieldType = 'year_2';
                else if (field.label.toLowerCase().includes('make')) vehicle2FieldType = 'make_2';
                else if (field.label.toLowerCase().includes('model')) vehicle2FieldType = 'model_2';
                else if (field.label.toLowerCase().includes('license')) vehicle2FieldType = 'license_plate_2';
                else if (field.label.toLowerCase().includes('mileage')) vehicle2FieldType = 'mileage_2';
                else if (field.label.toLowerCase().includes('price')) vehicle2FieldType = 'price_2';
                else if (field.label.toLowerCase().includes('date')) vehicle2FieldType = 'date_2';
              }
            }
            
            switch (vehicle2FieldType) {
              case 'vin_2':
                updatedField.content = vehicleData2.vehicleId || '';
                break;
              case 'year_2':
                updatedField.content = vehicleData2.year || '';
                break;
              case 'make_2':
                updatedField.content = vehicleData2.make || '';
                break;
              case 'model_2':
                updatedField.content = vehicleData2.model || '';
                break;
              case 'license_plate_2':
                updatedField.content = vehicleData2.licensePlate || '';
                break;
              case 'mileage_2':
                updatedField.content = vehicleData2.mileage || '';
                break;
              case 'price_2':
                updatedField.content = vehicleData2.salePrice || '';
                break;
              case 'date_2':
                updatedField.content = vehicleData2.saleDate || '';
                break;
            }
            
            return updatedField;
          });
        }
      } else if (!vehicleData2) {
        // Clear Vehicle 2 data when vehicleData2 is removed
        updatedFields = updatedFields.map(field => 
          (field.fieldType.endsWith('_2') || (field.label && field.label.includes('Vehicle 2'))) ? { ...field, content: '' } : field
        );
      }
      
      return {
        ...prevFields,
        [docId]: updatedFields
      };
    });
  }, [vehicleData2, currentDocument, isBillOfSale]);

  // Auto-populate vehicle fields when vehicle data or documents change
  useEffect(() => {
    if (!currentDocument || !vehicleData1) return;
    
    const docId = currentDocument.id;
    const existingFields = documentFields[docId] || [];
    
    // Don't auto-populate if fields already exist and have content (preserve manual work)
    const hasPopulatedFields = existingFields.some(field => field.content && field.content.trim() !== '');
    if (hasPopulatedFields && existingFields.length > 0) {
      console.log('Skipping auto-population - fields already have content');
      return;
    }
    
    // Auto-populate existing fields or create new ones if none exist for this document
    let updatedFields = [...existingFields];
    
    // If no fields exist, try to load saved template fields first
    if (updatedFields.length === 0) {
      const savedFields = localStorage.getItem(`pyp-template-fields-${currentDocument.name}`);
      if (savedFields) {
        try {
          updatedFields = JSON.parse(savedFields);
          console.log('Loaded saved field layout for', currentDocument.name);
        } catch (e) {
          console.error('Error loading saved fields:', e);
        }
      }
    }
    
    // Populate Vehicle 1 fields
    if (vehicleData1) {
      console.log('Auto-populating Vehicle 1 fields for:', currentDocument.name);
      updatedFields = updatedFields.map(field => {
        const updatedField = { ...field };
        switch (field.fieldType) {
          case 'vin':
            updatedField.content = vehicleData1.vehicleId || '';
            break;
          case 'year':
            updatedField.content = vehicleData1.year || '';
            break;
          case 'make':
            updatedField.content = vehicleData1.make || '';
            break;
          case 'model':
            updatedField.content = vehicleData1.model || '';
            break;
          case 'license_plate':
            updatedField.content = vehicleData1.licensePlate || '';
            break;
          case 'mileage':
            updatedField.content = vehicleData1.mileage || '';
            break;
          case 'price':
            updatedField.content = vehicleData1.salePrice || '';
            break;
          case 'date':
            updatedField.content = vehicleData1.saleDate || '';
            break;
          case 'buyer_name':
            const buyerName = [vehicleData1.buyerFirstName, vehicleData1.buyerLastName].filter(Boolean).join(' ');
            updatedField.content = buyerName || '';
            break;
          case 'seller_name':
            updatedField.content = vehicleData1.sellerName || '';
            break;
        }
        return updatedField;
      });
    }
    
    // Update fields for this document
    setDocumentFields(prev => ({
      ...prev,
      [docId]: updatedFields
    }));
    
  }, [currentDocument, vehicleData1]);

  // Add Vehicle 2 fields automatically when needed (similar to SA recycling)
  const addVehicle2FieldsAutomatically = (existingFields: TextField[], vehicleData: any): TextField[] => {
    // Find the bottom-most Y position of existing fields to position Vehicle 2 fields below
    const maxY = existingFields.reduce((max, field) => 
      Math.max(max, field.y + field.height), 0
    );
    
    const startY = maxY + 50; // Start 50px below the last field
    const leftColumnX = 100;  // Left column position
    const rightColumnX = 400; // Right column position
    
    const vehicle2Fields: TextField[] = [
      {
        id: `vin_2_${Date.now()}`,
        x: leftColumnX,
        y: startY,
        width: 300,
        height: 30,
        content: vehicleData.vehicleId || '',
        label: 'VIN (Vehicle 2)',
        fontSize: 14,
        fieldType: 'vin_2'
      },
      {
        id: `year_2_${Date.now() + 1}`,
        x: rightColumnX,
        y: startY,
        width: 80,
        height: 30,
        content: vehicleData.year || '',
        label: 'Year (Vehicle 2)',
        fontSize: 14,
        fieldType: 'year_2'
      },
      {
        id: `make_2_${Date.now() + 2}`,
        x: leftColumnX,
        y: startY + 40,
        width: 120,
        height: 30,
        content: vehicleData.make || '',
        label: 'Make (Vehicle 2)',
        fontSize: 14,
        fieldType: 'make_2'
      },
      {
        id: `model_2_${Date.now() + 3}`,
        x: rightColumnX,
        y: startY + 40,
        width: 150,
        height: 30,
        content: vehicleData.model || '',
        label: 'Model (Vehicle 2)',
        fontSize: 14,
        fieldType: 'model_2'
      },
      {
        id: `license_plate_2_${Date.now() + 4}`,
        x: leftColumnX,
        y: startY + 80,
        width: 150,
        height: 30,
        content: vehicleData.licensePlate || '',
        label: 'License Plate (Vehicle 2)',
        fontSize: 14,
        fieldType: 'license_plate_2'
      },
      {
        id: `price_2_${Date.now() + 5}`,
        x: rightColumnX,
        y: startY + 80,
        width: 120,
        height: 30,
        content: vehicleData.salePrice || '',
        label: 'Price (Vehicle 2)',
        fontSize: 14,
        fieldType: 'price_2'
      },
      {
        id: `date_2_${Date.now() + 6}`,
        x: leftColumnX,
        y: startY + 120,
        width: 120,
        height: 30,
        content: vehicleData.saleDate || '',
        label: 'Date (Vehicle 2)',
        fontSize: 14,
        fieldType: 'date_2'
      }
    ];
    
    return vehicle2Fields;
  };

  // Save field positions for current template
  const saveFieldPositions = () => {
    if (!currentDocument) {
      toast.error('No document selected');
      return;
    }
    
    const docFields = documentFields[currentDocument.id] || [];
    const templateName = currentDocument.name;
    
    try {
      localStorage.setItem(`pyp-template-fields-${templateName}`, JSON.stringify(docFields));
      toast.success(`Field positions saved for ${templateName}`);
    } catch (error) {
      console.error('Error saving field positions:', error);
      toast.error('Failed to save field positions');
    }
  };

  // Load field positions for current template
  const loadFieldPositions = () => {
    if (!currentDocument) {
      toast.error('No document selected');
      return;
    }
    
    const templateName = currentDocument.name;
    const savedFields = localStorage.getItem(`pyp-template-fields-${templateName}`);
    
    if (savedFields) {
      try {
        const parsedFields = JSON.parse(savedFields);
        setDocumentFields(prev => ({
          ...prev,
          [currentDocument.id]: parsedFields
        }));
        toast.success(`Field positions loaded for ${templateName}`);
      } catch (error) {
        console.error('Error loading field positions:', error);
        toast.error('Failed to load field positions');
      }
    } else {
      toast.info(`No saved field positions found for ${templateName}`);
    }
  };
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

        // Merge Supabase documents with any existing ones (e.g., from local selection)
        setUploadedDocuments((prev) => {
          const merged = [...documents];
          for (const d of prev) {
            if (!merged.some((m) => m.url === d.url)) merged.push(d);
          }
          // If no current document selected, default to first
          if (currentDocumentIndex === 0 && merged.length > 0) {
            setCurrentDocumentIndex(0);
          }
          return merged;
        });
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

      // Add uploaded document and set as current
      const newDoc: UploadedDocument = {
        id: `upload-${Date.now()}`,
        name: fileName,
        url: publicUrl,
        uploadedAt: new Date()
      };
      
      setUploadedDocuments(prev => {
        const updated = [...prev, newDoc];
        // Set as current document
        setCurrentDocumentIndex(updated.length - 1);
        return updated;
      });
      
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

  // Update fields for current document
  const updateFieldsForCurrentDoc = (updater: (fields: TextField[]) => TextField[]) => {
    const docId = currentDocument?.id || 'default';
    setDocumentFields(prev => ({
      ...prev,
      [docId]: updater(prev[docId] || [])
    }));
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
    updateFieldsForCurrentDoc(fields => [...fields, newField]);
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
    updateFieldsForCurrentDoc(fields => [...fields, newField]);
    setSelectedField(newField.id);
  };

  // Delete field
  const deleteField = (fieldId: string) => {
    updateFieldsForCurrentDoc(fields => fields.filter(f => f.id !== fieldId));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  // Update field content
  const updateField = (fieldId: string, updates: Partial<TextField>) => {
    updateFieldsForCurrentDoc(fields => 
      fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
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

  // Print all documents functionality
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Create print content for all documents
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PYP Documents</title>
          <style>
            @media print {
              @page { margin: 0; size: 8.5in 11in; }
              body { margin: 0; padding: 0; }
              .document-page { page-break-after: always; }
              .document-page:last-child { page-break-after: auto; }
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
          ${uploadedDocuments.map((doc, index) => {
            const docFields = documentFields[doc.id] || [];
            return `
              <div class="document-page">
                <div class="document-container" style="background-image: url('${doc.url}');">
                  ${docFields.map(field => `
                    <div class="field" style="
                      left: ${field.x}px;
                      top: ${field.y}px;
                      width: ${field.width}px;
                      height: ${field.height}px;
                      font-size: ${field.fontSize}px;
                    ">${field.content || field.label}</div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
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
                 {uploadedDocuments.map((doc, index) => (
                   <button
                     key={doc.id}
                     onClick={() => setCurrentDocumentIndex(index)}
                     className={`w-full text-left px-2 py-1 rounded text-xs truncate transition-colors ${
                       currentDocumentIndex === index
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
                variant="outline"
                size="sm"
                onClick={saveFieldPositions}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Save Layout
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={loadFieldPositions}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Load Layout
              </Button>
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
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-800">PYP Document Editor</h1>
            
            {/* Document Navigation */}
            {uploadedDocuments.length > 1 && (
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-lg">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDocumentIndex(Math.max(0, currentDocumentIndex - 1))}
                  disabled={currentDocumentIndex === 0}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium">
                  {currentDocumentIndex + 1} of {uploadedDocuments.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDocumentIndex(Math.min(uploadedDocuments.length - 1, currentDocumentIndex + 1))}
                  disabled={currentDocumentIndex === uploadedDocuments.length - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePrint}
              className="flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print All ({uploadedDocuments.length})</span>
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