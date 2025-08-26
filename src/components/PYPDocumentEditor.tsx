import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Move, Type, Save, Printer, Upload, Image, Car, Calendar, Hash, User, Phone, MapPin, DollarSign, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import dmvFormImage from '@/assets/dmv-bill-of-sale.png';
import { format } from 'date-fns';

// DMV/NCIC Code mapping for vehicle makes
const DMV_CODE_MAPPING: Record<string, string> = {
  'acura': 'ACUR',
  'audi': 'AUDI',
  'bmw': 'BMW',
  'buick': 'BUIC',
  'cadillac': 'CADI',
  'chevrolet': 'CHEV',
  'chevy': 'CHEV',
  'chrysler': 'CHRY',
  'datsun': 'DATS',
  'dodge': 'DODG',
  'fiat': 'FIAT',
  'ford': 'FORD',
  'gmc': 'GMC',
  'honda': 'HOND',
  'hyundai': 'HYUN',
  'infiniti': 'INFI',
  'isuzu': 'ISU',
  'jaguar': 'JAGU',
  'jeep': 'JEEP',
  'kia': 'KIA',
  'land rover': 'LNDR',
  'lexus': 'LEXS',
  'lincoln': 'LINC',
  'mazda': 'MAZD',
  'mercedes-benz': 'MERZ',
  'mercedes': 'MERZ',
  'mercury': 'MERC',
  'mini': 'MNNI',
  'mini cooper': 'MNNI',
  'mitsubishi': 'MITS',
  'nissan': 'NISS',
  'oldsmobile': 'OLDS',
  'plymouth': 'PLYM',
  'pontiac': 'PONT',
  'porsche': 'PORS',
  'saturn': 'SATR',
  'subaru': 'SUBA',
  'suzuki': 'SUZI',
  'toyota': 'TOYT',
  'volkswagen': 'VOLK',
  'vw': 'VOLK',
  'volvo': 'VOLV'
};

// Convert vehicle make to DMV/NCIC code
const convertMakeToDMVCode = (make: string): string => {
  if (!make) return '';
  const dmvCode = DMV_CODE_MAPPING[make.toLowerCase().trim()];
  return dmvCode || make; 
};

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

// Document types for PYP templates
type DocumentType = 'bill_of_sale' | 'statement_of_fax1' | 'statement_of_fax2' | 'statement_of_erasure';

interface DocumentTemplate {
  id: string;
  name: string;
  imageUrl: string;
  fields: TextField[];
  createdAt: Date;
  updatedAt: Date;
  documentType: DocumentType;
}

interface PYPDocumentEditorProps {
  onNavigate?: (page: string) => void;
}

interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  folder?: string;
}

