-- Create workers table
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash_transactions table
CREATE TABLE public.cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('turn_in', 'give_money', 'starting_balance')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_summaries table
CREATE TABLE public.daily_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_date DATE NOT NULL UNIQUE,
  total_turned_in DECIMAL(10,2) DEFAULT 0,
  total_given_out DECIMAL(10,2) DEFAULT 0,
  net_change DECIMAL(10,2) DEFAULT 0,
  active_workers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for workers
CREATE POLICY "Allow all operations on workers" 
ON public.workers 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for cash_transactions
CREATE POLICY "Allow all operations on cash_transactions" 
ON public.cash_transactions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for daily_summaries
CREATE POLICY "Allow all operations on daily_summaries" 
ON public.daily_summaries 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_cash_transactions_worker_date ON public.cash_transactions(worker_id, transaction_date);
CREATE INDEX idx_cash_transactions_date ON public.cash_transactions(transaction_date);
CREATE INDEX idx_workers_status ON public.workers(status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_summaries_updated_at
  BEFORE UPDATE ON public.daily_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();