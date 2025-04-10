-- Create gear_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.gear_items (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 name TEXT NOT NULL,
 brand TEXT,
 description TEXT,
 weight TEXT,
 weight_unit TEXT DEFAULT 'g',
 is_nutrition BOOLEAN DEFAULT FALSE,
 is_hydration BOOLEAN DEFAULT FALSE,
 category TEXT NOT NULL DEFAULT 'General',
 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists, this will apply any modifications needed
DO $$
BEGIN
    -- Add any columns that might be missing from an older version of the table
    -- These statements will be skipped if the columns already exist
    BEGIN
        ALTER TABLE public.gear_items ADD COLUMN IF NOT EXISTS brand TEXT;
    EXCEPTION WHEN duplicate_column THEN
        -- Do nothing, column already exists
    END;
    
    BEGIN
        ALTER TABLE public.gear_items ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN duplicate_column THEN
        -- Do nothing, column already exists
    END;
    
    BEGIN
        ALTER TABLE public.gear_items ADD COLUMN IF NOT EXISTS weight TEXT;
    EXCEPTION WHEN duplicate_column THEN
        -- Do nothing, column already exists
    END;
    
    BEGIN
        ALTER TABLE public.gear_items ADD COLUMN IF NOT EXISTS weight_unit TEXT DEFAULT 'g';
    EXCEPTION WHEN duplicate_column THEN
        -- Do nothing, column already exists
    END;
    
    BEGIN
        ALTER TABLE public.gear_items ADD COLUMN IF NOT EXISTS is_nutrition BOOLEAN DEFAULT FALSE;
    EXCEPTION WHEN duplicate_column THEN
        -- Do nothing, column already exists
    END;
    
    BEGIN
        ALTER TABLE public.gear_items ADD COLUMN IF NOT EXISTS is_hydration BOOLEAN DEFAULT FALSE;
    EXCEPTION WHEN duplicate_column THEN
        -- Do nothing, column already exists
    END;
    
    BEGIN
        ALTER TABLE public.gear_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION WHEN duplicate_column THEN
        -- Do nothing, column already exists
    END;
    
    BEGIN
        ALTER TABLE public.gear_items ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General' NOT NULL;
    EXCEPTION WHEN duplicate_column THEN
        -- Do nothing, column already exists
    END;
    
    -- You can also modify existing columns if needed
    -- ALTER TABLE public.gear_items ALTER COLUMN weight_unit SET DEFAULT 'g';
END $$;

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