
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { pdfProcessingService } from '@/services/pdfProcessingService';

interface PdfUploadZoneProps {
  onUploadComplete: (batchId: string) => void;
}

export function PdfUploadZone({ onUploadComplete }: PdfUploadZoneProps) {
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF files only.",
        variant: "destructive",
      });
      return;
    }

    for (const file of pdfFiles) {
      try {
        toast({
          title: "Processing PDF",
          description: `Processing ${file.name}...`,
        });

        const batchId = await pdfProcessingService.processPdf(file);
        onUploadComplete(batchId);

        toast({
          title: "PDF processed successfully",
          description: `${file.name} has been processed and pages extracted.`,
        });
      } catch (error) {
        console.error('Error processing PDF:', error);
        toast({
          title: "Processing failed",
          description: `Failed to process ${file.name}. Please try again.`,
          variant: "destructive",
        });
      }
    }
  }, [onUploadComplete, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  return (
    <Card 
      {...getRootProps()} 
      className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-4">
        {isDragActive ? (
          <Upload className="w-12 h-12 text-primary" />
        ) : (
          <FileText className="w-12 h-12 text-muted-foreground" />
        )}
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {isDragActive ? 'Drop PDFs here' : 'Upload PDF Documents'}
          </h3>
          <p className="text-muted-foreground">
            Drag and drop PDF files here, or click to browse
          </p>
        </div>

        <Button variant="outline" size="sm">
          Choose Files
        </Button>
      </div>
    </Card>
  );
}
