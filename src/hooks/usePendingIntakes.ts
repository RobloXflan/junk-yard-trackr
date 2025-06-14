
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePendingIntakes() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingCount();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('pending-intakes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_intakes'
        },
        () => {
          loadPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const { count, error } = await supabase
        .from('pending_intakes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('Error loading pending count:', error);
        return;
      }

      setPendingCount(count || 0);
    } catch (error) {
      console.error('Error loading pending count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    pendingCount,
    isLoading,
    refreshCount: loadPendingCount
  };
}
