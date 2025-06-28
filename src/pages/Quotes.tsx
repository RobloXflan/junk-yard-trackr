
import React from 'react';
import { VehiclePricingTool } from "@/components/VehiclePricingTool";
import { SavedQuotesList } from "@/components/SavedQuotesList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Quotes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vehicle Quotes</h1>
      </div>
      
      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pricing">Pricing Tool</TabsTrigger>
          <TabsTrigger value="saved">Saved Quotes</TabsTrigger>
        </TabsList>
        <TabsContent value="pricing" className="space-y-4">
          <VehiclePricingTool />
        </TabsContent>
        <TabsContent value="saved" className="space-y-4">
          <SavedQuotesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
