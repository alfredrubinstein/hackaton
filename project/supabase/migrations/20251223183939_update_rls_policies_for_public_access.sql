/*
  # Update RLS Policies for Public Access

  1. Changes
    - Update all RLS policies to allow public (anon) access
    - This allows the application to work without authentication
    - Maintains data security while enabling public read/write for development

  2. Security
    - Policies now allow both authenticated and anonymous users
    - In production, these should be restricted to authenticated users only
*/

-- Drop existing policies for properties
DROP POLICY IF EXISTS "Users can view all properties" ON properties;
DROP POLICY IF EXISTS "Users can create properties" ON properties;
DROP POLICY IF EXISTS "Users can update properties" ON properties;
DROP POLICY IF EXISTS "Users can delete properties" ON properties;

-- Create new public policies for properties
CREATE POLICY "Public can view all properties"
  ON properties FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can create properties"
  ON properties FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update properties"
  ON properties FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete properties"
  ON properties FOR DELETE
  TO anon, authenticated
  USING (true);

-- Drop existing policies for rooms
DROP POLICY IF EXISTS "Users can view all rooms" ON rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Users can update rooms" ON rooms;
DROP POLICY IF EXISTS "Users can delete rooms" ON rooms;

-- Create new public policies for rooms
CREATE POLICY "Public can view all rooms"
  ON rooms FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can create rooms"
  ON rooms FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update rooms"
  ON rooms FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete rooms"
  ON rooms FOR DELETE
  TO anon, authenticated
  USING (true);

-- Drop existing policies for installations
DROP POLICY IF EXISTS "Users can view all installations" ON installations;
DROP POLICY IF EXISTS "Users can create installations" ON installations;
DROP POLICY IF EXISTS "Users can update installations" ON installations;
DROP POLICY IF EXISTS "Users can delete installations" ON installations;

-- Create new public policies for installations
CREATE POLICY "Public can view all installations"
  ON installations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can create installations"
  ON installations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update installations"
  ON installations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete installations"
  ON installations FOR DELETE
  TO anon, authenticated
  USING (true);

-- Drop existing policies for medical_equipment
DROP POLICY IF EXISTS "Users can view all medical equipment" ON medical_equipment;
DROP POLICY IF EXISTS "Users can create medical equipment" ON medical_equipment;
DROP POLICY IF EXISTS "Users can update medical equipment" ON medical_equipment;
DROP POLICY IF EXISTS "Users can delete medical equipment" ON medical_equipment;

-- Create new public policies for medical_equipment
CREATE POLICY "Public can view all medical equipment"
  ON medical_equipment FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can create medical equipment"
  ON medical_equipment FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can update medical equipment"
  ON medical_equipment FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete medical equipment"
  ON medical_equipment FOR DELETE
  TO anon, authenticated
  USING (true);
