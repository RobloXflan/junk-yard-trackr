
import React from 'react';
import { VehiclePricingTool } from "@/components/VehiclePricingTool";

export function Quotes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vehicle Quotes</h1>
      </div>
      
      <VehiclePricingTool />
    </div>
  );
}
