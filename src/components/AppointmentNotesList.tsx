import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Phone, DollarSign, Copy, User, MapPin, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AppointmentNote {
  id: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  estimated_price: number | null;
  notes: string | null;
  appointment_booked: boolean | null;
  telegram_sent: boolean | null;
  created_at: string;
  assigned_worker_id: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  paperwork: string | null;
  workers?: {
    name: string;
  };
}

interface AppointmentNotesListProps {
  filter: 'saved' | 'pending';
}

export function AppointmentNotesList({ filter }: AppointmentNotesListProps) {
  const [notes, setNotes] = useState<AppointmentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotes = async () => {
    try {
      let query = supabase
        .from("appointment_notes")
        .select(`
          *,
          workers:assigned_worker_id (
            name
          )
        `);

      // Apply filter based on type
      if (filter === 'saved') {
        // Saved notes: not sent to telegram
        query = query.eq('telegram_sent', false);
      } else if (filter === 'pending') {
        // Pending appointments: sent to telegram
        query = query.eq('telegram_sent', true);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setNotes((data || []) as AppointmentNote[]);
    } catch (error) {
      console.error("Error fetching appointment notes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch appointment notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from("appointment_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setNotes(notes.filter(note => note.id !== id));
      toast({
        title: "Success",
        description: "Appointment note deleted",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete appointment note",
        variant: "destructive",
      });
    }
  };

  const copyAppointmentMessage = async (note: AppointmentNote) => {
    const vehicle = note.vehicle_year && note.vehicle_make && note.vehicle_model 
      ? `${note.vehicle_year} ${note.vehicle_make} ${note.vehicle_model}` 
      : "Vehicle Info Incomplete";
    
    const price = note.estimated_price ? `$${note.estimated_price.toLocaleString()}` : "Price not set";
    
    const phone = note.customer_phone ? `📞 Phone: ${note.customer_phone}` : "";
    const address = note.customer_address ? `📍 Address: ${note.customer_address}` : "";
    const paperwork = note.paperwork ? `📄 Paperwork: ${note.paperwork}` : "";
    
    const contactInfo = [phone, address, paperwork].filter(Boolean).join("\n");
    
    const message = `🚗 ${vehicle}
💰 ${price}
${contactInfo ? `\n${contactInfo}` : ""}
${note.notes ? `\n📝 ${note.notes}` : ""}`;

    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Copied!",
        description: "Appointment details copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading appointment notes...</div>;
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No appointment notes saved yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {note.vehicle_year && note.vehicle_make && note.vehicle_model ? 
                  `${note.vehicle_year} ${note.vehicle_make} ${note.vehicle_model}` : 
                  "Vehicle Info Incomplete"
                }
              </CardTitle>
              <div className="flex items-center gap-2">
                {note.workers?.name && (
                  <Badge variant="default">
                    <User className="w-3 h-3 mr-1" />
                    Driver: {note.workers.name}
                  </Badge>
                )}
                {note.appointment_booked && (
                  <Badge variant="secondary">
                    <Calendar className="w-3 h-3 mr-1" />
                    Appointment Booked
                  </Badge>
                )}
                {note.telegram_sent && (
                  <Badge variant="outline">
                    <Phone className="w-3 h-3 mr-1" />
                    Sent to Telegram
                  </Badge>
                )}
                {filter === 'pending' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyAppointmentMessage(note)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNote(note.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price Section */}
            {note.estimated_price && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">${note.estimated_price.toLocaleString()}</span>
              </div>
            )}

            {/* Customer Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {note.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{note.customer_phone}</span>
                </div>
              )}
              {note.customer_address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{note.customer_address}</span>
                </div>
              )}
              {note.paperwork && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{note.paperwork}</span>
                </div>
              )}
            </div>

            {/* Notes Section */}
            {note.notes && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{note.notes}</p>
              </div>
            )}

            {/* Created Date */}
            <div className="text-xs text-muted-foreground">
              Created: {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}