export function PYPDocumentEditor({ onNavigate }: PYPDocumentEditorProps) {
  const [fields, setFields] = useState<TextField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [templateName, setTemplateName] = useState('Bill of Sale Template');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [currentDocumentUrl, setCurrentDocumentUrl] = useState(dmvFormImage);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 816, height: 1056 });
  
  // Document type management
  const [currentDocumentType, setCurrentDocumentType] = useState<DocumentType>('bill_of_sale');
  const [documentTypeImages, setDocumentTypeImages] = useState<Record<DocumentType, string>>({
    bill_of_sale: dmvFormImage,
    statement_of_fax1: '',
    statement_of_fax2: '',
    statement_of_erasure: ''
  });
  
  // Dual vehicle state management
  const [vehicleData1, setVehicleData1] = useState<any>(null);
  const [vehicleData2, setVehicleData2] = useState<any>(null);
  const [currentVehicleSlot, setCurrentVehicleSlot] = useState<1 | 2>(1);
  
  // PYP Trip mode state
  const [isInTripMode, setIsInTripMode] = useState(false);
  const [currentTripData, setCurrentTripData] = useState<any>(null);

  // Predefined field types - Vehicle 1
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

  // Predefined field types - Vehicle 2
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

  // Combined predefined fields for reference
  const predefinedFields = [...predefinedFieldsVehicle1, ...predefinedFieldsVehicle2];

  // Normalize and prefill fields with vehicle data
  const normalizeAndPrefillFields = (templateFields: TextField[]): TextField[] => {
    let normalizedFields = [...templateFields];
    
    // First, clear all known Vehicle 1 and Vehicle 2 field contents
    const knownVehicleFieldTypes = [
      'vin', 'year', 'make', 'model', 'license_plate', 'mileage', 'price', 'date', 
      'seller_name', 'seller_address', 'seller_phone', 'buyer_name', 'buyer_address', 
      'buyer_phone', 'sale_price', 'sale_date',
      'vin_2', 'year_2', 'make_2', 'model_2', 'license_plate_2', 'mileage_2', 'price_2', 'date_2'
    ];
    
    normalizedFields = normalizedFields.map(field => 
      knownVehicleFieldTypes.includes(field.fieldType) ? { ...field, content: '' } : field
    );
    
    // Get current vehicle data for PYP
    const v1Str = localStorage.getItem('pyp-vehicle-data-1');
    const v2Str = localStorage.getItem('pyp-vehicle-data-2');
    
    let v1: any = null;
    let v2: any = null;
    try { v1 = v1Str ? JSON.parse(v1Str) : null; } catch (e) { console.error('Error parsing vehicle 1 data:', e); }
    try { v2 = v2Str ? JSON.parse(v2Str) : null; } catch (e) { console.error('Error parsing vehicle 2 data:', e); }
    
    // Prefill Vehicle 1 if present
    if (v1) {
      console.log('Pre-filling Vehicle 1 data:', v1);
      setVehicleData1(v1);
      
      normalizedFields = normalizedFields.map(field => {
        const updatedField = { ...field };
        switch (field.fieldType) {
          case 'vin':
            updatedField.content = v1.vehicleId || '';
            break;
          case 'year':
            updatedField.content = v1.year || '';
            break;
          case 'make':
            updatedField.content = convertMakeToDMVCode(v1.make || '');
            break;
          case 'model':
            updatedField.content = v1.model || '';
            break;
          case 'license_plate':
            updatedField.content = v1.licensePlate || '';
            break;
          case 'mileage':
            updatedField.content = v1.mileage || '';
            break;
          case 'price':
            updatedField.content = v1.salePrice || '';
            break;
          case 'seller_name':
            updatedField.content = v1.sellerName || '';
            break;
          case 'seller_address':
            updatedField.content = v1.sellerAddress || '';
            break;
          case 'seller_phone':
            updatedField.content = v1.sellerPhone || '';
            break;
          case 'buyer_name':
            const buyerName = [v1.buyerFirstName, v1.buyerLastName].filter(Boolean).join(' ');
            updatedField.content = buyerName || '';
            break;
          case 'buyer_address':
            updatedField.content = v1.buyerAddress || '';
            break;
          case 'buyer_phone':
            updatedField.content = v1.buyerPhone || '';
            break;
          case 'sale_price':
            updatedField.content = v1.salePrice || '';
            break;
          case 'sale_date':
            updatedField.content = v1.saleDate || '';
            break;
          case 'date':
            updatedField.content = v1.saleDate || '';
            break;
        }
        return updatedField;
      });
    }

    // Only prefill Vehicle 2 in trip mode and when explicitly selected
    if (v2) {
      console.log('Pre-filling Vehicle 2 data:', v2);
      setVehicleData2(v2);
      
      // Check if Vehicle 2 fields exist
      const hasVehicle2Fields = normalizedFields.some(field => 
        field.fieldType.endsWith('_2')
      );
      
      if (!hasVehicle2Fields) {
        console.log('No Vehicle 2 fields found, automatically adding them...');
        const vehicle2Fields = addVehicle2FieldsAutomatically(normalizedFields, v2);
        normalizedFields = [...normalizedFields, ...vehicle2Fields];
        console.log('Added', vehicle2Fields.length, 'Vehicle 2 fields automatically');
      } else {
        // Pre-fill existing Vehicle 2 fields with compatibility mapping
        normalizedFields = normalizedFields.map(field => {
          const updatedField = { ...field };
          
          // Try exact fieldType match first, then compatibility patterns
          let vehicle2FieldType = field.fieldType;
          if (!vehicle2FieldType.endsWith('_2')) {
            // Handle compatibility patterns like "VIN (Vehicle 2)", "Vehicle 2 VIN", etc.
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
              updatedField.content = v2.vehicleId || '';
              console.log(`Filled ${field.label} with VIN:`, v2.vehicleId);
              break;
            case 'year_2':
              updatedField.content = v2.year || '';
              console.log(`Filled ${field.label} with year:`, v2.year);
              break;
            case 'make_2':
              updatedField.content = convertMakeToDMVCode(v2.make || '');
              console.log(`Filled ${field.label} with make:`, v2.make);
              break;
            case 'model_2':
              updatedField.content = v2.model || '';
              console.log(`Filled ${field.label} with model:`, v2.model);
              break;
            case 'license_plate_2':
              updatedField.content = v2.licensePlate || '';
              console.log(`Filled ${field.label} with license plate:`, v2.licensePlate);
              break;
            case 'mileage_2':
              updatedField.content = v2.mileage || '';
              console.log(`Filled ${field.label} with mileage:`, v2.mileage);
              break;
            case 'price_2':
              updatedField.content = v2.salePrice || '';
              console.log(`Filled ${field.label} with price:`, v2.salePrice);
              break;
            case 'date_2':
              updatedField.content = v2.saleDate || '';
              console.log(`Filled ${field.label} with date:`, v2.saleDate);
              break;
          }
          return updatedField;
        });
      }
    } else if (!v2) {
      // Clear Vehicle 2 data when not in trip mode or no Vehicle 2 selected
      setVehicleData2(null);
      normalizedFields = normalizedFields.map(field =>
        (field.fieldType.endsWith('_2') || (field.label && field.label.includes('Vehicle 2'))) ? { ...field, content: '' } : field
      );
    }
    
    return normalizedFields;
  };

  useEffect(() => {
    const initializeEditor = async () => {
      // Check for PYP trip mode first
      const currentTripKey = localStorage.getItem('current-pyp-trip');
      const autoPrint = localStorage.getItem('auto-print-trip');
      
      if (currentTripKey) {
        console.log('Loading PYP trip:', currentTripKey);
        setIsInTripMode(true);
        
        // Clear any stale global vehicle data to avoid cross-trip contamination
        localStorage.removeItem('pyp-vehicle-data-1');
        localStorage.removeItem('pyp-vehicle-data-2');
        
        const tripData = localStorage.getItem(currentTripKey);
        if (tripData) {
          const parsedTripData = JSON.parse(tripData);
          setCurrentTripData(parsedTripData);
          
          // Load vehicles from trip data
          if (parsedTripData.vehicle1) {
            setVehicleData1(parsedTripData.vehicle1);
            localStorage.setItem('pyp-vehicle-data-1', JSON.stringify(parsedTripData.vehicle1));
          }
          if (parsedTripData.vehicle2) {
            setVehicleData2(parsedTripData.vehicle2);
            localStorage.setItem('pyp-vehicle-data-2', JSON.stringify(parsedTripData.vehicle2));
          }
        }
        
        // Clean up navigation data
        localStorage.removeItem('current-pyp-trip');
        if (autoPrint) {
          localStorage.removeItem('auto-print-trip');
        }
      }
      
      await loadTemplates();
      await loadUploadedDocuments();
      await loadDefaultTemplate();
      
      // Auto print if requested
      if (autoPrint && currentTripKey) {
        setTimeout(() => {
          handlePrint();
        }, 1000);
      }
    };
    
    initializeEditor();
  }, []);

  // Update document URL when document type changes
  useEffect(() => {
    const imageUrl = documentTypeImages[currentDocumentType];
    if (imageUrl) {
      setCurrentDocumentUrl(imageUrl);
    } else {
      // Use default image for bill of sale or empty for others
      setCurrentDocumentUrl(currentDocumentType === 'bill_of_sale' ? dmvFormImage : '');
    }
  }, [currentDocumentType, documentTypeImages]);

  // Live update Vehicle 2 fields when vehicleData2 changes
  useEffect(() => {
    if (fields.length === 0) return; // Don't run during initial load
    
    console.log('vehicleData2 changed:', vehicleData2);
    
    setFields(currentFields => {
      let updatedFields = [...currentFields];
      
      if (vehicleData2) {
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
                updatedField.content = convertMakeToDMVCode(vehicleData2.make || '');
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
        
        toast.success('Vehicle 2 data loaded and pre-filled');
      } else if (!vehicleData2) {
        // Vehicle 2 was removed - clear all Vehicle 2 fields
        console.log('Clearing Vehicle 2 fields...');
        updatedFields = updatedFields.map(field =>
          (field.fieldType.endsWith('_2') || (field.label && field.label.includes('Vehicle 2'))) ? { ...field, content: '' } : field
        );
      }
      
      return updatedFields;
    });
  }, [vehicleData2, isInTripMode]);

  const loadDefaultTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('pyp_document_templates')
        .select('*, pyp_template_fields(*)')
        .eq('is_default', true)
        .single();

      if (!error && data) {
        console.log('Loading default PYP template from database:', data);
        
        // Convert database fields to TextField format
        const templateFields: TextField[] = data.pyp_template_fields.map((field: any) => ({
          id: field.id,
          x: field.x_position,
          y: field.y_position,
          width: field.width,
          height: field.height,
          content: '',
          label: field.label,
          fontSize: field.font_size || 14,
          fieldType: field.field_type
        }));
        
        // Normalize and prefill all fields
        const normalizedFields = normalizeAndPrefillFields(templateFields);
        
        setFields(normalizedFields);
        setCurrentDocumentUrl(data.document_url);
        setTemplateName(data.name);
        console.log('Loaded default PYP template from database with', normalizedFields.length, 'fields');
        
        // Show success message based on vehicles loaded
        setTimeout(() => {
          const v1Str = localStorage.getItem('pyp-vehicle-data-1');
          const v2Str = localStorage.getItem('pyp-vehicle-data-2');
          const hasV1 = !!v1Str;
          const hasV2 = !!v2Str && isInTripMode;
          
          if (hasV1 && hasV2) {
            toast.success("Both vehicles loaded - form fields have been pre-filled");
          } else if (hasV1) {
            toast.success("Vehicle 1 data loaded - form fields have been pre-filled");
          } else if (hasV2) {
            toast.success("Vehicle 2 data loaded - form fields have been pre-filled");
          }
        }, 100);
        
        return;
      }
    } catch (error) {
      console.error('Error loading default template from database:', error);
    }

    // Fallback: check localStorage for "pypdefault" template
    const saved = localStorage.getItem('pyp-document-templates');
    if (saved) {
      const parsedTemplates = JSON.parse(saved);
      const defaultTemplate = parsedTemplates.find((t: any) => t.name === 'pypdefault');
      
      if (defaultTemplate) {
        console.log('Loading pypdefault template from localStorage:', defaultTemplate);
        let templateFields = [...(defaultTemplate.fields || [])];
        
        // Apply the same normalization and prefill logic for localStorage fallback
        templateFields = normalizeAndPrefillFields(templateFields);
        
        setFields(templateFields);
        setCurrentDocumentUrl(defaultTemplate.imageUrl);
        setTemplateName('pypdefault');
        console.log('Loaded pypdefault template from localStorage with', templateFields.length, 'fields');
        return;
      }
    }
    
    // Final fallback: if no "pypdefault" template found, start with empty form
    setCurrentDocumentUrl(dmvFormImage);
    setFields([]);
    setTemplateName('pypdefault');
    console.log('No pypdefault template found, starting with empty form');
  };

  // Navigation helper functions
  const handleGoBackToInventory = () => {
    // Store current template data before navigating
    const currentTemplateData = {
      templateName,
      fields,
      currentDocumentUrl,
      vehicleData1,
      vehicleData2
    };
    localStorage.setItem('pyp-current-template', JSON.stringify(currentTemplateData));
    
    // Determine which vehicle slot to fill next
    if (!vehicleData1) {
      setCurrentVehicleSlot(1);
      localStorage.setItem('pyp-next-vehicle-slot', '1');
    } else if (!vehicleData2) {
      setCurrentVehicleSlot(2);
      localStorage.setItem('pyp-next-vehicle-slot', '2');
    }
    
    // Navigate back to inventory using the proper navigation function
    if (onNavigate) {
      onNavigate('inventory');
      toast.success('Returning to Vehicle Inventory - select a vehicle to add to the template');
    } else {
      // Fallback to window location if onNavigate is not available
      window.location.href = '/';
      toast.success('Returning to Vehicle Inventory - select a vehicle to add to the template');
    }
  };

  const handleContinueWithOneVehicle = () => {
    toast.success('Continuing with single vehicle template');
  };

  const loadTemplates = async () => {
    console.log('Loading templates from both localStorage and Supabase...');
    
    // Load from localStorage first
    const localTemplates: DocumentTemplate[] = [];
    const saved = localStorage.getItem('pyp-document-templates');
    if (saved) {
      try {
        const parsedTemplates = JSON.parse(saved);
        const templatesWithDates = parsedTemplates.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          documentType: t.documentType || 'bill_of_sale' // Default for existing templates without documentType
        }));
        localTemplates.push(...templatesWithDates);
      } catch (error) {
        console.error('Error parsing localStorage templates:', error);
      }
    }

    // Load from Supabase database
    const supabaseTemplates: DocumentTemplate[] = [];
    try {
      const { data, error } = await supabase
        .from('pyp_document_templates')
        .select('*, pyp_template_fields(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading templates from Supabase:', error);
      } else if (data) {
        // Convert database templates to DocumentTemplate format
        for (const template of data) {
          const templateFields: TextField[] = template.pyp_template_fields.map((field: any) => ({
            id: field.id,
            x: field.x_position,
            y: field.y_position,
            width: field.width,
            height: field.height,
            content: '',
            label: field.label,
            fontSize: field.font_size || 14,
            fieldType: field.field_type
          }));

          supabaseTemplates.push({
            id: template.id,
            name: template.name,
            imageUrl: template.document_url,
            fields: templateFields,
            createdAt: new Date(template.created_at),
            updatedAt: new Date(template.updated_at),
            documentType: 'bill_of_sale' // Default for existing templates
          });
        }
      }
    } catch (error) {
      console.error('Error accessing Supabase:', error);
    }

    // Merge templates (Supabase takes precedence for duplicates by name)
    const allTemplates = [...localTemplates];
    supabaseTemplates.forEach(supabaseTemplate => {
      const existsLocally = localTemplates.some(local => local.name === supabaseTemplate.name);
      if (!existsLocally) {
        allTemplates.push(supabaseTemplate);
      }
    });

    setTemplates(allTemplates);
    console.log(`Templates loaded: ${localTemplates.length} from localStorage, ${supabaseTemplates.length} from Supabase`);
  };

  const loadUploadedDocuments = async () => {
    try {
      // First get all folders in pyp-templates
      const { data: folders, error: foldersError } = await supabase.storage
        .from('documents')
        .list('pyp-templates/', {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (foldersError) {
        console.error('Error loading document folders:', foldersError);
        return;
      }

      const allDocuments: UploadedDocument[] = [];
      
      // Load files from each subfolder
      for (const folder of folders) {
        if (folder.name && folder.metadata === null) { // It's a folder
          try {
            const { data: files, error: filesError } = await supabase.storage
              .from('documents')
              .list(`pyp-templates/${folder.name}/`, {
                limit: 100,
                sortBy: { column: 'created_at', order: 'desc' }
              });

            if (filesError) {
              console.error(`Error loading files from ${folder.name}:`, filesError);
              continue;
            }

            const folderDocuments: UploadedDocument[] = files
              .filter(file => file.metadata !== null) // Only actual files, not folders
              .map(file => ({
                id: file.id,
                name: file.name,
                url: supabase.storage.from('documents').getPublicUrl(`pyp-templates/${folder.name}/${file.name}`).data.publicUrl,
                uploadedAt: new Date(file.created_at),
                folder: folder.name
              }));

            allDocuments.push(...folderDocuments);
          } catch (error) {
            console.error(`Error processing folder ${folder.name}:`, error);
          }
        }
      }

      // Also check for files directly in pyp-templates root
      const rootFiles = folders.filter(item => item.metadata !== null);
      const rootDocuments: UploadedDocument[] = rootFiles.map(file => ({
        id: file.id,
        name: file.name,
        url: supabase.storage.from('documents').getPublicUrl(`pyp-templates/${file.name}`).data.publicUrl,
        uploadedAt: new Date(file.created_at)
      }));

      allDocuments.push(...rootDocuments);

      console.log(`Loaded ${allDocuments.length} documents from PYP templates folders`);
      setUploadedDocuments(allDocuments);
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

  // Get default template name for document type
  const getDefaultTemplateName = (docType: DocumentType): string => {
    const names = {
      bill_of_sale: 'Bill of Sale Template',
      statement_of_fax1: 'Statement of Fax 1 Template',
      statement_of_fax2: 'Statement of Fax 2 Template',
      statement_of_erasure: 'Statement of Erasure Template'
    };
    return names[docType];
  };

  // Handle document type specific image uploads
  const handleDocumentTypeImageUpload = async (event: any, docType: DocumentType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Please select a PNG, JPEG, or WebP image file');
      return;
    }

    setIsUploading(true);
    try {
      const optimizedFile = await optimizeImage(file);
      const fileName = `${docType}_template_${Date.now()}.jpg`;
      const filePath = `pyp-templates/${docType}/${fileName}`;

      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, optimizedFile);

      if (error) throw error;

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const newUrl = data.publicUrl;
      setDocumentTypeImages(prev => ({
        ...prev,
        [docType]: newUrl
      }));
      
      setCurrentDocumentUrl(newUrl);
      toast.success(`${docType.replace(/_/g, ' ')} image uploaded successfully!`);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
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
      const fileName = `pyp-document-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`pyp-templates/${fileName}`, optimizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const publicUrl = supabase.storage
        .from('documents')
        .getPublicUrl(`pyp-templates/${fileName}`)
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

  const saveTrip = () => {
    if (!isInTripMode || !currentTripData) {
      toast.error('Not in trip mode');
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const tripNumber = getCurrentTripNumber();
    const tripKey = `pyp-trip-${today}-${tripNumber}`;
    
    const tripDataToSave = {
      ...currentTripData,
      vehicle1: vehicleData1,
      vehicle2: vehicleData2,
      savedAt: new Date().toISOString(),
      templateFields: fields
    };
    
    localStorage.setItem(tripKey, JSON.stringify(tripDataToSave));
    
    toast.success(`Trip ${tripNumber} saved successfully`);
  };

  const saveTripAndPrint = () => {
    saveTrip();
    setTimeout(() => {
      handlePrint();
    }, 500);
  };

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
        content: convertMakeToDMVCode(vehicleData.make || ''),
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
        id: `mileage_2_${Date.now() + 5}`,
        x: rightColumnX,
        y: startY + 80,
        width: 100,
        height: 30,
        content: vehicleData.mileage || '',
        label: 'Mileage (Vehicle 2)',
        fontSize: 14,
        fieldType: 'mileage_2'
      },
      {
        id: `price_2_${Date.now() + 6}`,
        x: leftColumnX,
        y: startY + 120,
        width: 120,
        height: 30,
        content: vehicleData.salePrice || '',
        label: 'Price (Vehicle 2)',
        fontSize: 14,
        fieldType: 'price_2'
      },
      {
        id: `date_2_${Date.now() + 7}`,
        x: rightColumnX,
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

  const getCurrentTripNumber = () => {
    // Extract trip number from localStorage or context
    const currentTripKey = localStorage.getItem('current-pyp-trip') || '';
    const matches = currentTripKey.match(/pyp-trip-\d{4}-\d{2}-\d{2}-(\d+)/);
    return matches ? parseInt(matches[1]) : 1;
  };

  const saveTemplate = async () => {
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

    // Show saving feedback
    const savingToast = toast.loading('Saving template to database...');

    try {
      // Strip vehicle contents from fields before saving to avoid baking stale data
      const knownVehicleFieldTypes = [
        'vin', 'year', 'make', 'model', 'license_plate', 'mileage', 'price', 'date', 
        'seller_name', 'seller_address', 'seller_phone', 'buyer_name', 'buyer_address', 
        'buyer_phone', 'sale_price', 'sale_date',
        'vin_2', 'year_2', 'make_2', 'model_2', 'license_plate_2', 'mileage_2', 'price_2', 'date_2'
      ];
      
      const cleanedFields = fields.map(field => {
        if (knownVehicleFieldTypes.includes(field.fieldType) || 
            (field.label && field.label.includes('Vehicle'))) {
          // Find the predefined field to get its placeholder, or use empty string
          const predefinedField = predefinedFields.find(pf => pf.id === field.fieldType);
          return { ...field, content: predefinedField?.placeholder || '' };
        }
        return field;
      });
      
      // Save to Supabase database
      const { data: templateData, error: templateError } = await supabase
        .from('pyp_document_templates')
        .insert({
          name: templateName.trim(),
          document_url: currentDocumentUrl,
          is_default: templateName.trim() === 'pypdefault'
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Save fields to database
      const fieldsToInsert = cleanedFields.map(field => ({
        template_id: templateData.id,
        field_type: field.fieldType,
        label: field.label,
        x_position: field.x,
        y_position: field.y,
        width: field.width,
        height: field.height,
        font_size: field.fontSize
      }));

      const { error: fieldsError } = await supabase
        .from('pyp_template_fields')
        .insert(fieldsToInsert);

      if (fieldsError) throw fieldsError;

      // Also save to localStorage as backup for fast loading
      const template: DocumentTemplate = {
        id: templateData.id,
        name: templateName.trim(),
        imageUrl: currentDocumentUrl,
        fields: cleanedFields,
        createdAt: new Date(),
        updatedAt: new Date(),
        documentType: currentDocumentType
      };

      const updatedTemplates = [...templates, template];
      setTemplates(updatedTemplates);
      localStorage.setItem('pyp-document-templates', JSON.stringify(updatedTemplates));
      
      console.log('Template saved successfully to both Supabase and localStorage');
      console.log('Updated templates list:', updatedTemplates);
      
      toast.dismiss(savingToast);
      toast.success(`Template "${templateName}" saved successfully with ${fields.length} fields!`);
      
      // Reset the template name for next save
      setTemplateName('');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.dismiss(savingToast);
      toast.error('Failed to save template to database. Please try again.');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    const templateToDelete = templates.find(t => t.id === templateId);
    if (!templateToDelete) return;

    if (window.confirm(`Are you sure you want to delete the template "${templateToDelete.name}"?`)) {
      const deletingToast = toast.loading('Deleting template...');
      
      try {
        // Delete from Supabase database
        const { error: deleteError } = await supabase
          .from('pyp_document_templates')
          .delete()
          .eq('id', templateId);

        if (deleteError) {
          console.error('Error deleting from Supabase:', deleteError);
          // Continue with local deletion even if Supabase fails
        }

        // Delete from local state and localStorage
        const updatedTemplates = templates.filter(t => t.id !== templateId);
        setTemplates(updatedTemplates);
        localStorage.setItem('pyp-document-templates', JSON.stringify(updatedTemplates));
        
        toast.dismiss(deletingToast);
        toast.success(`Template "${templateToDelete.name}" deleted successfully!`);
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.dismiss(deletingToast);
        toast.error('Failed to delete template. Please try again.');
      }
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

  const deleteUploadedDocument = async (docId: string, filePath: string) => {
    const fileName = filePath.includes('/') ? filePath.split('/').pop() : filePath;
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        const { error } = await supabase.storage
          .from('documents')
          .remove([`pyp-templates/${filePath}`]);

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
            * { box-sizing: border-box; }
            body { 
              margin: 0; 
              padding: 0; 
              font-family: Arial, sans-serif; 
              background: white;
            }
            .document-container { 
              position: relative; 
              width: 8.5in; 
              height: 11in; 
              margin: 0 auto;
              border: 1px solid #ccc;
              background: white;
            }
            .document-bg { 
              width: 100%; 
              height: 100%; 
              object-fit: fill;
              position: absolute;
              top: 0;
              left: 0;
            }
            .text-field { 
              position: absolute; 
              background: transparent; 
              border: none; 
              font-family: Arial, sans-serif;
              color: black;
              font-weight: bold;
              z-index: 10;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
            }
            @media print { 
              body { margin: 0; padding: 0; }
              .document-container { 
                width: 8.5in; 
                height: 11in;
                border: none;
                margin: 0;
              }
              .document-bg {
                width: 100%;
                height: 100%;
              }
              .text-field {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            <img src="${currentDocumentUrl}" alt="Document" class="document-bg" onload="window.print()" />
            ${fields.map(field => `
              <div class="text-field" style="
                left: ${field.x}px;
                top: ${field.y}px;
                width: ${field.width}px;
                height: ${field.height}px;
                font-size: ${field.fontSize}px;
              ">${field.content || ''}</div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PYP Document Editor</h1>
          <p className="text-muted-foreground">
            Create and manage Pick Your Part document templates. Add and position text fields on your document template.
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
          {isInTripMode && (
            <>
              <Button onClick={saveTrip} variant="outline" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Trip
              </Button>
              <Button onClick={saveTripAndPrint} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                <Printer className="h-4 w-4 ml-1" />
                Save & Print
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dual Vehicle Management Controls */}
      {(templateName === 'pypdefault' || isInTripMode) && (
        <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Pick Your Part - Dual Vehicle Template</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Vehicle 1:</span>
                  <span className={`text-sm font-medium ${vehicleData1 ? 'text-green-600' : 'text-gray-500'}`}>
                    {vehicleData1 ? `${vehicleData1.year} ${convertMakeToDMVCode(vehicleData1.make)} ${vehicleData1.model}` : 'Not loaded'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">Vehicle 2:</span>
                  <span className={`text-sm font-medium ${vehicleData2 ? 'text-green-600' : 'text-gray-500'}`}>
                    {vehicleData2 ? `${vehicleData2.year} ${convertMakeToDMVCode(vehicleData2.make)} ${vehicleData2.model}` : 'Not loaded'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!vehicleData2 && (
                <Button 
                  onClick={handleGoBackToInventory}
                  variant="outline"
                  size="sm"
                  className="bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                >
                  Add Second Vehicle
                </Button>
              )}
              <Button 
                onClick={handleContinueWithOneVehicle}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
              >
                Continue with One Vehicle
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="col-span-1 space-y-4">
          {/* Document Type Selector */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Type
            </h3>
            <div className="space-y-3">
              <select
                value={currentDocumentType}
                onChange={(e) => {
                  const newType = e.target.value as DocumentType;
                  setCurrentDocumentType(newType);
                  setCurrentDocumentUrl(documentTypeImages[newType] || dmvFormImage);
                  setFields([]); // Clear fields when switching document types
                  setTemplateName(getDefaultTemplateName(newType));
                }}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="bill_of_sale">Bill of Sale</option>
                <option value="statement_of_fax1">Statement of Fax 1</option>
                <option value="statement_of_fax2">Statement of Fax 2</option>
                <option value="statement_of_erasure">Statement of Erasure</option>
              </select>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Document Image</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => handleDocumentTypeImageUpload(e, currentDocumentType);
                    input.click();
                  }}
                  className="w-full justify-start"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image for {currentDocumentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
                {documentTypeImages[currentDocumentType] && (
                  <p className="text-xs text-green-600">✓ Image uploaded</p>
                )}
              </div>
            </div>
          </Card>

          {/* Field Library */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Type className="h-4 w-4" />
              Field Library
            </h3>
            
            {/* Vehicle 1 Fields */}
            <div className="mb-6">
              <h4 className="font-medium text-sm mb-3 text-blue-600">Vehicle 1 Fields</h4>
              <div className="grid grid-cols-1 gap-2">
                {predefinedFieldsVehicle1.map((fieldType) => (
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
            </div>

            {/* Vehicle 2 Fields */}
            <div>
              <h4 className="font-medium text-sm mb-3 text-blue-400">Vehicle 2 Fields</h4>
              <div className="grid grid-cols-1 gap-2">
                {predefinedFieldsVehicle2.map((fieldType) => (
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
          {templates.filter(t => t.documentType === currentDocumentType).length > 0 && (
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">
                  Saved Templates ({currentDocumentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})
                </h3>
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
                {templates
                  .filter(t => t.documentType === currentDocumentType)
                  .map((template) => (
                  <div key={template.id} className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Loading template:', template.name, 'with imageUrl:', template.imageUrl);
                        setFields(template.fields);
                        setCurrentDocumentUrl(template.imageUrl);
                        setTemplateName(template.name);
                        setCurrentDocumentType(template.documentType);
                        setDocumentTypeImages(prev => ({
                          ...prev,
                          [template.documentType]: template.imageUrl
                        }));
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
                      <div className="flex flex-col items-start">
                        <span>{doc.name}</span>
                        {doc.folder && (
                          <span className="text-xs text-muted-foreground">
                            {doc.folder.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        )}
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteUploadedDocument(doc.id, doc.folder ? `${doc.folder}/${doc.name}` : doc.name)}
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

export default PYPDocumentEditor;