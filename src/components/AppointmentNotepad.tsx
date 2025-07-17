import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Save, Phone, Car, DollarSign, FileText, MapPin } from "lucide-react";
import { AddressAutocomplete } from "./AddressAutocomplete";
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
          {prefillData && (
            <Button variant="outline" size="sm" onClick={clearForm}>
              Clear Form
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
            <Label htmlFor="vehicle_make">Make</Label>
            <Input
              id="vehicle_make"
              value={appointmentData.vehicle_make}
              onChange={(e) => {
                const newValue = e.target.value;
                setAppointmentData(prev => ({ ...prev, vehicle_make: newValue }));
                onVehicleDataChange?.({
                  year: appointmentData.vehicle_year,
                  make: newValue,
                  model: appointmentData.vehicle_model
                });
              }}
              placeholder="Toyota"
            />
          </div>
          <div>
            <Label htmlFor="vehicle_model">Model</Label>
            <Input
              id="vehicle_model"
              value={appointmentData.vehicle_model}
              onChange={(e) => {
                const newValue = e.target.value;
                setAppointmentData(prev => ({ ...prev, vehicle_model: newValue }));
                onVehicleDataChange?.({
                  year: appointmentData.vehicle_year,
                  make: appointmentData.vehicle_make,
                  model: newValue
                });
              }}
              placeholder="Camry"
            />
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-4">
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
              <Label htmlFor="customer_address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </Label>
              <AddressAutocomplete
                value={appointmentData.customer_address}
                onChange={(value) => setAppointmentData(prev => ({ ...prev, customer_address: value }))}
                placeholder="Start typing an address..."
              />
            </div>
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
                <SelectItem value="reg">Registration</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="license">License</SelectItem>
                <SelectItem value="junkslip">Junk Slip</SelectItem>
                <SelectItem value="no-paperwork">No Paperwork</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
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