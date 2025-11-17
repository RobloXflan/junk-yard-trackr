
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

  const updateBuyer = async (id: string, buyerData: Partial<Omit<Buyer, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('buyers')
        .update(buyerData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating buyer:', error);
        throw error;
      }

      setBuyers(prev => prev.map(buyer => buyer.id === id ? data : buyer));
      return data;
    } catch (error) {
      console.error('Failed to update buyer:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBuyer = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('buyers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting buyer:', error);
        throw error;
      }

      setBuyers(prev => prev.filter(buyer => buyer.id !== id));
    } catch (error) {
      console.error('Failed to delete buyer:', error);
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
    addBuyer,
    updateBuyer,
    deleteBuyer
  };
}
