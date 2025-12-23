/*
  # Arquitecto de Sistemas Espaciales - Database Schema

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `name` (text) - Name of the property
      - `view_box` (text) - SVG viewBox for the global map
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `rooms`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `name` (text) - Room name
      - `svg_path` (text) - SVG path for 2D mini-map
      - `vertices` (jsonb) - Array of {x, y} vertices defining the room shape
      - `wall_height` (decimal) - Height of walls in meters
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `installations`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key)
      - `type` (text) - 'power_point', 'door', 'window'
      - `position` (jsonb) - {x, y, z} or {start: {x, y}, end: {x, y}}
      - `subtype` (text) - e.g., 'wall-mounted', 'floor'
      - `created_at` (timestamptz)
    
    - `medical_equipment`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key)
      - `name` (text) - Equipment name
      - `type` (text) - Equipment type
      - `position` (jsonb) - {x, y, z}
      - `rotation` (jsonb) - {x, y, z} rotation in radians
      - `dimensions` (jsonb) - {width, height, depth}
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
*/

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  view_box text DEFAULT '0 0 100 100',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all properties"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete properties"
  ON properties FOR DELETE
  TO authenticated
  USING (true);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  svg_path text NOT NULL,
  vertices jsonb NOT NULL,
  wall_height decimal DEFAULT 2.6,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update rooms"
  ON rooms FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete rooms"
  ON rooms FOR DELETE
  TO authenticated
  USING (true);

-- Installations table
CREATE TABLE IF NOT EXISTS installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('power_point', 'door', 'window')),
  position jsonb NOT NULL,
  subtype text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all installations"
  ON installations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create installations"
  ON installations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update installations"
  ON installations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete installations"
  ON installations FOR DELETE
  TO authenticated
  USING (true);

-- Medical Equipment table
CREATE TABLE IF NOT EXISTS medical_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  position jsonb NOT NULL,
  rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
  dimensions jsonb DEFAULT '{"width": 1, "height": 1, "depth": 1}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medical_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all medical equipment"
  ON medical_equipment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create medical equipment"
  ON medical_equipment FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update medical equipment"
  ON medical_equipment FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete medical equipment"
  ON medical_equipment FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_installations_room_id ON installations(room_id);
CREATE INDEX IF NOT EXISTS idx_medical_equipment_room_id ON medical_equipment(room_id);