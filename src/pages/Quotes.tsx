
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Quotes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quotes</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Quotes section - coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
