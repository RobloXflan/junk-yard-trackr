import { Calendar } from "lucide-react";
import { AppointmentNotepad } from "@/components/AppointmentNotepad";

export function Appointments() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage and track appointments</p>
        </div>
      </div>

      <AppointmentNotepad />
    </div>
  );
}