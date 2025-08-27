import { useEffect } from "react";
import { PYPDocumentEditor } from "@/components/PYPDocumentEditor";

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

      <PYPDocumentEditor onNavigate={onNavigate} />
    </div>
  );
}

export default PYPDocuments;
