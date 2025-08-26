import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function PYPTrips() {
  useEffect(() => {
    document.title = "PYP Trips | Pick Your Part Trip Management";
    const ensureMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = name;
        document.head.appendChild(tag);
      }
      tag.content = content;
    };
    ensureMeta("description", "Manage and view Pick Your Part trips and vehicle assignments for efficient operations.");
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pick Your Part Trips</h1>
          <p className="text-muted-foreground">
            Manage and view Pick Your Part trip documents
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Construction className="w-20 h-20 text-muted-foreground mb-6" />
          <h3 className="text-2xl font-semibold mb-4">Working on it!</h3>
          <p className="text-muted-foreground text-center max-w-md text-lg">
            This feature is currently under development. Check back soon for Pick Your Part trip management functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}