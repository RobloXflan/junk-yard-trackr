
-- Create trucks table
CREATE TABLE public.trucks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_number TEXT NOT NULL UNIQUE,
  license_plate TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'offline')),
  current_driver_id UUID REFERENCES public.workers(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create truck_locations table for real-time GPS coordinates
CREATE TABLE public.truck_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  battery_level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create truck_tracking_sessions table for timed tracking
CREATE TABLE public.truck_tracking_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_end TIMESTAMP WITH TIME ZONE,
  planned_duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  auto_stopped BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create truck_assignments table to link trucks to appointments
CREATE TABLE public.truck_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  truck_id UUID NOT NULL REFERENCES public.trucks(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointment_notes(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'en_route', 'arrived', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(truck_id, appointment_id)
);

-- Enable Row Level Security
ALTER TABLE public.trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.truck_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for trucks
CREATE POLICY "Allow all operations on trucks" 
ON public.trucks 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for truck_locations
CREATE POLICY "Allow all operations on truck_locations" 
ON public.truck_locations 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for truck_tracking_sessions
CREATE POLICY "Allow all operations on truck_tracking_sessions" 
ON public.truck_tracking_sessions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for truck_assignments
CREATE POLICY "Allow all operations on truck_assignments" 
ON public.truck_assignments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_truck_locations_truck_id ON public.truck_locations(truck_id);
CREATE INDEX idx_truck_locations_created_at ON public.truck_locations(created_at);
CREATE INDEX idx_truck_tracking_sessions_truck_id ON public.truck_tracking_sessions(truck_id);
CREATE INDEX idx_truck_tracking_sessions_status ON public.truck_tracking_sessions(status);
CREATE INDEX idx_truck_assignments_truck_id ON public.truck_assignments(truck_id);
CREATE INDEX idx_truck_assignments_appointment_id ON public.truck_assignments(appointment_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_trucks_updated_at
  BEFORE UPDATE ON public.trucks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_truck_tracking_sessions_updated_at
  BEFORE UPDATE ON public.truck_tracking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_truck_assignments_updated_at
  BEFORE UPDATE ON public.truck_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
