
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFUploadZoneProps {
  onUpload: (file: File) => void;
}

export function PDFUploadZone({ onUpload }: PDFUploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.type === 'application/pdf') {
        onUpload(file);
      }
    });
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragActive 
          ? "border-primary bg-primary/5" 
          : "border-muted-foreground/25 hover:border-primary/50"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-muted p-4">
          {isDragActive ? (
            <Upload className="w-8 h-8 text-primary" />
          ) : (
            <FileText className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop PDF files here' : 'Upload PDF documents'}
          </p>
          <p className="text-sm text-muted-foreground">
            Drag and drop PDF files here, or click to select
          </p>
        </div>
        {acceptedFiles.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {acceptedFiles.length} file(s) ready to upload
          </div>
        )}
      </div>
    </div>
  );
}
