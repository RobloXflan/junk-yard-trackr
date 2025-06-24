
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PdfBatch {
  id: string;
  filename: string;
  upload_date: string;
  total_pages: number;
  processed_pages: number;
  status: string;
}

export function usePdfBatches() {
  const [batches, setBatches] = useState<PdfBatch[]>([]);
  const [currentBatch, setCurrentBatch] = useState<PdfBatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pdf_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setBatches(data || []);
      if (data && data.length > 0 && !currentBatch) {
        setCurrentBatch(data[0]);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBatch = async (batchId: string) => {
    await loadBatches();
    const newBatch = batches.find(b => b.id === batchId);
    if (newBatch) {
      setCurrentBatch(newBatch);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  return {
    batches,
    currentBatch,
    isLoading,
    loadBatches,
    createBatch,
    setCurrentBatch
  };
}
