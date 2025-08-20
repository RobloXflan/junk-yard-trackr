import { InteractiveDocumentEditor } from "@/components/InteractiveDocumentEditor";

interface DocumentsProps {
  onNavigate?: (page: string) => void;
}

export function Documents({ onNavigate }: DocumentsProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Document management for SA Recycling vehicles
          </p>
        </div>
      </div>

      <InteractiveDocumentEditor onNavigate={onNavigate} />
    </div>
  );
}