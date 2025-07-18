
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { PrintDocumentManager } from "@/components/PrintDocumentManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Print() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Print Center</h1>
      </div>
      
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">Document Manager</TabsTrigger>
          <TabsTrigger value="qr">QR Codes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents" className="space-y-6">
          <PrintDocumentManager />
        </TabsContent>
        
        <TabsContent value="qr" className="space-y-6">
          <QRCodeDisplay />
        </TabsContent>
      </Tabs>
    </div>
  );
}
