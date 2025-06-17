
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Buyer {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

export function useBuyers() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadBuyers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error loading buyers:', error);
        throw error;
      }

      setBuyers(data || []);
    } catch (error) {
      console.error('Failed to load buyers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addBuyer = async (buyerData: Omit<Buyer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('buyers')
        .insert([buyerData])
        .select()
        .single();

      if (error) {
        console.error('Error adding buyer:', error);
        throw error;
      }

      setBuyers(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Failed to add buyer:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBuyers();
  }, []);

  return {
    buyers,
    isLoading,
    loadBuyers,
    addBuyer
  };
}
