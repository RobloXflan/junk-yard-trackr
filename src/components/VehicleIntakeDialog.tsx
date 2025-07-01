
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VehicleIntakeForm } from "./VehicleIntakeForm";

interface VehicleIntakeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VehicleIntakeDialog({ isOpen, onClose, onSuccess }: VehicleIntakeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>
        <VehicleIntakeForm onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
