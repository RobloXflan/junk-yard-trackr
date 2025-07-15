import { Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

      <Card>
        <CardHeader>
          <CardTitle>Appointment System</CardTitle>
          <CardDescription>
            Schedule and manage customer appointments for vehicle inspections, pickups, and consultations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              The appointment system is currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}