
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

interface DocumentStatusProps {
  formData: {
    paperwork: string;
    paperworkOther: string;
  };
  onInputChange: (field: string, value: any) => void;
}

export function DocumentStatus({ formData, onInputChange }: DocumentStatusProps) {
  const paperworkOptions = [
    { value: "title", label: "Title" },
    { value: "registered-owner", label: "Registered Owner" },
    { value: "lien-sale", label: "Lien Sale" },
    { value: "no-paperwork", label: "No Paperwork" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-foreground font-medium">Paperwork</Label>
        <RadioGroup
          value={formData.paperwork}
          onValueChange={(value) => onInputChange("paperwork", value)}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {paperworkOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2 p-3 border border-border rounded-lg">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="text-foreground font-normal cursor-pointer flex-1">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {formData.paperwork === "other" && (
        <div className="space-y-2">
          <Label htmlFor="paperworkOther" className="text-foreground font-medium">
            Please specify other paperwork
          </Label>
          <Input
            id="paperworkOther"
            placeholder="Describe the paperwork..."
            value={formData.paperworkOther}
            onChange={(e) => onInputChange("paperworkOther", e.target.value)}
            className="border-border focus:border-primary text-foreground"
          />
        </div>
      )}
    </div>
  );
}
