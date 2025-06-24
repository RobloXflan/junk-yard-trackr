
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PdfUploadZone } from '@/components/pdf/PdfUploadZone';
import { PageGallery } from '@/components/pdf/PageGallery';
import { VehicleBatchManager } from '@/components/pdf/VehicleBatchManager';
import { usePdfBatches } from '@/hooks/usePdfBatches';

export default function Documents() {
  const { batches, currentBatch, loadBatches, createBatch } = usePdfBatches();
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Document Processing</h1>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList>
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="gallery">Page Gallery</TabsTrigger>
          <TabsTrigger value="batches">Vehicle Batches</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <PdfUploadZone onUploadComplete={createBatch} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4">
          {currentBatch && (
            <PageGallery
              batchId={currentBatch.id}
              selectedPages={selectedPages}
              onSelectionChange={setSelectedPages}
            />
          )}
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          <VehicleBatchManager
            selectedPages={selectedPages}
            onPagesAssigned={() => setSelectedPages([])}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
