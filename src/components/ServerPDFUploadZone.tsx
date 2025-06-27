
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServerPDFUploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export function ServerPDFUploadZone({ onUpload, isUploading = false }: ServerPDFUploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (file.type === 'application/pdf') {
        try {
          await onUpload(file);
        } catch (error) {
          console.error('Upload failed:', error);
        }
      }
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: isUploading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
        isDragActive || dragActive
          ? "border-primary bg-primary/5 scale-105" 
          : "border-muted-foreground/25 hover:border-primary/50",
        isUploading && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-muted p-4">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : isDragActive ? (
            <Upload className="w-8 h-8 text-primary" />
          ) : (
            <FileText className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-lg font-medium">
            {isUploading 
              ? 'Processing PDF...' 
              : isDragActive 
                ? 'Drop PDF files here' 
                : 'Upload PDF documents'
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {isUploading 
              ? 'Please wait while we split your PDF into pages'
              : 'Drag and drop PDF files here, or click to select'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
