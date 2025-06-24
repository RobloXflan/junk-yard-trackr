
import { FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Vehicle } from "@/stores/vehicleStore";

interface VehicleDocumentsProps {
  vehicle: Vehicle;
}

export function VehicleDocuments({ vehicle }: VehicleDocumentsProps) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground font-medium flex items-center">
        <FileText className="w-4 h-4 mr-2" />
        Documents
      </Label>
      <div className="p-2 border rounded-md bg-muted/20">
        {vehicle.documents && vehicle.documents.length > 0 ? (
          <ul className="space-y-1">
            {vehicle.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between">
                <span>{doc.name}</span>
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No documents uploaded</p>
        )}
      </div>
    </div>
  );
}
