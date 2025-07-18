
import { QRCodeDisplay } from "@/components/QRCodeDisplay";

export function Print() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Print Center</h1>
      </div>
      
      <div className="grid gap-6">
        <QRCodeDisplay />
      </div>
    </div>
  );
}
