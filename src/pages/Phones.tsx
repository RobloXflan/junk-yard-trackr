
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone } from "lucide-react";

export function Phones() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Smartphone className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Phones</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Phones Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This section is currently under development. Phone management features will be added here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
