import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, Phone, DollarSign } from "lucide-react";
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
        .select("*");

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
      setNotes(data || []);
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
          <CardContent className="space-y-3">
            {note.estimated_price && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">${note.estimated_price.toLocaleString()}</span>
              </div>
            )}
            {note.notes && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{note.notes}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Created: {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}