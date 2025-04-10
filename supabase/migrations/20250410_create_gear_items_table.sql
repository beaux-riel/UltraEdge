-- Create gear_items table
CREATE TABLE IF NOT EXISTS public.gear_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  weight TEXT,
  weight_unit TEXT DEFAULT 'g',
  is_nutrition BOOLEAN DEFAULT FALSE,
  is_hydration BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.gear_items ENABLE ROW LEVEL SECURITY;

-- Policy for selecting gear items (users can only see their own gear items)
CREATE POLICY "Users can view their own gear items" 
  ON public.gear_items 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for inserting gear items
CREATE POLICY "Users can insert their own gear items" 
  ON public.gear_items 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating gear items
CREATE POLICY "Users can update their own gear items" 
  ON public.gear_items 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for deleting gear items
CREATE POLICY "Users can delete their own gear items" 
  ON public.gear_items 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS gear_items_user_id_idx ON public.gear_items(user_id);

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gear_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_gear_items_updated_at
BEFORE UPDATE ON public.gear_items
FOR EACH ROW
EXECUTE FUNCTION update_gear_items_updated_at();