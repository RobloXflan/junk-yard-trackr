
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedQuote {
  id: string;
  year: string;
  make: string;
  model: string;
  estimatedPrice: number;
  adjustedOffer: number;
  confidence: string;
  dataPoints: number;
  createdAt: string;
}

interface QuotesStore {
  quotes: SavedQuote[];
  addQuote: (quote: Omit<SavedQuote, 'id' | 'createdAt'>) => void;
  removeQuote: (id: string) => void;
  clearQuotes: () => void;
}

export const useQuotesStore = create<QuotesStore>()(
  persist(
    (set) => ({
      quotes: [],
      addQuote: (quote) =>
        set((state) => ({
          quotes: [
            {
              ...quote,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
            ...state.quotes,
          ],
        })),
      removeQuote: (id) =>
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        })),
      clearQuotes: () => set({ quotes: [] }),
    }),
    {
      name: 'quotes-storage',
    }
  )
);
