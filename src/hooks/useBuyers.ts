
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Buyer {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export function useBuyers() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadBuyers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setBuyers(data || []);
    } catch (error) {
      console.error('Error loading buyers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addBuyer = async (buyerData: { first_name: string; last_name: string; address: string }) => {
    try {
      const { data, error } = await supabase
        .from('buyers')
        .insert([buyerData])
        .select()
        .single();

      if (error) throw error;
      
      setBuyers(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error adding buyer:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadBuyers();
  }, []);

  return {
    buyers,
    isLoading,
    addBuyer,
    refreshBuyers: loadBuyers
  };
}
