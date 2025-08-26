import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PYPDocumentsProps {
  onNavigate?: (page: string) => void;
}

export function PYPDocuments({ onNavigate }: PYPDocumentsProps) {
  // Basic SEO
  useEffect(() => {
    document.title = "PYP Documents | Editor";
    const ensureMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    };
    ensureMeta("description", "Pick Your Part document editor for creating and printing documents.");
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${window.location.origin}/pyp-documents`;
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PYP Documents</h1>
          <p className="text-muted-foreground">Pick Your Part document management</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Construction className="w-20 h-20 text-muted-foreground mb-6" />
          <h3 className="text-2xl font-semibold mb-4">Working on it!</h3>
          <p className="text-muted-foreground text-center max-w-md text-lg">
            This feature is currently under development. Check back soon for Pick Your Part document management functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PYPDocuments;
