import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Save, Phone, Car, DollarSign, FileText, MapPin, Mic } from "lucide-react";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { VehicleAutocomplete } from "./VehicleAutocomplete";
import VoiceAssistant from "./VoiceAssistant";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuotesStore } from "@/hooks/useQuotesStore";

interface AppointmentData {
  customer_phone: string;
  customer_address: string;
  vehicle_year: string;
  vehicle_make: string;
  vehicle_model: string;
  estimated_price: number | null;
  notes: string;
  appointment_booked: boolean;
  paperwork: string;
}

interface PriceEstimate {
  estimatedPrice: number;
  confidence: string;
  dataPoints: number;
}

interface VehicleData {
  year: string;
  make: string;
  model: string;
}

interface PrefillData {
  customer_phone: string;
  customer_address: string;
  vehicle_year: string;
  vehicle_make: string;
  vehicle_model: string;
  estimated_price: number | null;
  notes: string;
  paperwork: string;
}

interface AppointmentNotepadProps {
  vehicleData?: VehicleData;
  onVehicleDataChange?: (data: VehicleData) => void;
  prefillData?: PrefillData | null;
  onClearPrefill?: () => void;
}

export function AppointmentNotepad({ vehicleData, onVehicleDataChange, prefillData, onClearPrefill }: AppointmentNotepadProps) {
  const { toast } = useToast();
  const { quotes } = useQuotesStore();
  
  const [appointmentData, setAppointmentData] = useState<AppointmentData>({
    customer_phone: prefillData?.customer_phone || "",
    customer_address: prefillData?.customer_address || "",
    vehicle_year: prefillData?.vehicle_year || vehicleData?.year || "",
    vehicle_make: prefillData?.vehicle_make || vehicleData?.make || "",
    vehicle_model: prefillData?.vehicle_model || vehicleData?.model || "",
    estimated_price: prefillData?.estimated_price || null,
    notes: prefillData?.notes || "",
    appointment_booked: false,
    paperwork: prefillData?.paperwork || "",
  });

  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState<string | null>(null);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  // Update form when prefillData changes
  useEffect(() => {
    if (prefillData) {
      setAppointmentData({
        customer_phone: prefillData.customer_phone,
        customer_address: prefillData.customer_address,
        vehicle_year: prefillData.vehicle_year,
        vehicle_make: prefillData.vehicle_make,
        vehicle_model: prefillData.vehicle_model,
        estimated_price: prefillData.estimated_price,
        notes: prefillData.notes,
        appointment_booked: false,
        paperwork: prefillData.paperwork,
      });
    }
  }, [prefillData]);

  // Auto-calculate price when vehicle details change
  useEffect(() => {
    if (appointmentData.vehicle_year && appointmentData.vehicle_make && appointmentData.vehicle_model) {
      calculatePrice();
    } else {
      setPriceEstimate(null);
      setAppointmentData(prev => ({ ...prev, estimated_price: null }));
    }
  }, [appointmentData.vehicle_year, appointmentData.vehicle_make, appointmentData.vehicle_model]);

  const calculatePrice = () => {
    // Use existing quotes to estimate price
    const similarQuotes = quotes.filter(quote => {
      const yearMatch = quote.year === appointmentData.vehicle_year;
      const makeMatch = quote.make.toLowerCase() === appointmentData.vehicle_make.toLowerCase();
      const modelMatch = quote.model.toLowerCase() === appointmentData.vehicle_model.toLowerCase();
      
      return yearMatch && makeMatch && modelMatch;
    });

    if (similarQuotes.length > 0) {
      const avgPrice = similarQuotes.reduce((sum, quote) => sum + quote.adjustedOffer, 0) / similarQuotes.length;
      const estimate = {
        estimatedPrice: Math.round(avgPrice),
        confidence: similarQuotes.length >= 3 ? "High" : similarQuotes.length >= 2 ? "Medium" : "Low",
        dataPoints: similarQuotes.length
      };
      
      setPriceEstimate(estimate);
      setAppointmentData(prev => ({ ...prev, estimated_price: estimate.estimatedPrice }));
    } else {
      // Check for similar makes/years
      const similarMakeYear = quotes.filter(quote => {
        const yearMatch = quote.year === appointmentData.vehicle_year;
        const makeMatch = quote.make.toLowerCase() === appointmentData.vehicle_make.toLowerCase();
        return yearMatch && makeMatch;
      });

      if (similarMakeYear.length > 0) {
        const avgPrice = similarMakeYear.reduce((sum, quote) => sum + quote.adjustedOffer, 0) / similarMakeYear.length;
        const estimate = {
          estimatedPrice: Math.round(avgPrice * 0.9), // Slightly lower for different model
          confidence: "Low",
          dataPoints: similarMakeYear.length
        };
        
        setPriceEstimate(estimate);
        setAppointmentData(prev => ({ ...prev, estimated_price: estimate.estimatedPrice }));
      }
    }
  };

  const saveNotes = async (withAppointment: boolean = false) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('appointment_notes')
        .insert({
          ...appointmentData,
          appointment_booked: withAppointment
        })
        .select()
        .single();

      if (error) throw error;

      // Store the appointment ID for voice assistant
      if (data) {
        setCurrentAppointmentId(data.id);
      }

      if (withAppointment && data) {
        // Send to Telegram with the appointment ID
        await sendToTelegram(data.id);
      }

      toast({
        title: withAppointment ? "Appointment Sent!" : "Notes Saved",
        description: withAppointment ? "Appointment details sent to Telegram" : "Customer notes saved for future reference"
      });

      // Reset form
      setAppointmentData({
        customer_phone: "",
        customer_address: "",
        vehicle_year: "",
        vehicle_make: "",
        vehicle_model: "",
        estimated_price: null,
        notes: "",
        appointment_booked: false,
        paperwork: "",
      });
      setPriceEstimate(null);
      onClearPrefill?.();

    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendToTelegram = async (appointmentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-telegram-appointment', {
        body: { appointmentData: { ...appointmentData, id: appointmentId, appointment_booked: true } }
      });

      if (error) throw error;

    } catch (error) {
      console.error('Error sending to Telegram:', error);
      // Don't throw - we still want to save the appointment
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "High": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleMakeChange = (newMake: string) => {
    setAppointmentData(prev => ({ 
      ...prev, 
      vehicle_make: newMake,
      vehicle_model: "" // Clear model when make changes
    }));
    onVehicleDataChange?.({
      year: appointmentData.vehicle_year,
      make: newMake,
      model: ""
    });
  };

  const handleVoiceDataExtracted = (extractedData: any[]) => {
    console.log('Voice data extracted:', extractedData);
    
    extractedData.forEach(item => {
      if (item.confidence_score < 0.6) return; // Only use high-confidence extractions
      
      switch (item.field_name) {
        case 'vehicle_year':
          setAppointmentData(prev => ({ ...prev, vehicle_year: item.extracted_value }));
          break;
        case 'vehicle_make':
          setAppointmentData(prev => ({ ...prev, vehicle_make: item.extracted_value }));
          break;
        case 'vehicle_model':
          setAppointmentData(prev => ({ ...prev, vehicle_model: item.extracted_value }));
          break;
        case 'customer_phone':
          setAppointmentData(prev => ({ ...prev, customer_phone: item.extracted_value }));
          break;
        case 'customer_address':
          setAppointmentData(prev => ({ ...prev, customer_address: item.extracted_value }));
          break;
        case 'offered_price':
          setAppointmentData(prev => ({ ...prev, estimated_price: parseFloat(item.extracted_value) || null }));
          break;
        case 'damage_notes':
        case 'vehicle_condition':
        case 'additional_notes':
          setAppointmentData(prev => ({ 
            ...prev, 
            notes: prev.notes ? `${prev.notes}\n${item.extracted_value}` : item.extracted_value 
          }));
          break;
        case 'title_present':
        case 'registration':
        case 'lien_paperwork':
        case 'junk_slip':
        case 'other_paperwork':
          setAppointmentData(prev => ({ 
            ...prev, 
            paperwork: prev.paperwork ? `${prev.paperwork}, ${item.field_name}: ${item.extracted_value}` : `${item.field_name}: ${item.extracted_value}`
          }));
          break;
      }
    });
    
    // Update vehicle data for parent component
    const yearData = extractedData.find(item => item.field_name === 'vehicle_year');
    const makeData = extractedData.find(item => item.field_name === 'vehicle_make');
    const modelData = extractedData.find(item => item.field_name === 'vehicle_model');
    
    if (yearData || makeData || modelData) {
      onVehicleDataChange?.({
        year: yearData?.extracted_value || appointmentData.vehicle_year,
        make: makeData?.extracted_value || appointmentData.vehicle_make,
        model: modelData?.extracted_value || appointmentData.vehicle_model
      });
    }
  };

  const clearForm = () => {
    setAppointmentData({
      customer_phone: "",
      customer_address: "",
      vehicle_year: "",
      vehicle_make: "",
      vehicle_model: "",
      estimated_price: null,
      notes: "",
      appointment_booked: false,
      paperwork: "",
    });
    setPriceEstimate(null);
    setCurrentAppointmentId(null);
    onClearPrefill?.();
    onVehicleDataChange?.({ year: "", make: "", model: "" });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Call Notepad
            {prefillData && (
              <Badge variant="secondary" className="ml-2">
                Editing Note
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVoiceAssistant(!showVoiceAssistant)}
              className="flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Voice Assistant
            </Button>
            {prefillData && (
              <Button variant="outline" size="sm" onClick={clearForm}>
                Clear Form
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Assistant */}
        {showVoiceAssistant && (
          <div className="p-4 border rounded-lg bg-blue-50">
            <VoiceAssistant 
              appointmentNoteId={currentAppointmentId}
              onDataExtracted={handleVoiceDataExtracted}
            />
          </div>
        )}
        {/* Vehicle Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="vehicle_year" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Year
            </Label>
            <Input
              id="vehicle_year"
              value={appointmentData.vehicle_year}
              onChange={(e) => {
                const newValue = e.target.value;
                setAppointmentData(prev => ({ ...prev, vehicle_year: newValue }));
                onVehicleDataChange?.({
                  year: newValue,
                  make: appointmentData.vehicle_make,
                  model: appointmentData.vehicle_model
                });
              }}
              placeholder="2020"
            />
          </div>
          <div>
            <Label htmlFor="vehicle_make" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Make
            </Label>
            <VehicleAutocomplete
              id="vehicle_make"
              type="make"
              value={appointmentData.vehicle_make}
              onChange={handleMakeChange}
              placeholder="Toyota"
              required
            />
          </div>
          <div>
            <Label htmlFor="vehicle_model" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Model
            </Label>
            <VehicleAutocomplete
              id="vehicle_model"
              type="model"
              value={appointmentData.vehicle_model}
              onChange={(newValue) => {
                setAppointmentData(prev => ({ ...prev, vehicle_model: newValue }));
                onVehicleDataChange?.({
                  year: appointmentData.vehicle_year,
                  make: appointmentData.vehicle_make,
                  model: newValue
                });
              }}
              placeholder="Camry"
              year={appointmentData.vehicle_year}
              make={appointmentData.vehicle_make}
              required
            />
          </div>
        </div>

        {/* Customer Information - Phone and Paperwork Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="customer_phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="customer_phone"
              value={appointmentData.customer_phone}
              onChange={(e) => setAppointmentData(prev => ({ ...prev, customer_phone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="paperwork" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Paperwork
            </Label>
            <Select
              value={appointmentData.paperwork}
              onValueChange={(value) => setAppointmentData(prev => ({ ...prev, paperwork: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select paperwork type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="salvage-title">Salvage Title</SelectItem>
                <SelectItem value="out-of-state-title">Out of State Title</SelectItem>
                <SelectItem value="registered-owner">Registered Owner</SelectItem>
                <SelectItem value="liensale">Liensale</SelectItem>
                <SelectItem value="junkslip">Junkslip</SelectItem>
                <SelectItem value="no-paperwork">No Paperwork</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customer Address - Full Width Row */}
        <div>
          <Label htmlFor="customer_address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Customer Address
          </Label>
          <AddressAutocomplete
            value={appointmentData.customer_address}
            onChange={(value) => setAppointmentData(prev => ({ ...prev, customer_address: value }))}
            placeholder="Start typing an address... (includes zip code validation)"
            className="w-full"
          />
        </div>

        {/* Price Estimate Display */}
        {priceEstimate && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-800">
                    Estimated Price: ${priceEstimate.estimatedPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getConfidenceColor(priceEstimate.confidence)}>
                    {priceEstimate.confidence} Confidence
                  </Badge>
                  <span className="text-sm text-blue-600">
                    {priceEstimate.dataPoints} data point{priceEstimate.dataPoints !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Price Override */}
        <div>
          <Label htmlFor="estimated_price">Quoted Price (Optional Override)</Label>
          <Input
            id="estimated_price"
            type="number"
            value={appointmentData.estimated_price || ""}
            onChange={(e) => setAppointmentData(prev => ({ 
              ...prev, 
              estimated_price: e.target.value ? Number(e.target.value) : null 
            }))}
            placeholder="Enter custom quote amount"
          />
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Call Notes</Label>
          <Textarea
            id="notes"
            value={appointmentData.notes}
            onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Type notes as you talk with the customer..."
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={() => saveNotes(true)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Appointment
          </Button>
          <Button
            variant="outline"
            onClick={() => saveNotes(false)}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Notes Only
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}