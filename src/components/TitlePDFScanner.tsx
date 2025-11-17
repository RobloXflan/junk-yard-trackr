import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ServerPDFUploadZone } from './ServerPDFUploadZone';
import { PDFPageGallery } from './PDFPageGallery';
import { ClientPDFProcessor } from '@/services/clientPdfProcessor';

interface ExtractedData {
  vin?: string;
  licensePlate?: string;
  year?: string;
  make?: string;
  pageNumber?: number;
}

interface TitlePDFScannerProps {
  onDataExtracted?: (data: ExtractedData) => void;
}

interface PDFPage {
  id: string;
  page_number: number;
  thumbnail_url: string | null;
  full_page_url: string | null;
  pdf_batches: { filename: string } | null;
}

export function TitlePDFScanner({ onDataExtracted }: TitlePDFScannerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);

  const handlePDFUpload = async (file: File) => {
    setIsUploading(true);
    setPages([]);
    setSelectedPages([]);
    setExtractedData([]);

    try {
      const batch = await ClientPDFProcessor.processPDF(file);
      
      // Fetch the processed pages
      const { data: pagesData, error } = await supabase
        .from('pdf_pages')
        .select('id, page_number, thumbnail_url, full_page_url, pdf_batches(filename)')
        .eq('batch_id', batch.id)
        .order('page_number');

      if (error) throw error;

      setPages(pagesData || []);
      toast.success(`PDF uploaded: ${pagesData?.length || 0} pages processed`);
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.error('Failed to process PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePageSelect = (pageId: string) => {
    setSelectedPages(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId);
      }
      return [...prev, pageId];
    });
  };

  const handleScanSelectedPages = async () => {
    if (selectedPages.length === 0) {
      toast.error('Please select at least one page to scan');
      return;
    }

    setIsScanning(true);
    setExtractedData([]);

    try {
      // Get the full page URLs for selected pages
      const selectedPagesData = pages.filter(p => selectedPages.includes(p.id));
      const pageUrls = selectedPagesData.map(p => p.full_page_url).filter(Boolean);

      if (pageUrls.length === 0) {
        throw new Error('No valid page images found');
      }

      const { data, error } = await supabase.functions.invoke("scan-title-pdf", {
        body: { pageUrls },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const results = data.data || [];
      setExtractedData(results);

      if (results.length === 0) {
        toast.info('No vehicle titles detected in selected pages');
      } else {
        toast.success(`Found ${results.length} vehicle title(s)`);
      }
    } catch (error) {
      console.error('Error scanning pages:', error);
      toast.error('Failed to scan pages. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleUseData = (data: ExtractedData) => {
    if (onDataExtracted) {
      onDataExtracted(data);
      toast.success('Data applied to form');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          AI Title Scanner
        </CardTitle>
        <CardDescription>
          Upload a PDF, select pages with vehicle titles, then scan with AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pages.length === 0 ? (
          <ServerPDFUploadZone 
            onUpload={handlePDFUpload}
            isUploading={isUploading}
          />
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pages.length} pages • {selectedPages.length} selected
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPages([]);
                    setSelectedPages([]);
                    setExtractedData([]);
                  }}
                >
                  Upload Different PDF
                </Button>
              </div>

              <PDFPageGallery
                pages={pages}
                selectedPages={selectedPages}
                onPageSelect={handlePageSelect}
              />

              <Button
                onClick={handleScanSelectedPages}
                disabled={selectedPages.length === 0 || isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning {selectedPages.length} page(s)...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Scan {selectedPages.length} Selected Page(s) with AI
                  </>
                )}
              </Button>
            </div>

            {extractedData.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-medium">Extracted Vehicle Information:</h3>
                {extractedData.map((data, index) => (
                  <Card key={index} className="border-primary/20">
                    <CardContent className="pt-4 space-y-2">
                      {data.pageNumber && (
                        <p className="text-sm text-muted-foreground">
                          Page {data.pageNumber}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {data.vin && (
                          <div>
                            <span className="font-medium">VIN:</span> {data.vin}
                          </div>
                        )}
                        {data.licensePlate && (
                          <div>
                            <span className="font-medium">License Plate:</span> {data.licensePlate}
                          </div>
                        )}
                        {data.year && (
                          <div>
                            <span className="font-medium">Year:</span> {data.year}
                          </div>
                        )}
                        {data.make && (
                          <div>
                            <span className="font-medium">Make:</span> {data.make}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUseData(data)}
                        className="w-full mt-2"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Use This Data
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
