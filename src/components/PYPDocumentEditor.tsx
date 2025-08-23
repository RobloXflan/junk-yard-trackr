import { InteractiveDocumentEditor } from "@/components/InteractiveDocumentEditor";

interface PYPDocumentEditorProps {
  onNavigate?: (page: string) => void;
}

// Separate wrapper so future changes to PYP editor won't affect SA Recycling editor
export function PYPDocumentEditor({ onNavigate }: PYPDocumentEditorProps) {
  return <InteractiveDocumentEditor onNavigate={onNavigate} />;
}

export default PYPDocumentEditor;
