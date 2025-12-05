-- CourierOS Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'RIDER', 'HUB_MANAGER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE service_type AS ENUM ('STANDARD', 'EXPRESS', 'SAME_DAY');
CREATE TYPE shipment_status AS ENUM ('PENDING', 'APPROVED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('CREDIT_CARD', 'WALLET', 'COD');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID', 'FAILED');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'CUSTOMER',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shipments table
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  pickup_address JSONB NOT NULL,
  dropoff_address JSONB NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  description TEXT,
  service_type service_type NOT NULL DEFAULT 'STANDARD',
  status shipment_status NOT NULL DEFAULT 'PENDING',
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  price DECIMAL(10, 2) NOT NULL,
  distance_miles DECIMAL(10, 2),
  estimated_delivery TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Addresses table (geocoding cache)
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address_string TEXT UNIQUE NOT NULL,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX idx_shipments_rider_id ON shipments(rider_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_tracking_id ON shipments(tracking_id);
CREATE INDEX idx_shipments_created_at ON shipments(created_at DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_addresses_string ON addresses(address_string);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'HUB_MANAGER')
    )
  );

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- RLS Policies for shipments table
CREATE POLICY "Customers can view their own shipments"
  ON shipments FOR SELECT
  USING (
    customer_id = auth.uid() OR
    rider_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'HUB_MANAGER')
    )
  );

CREATE POLICY "Customers can create shipments"
  ON shipments FOR INSERT
  WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'CUSTOMER'
    )
  );

CREATE POLICY "Users can update their related shipments"
  ON shipments FOR UPDATE
  USING (
    customer_id = auth.uid() OR
    rider_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('ADMIN', 'HUB_MANAGER')
    )
  );

-- RLS Policies for addresses table (public read, authenticated write)
CREATE POLICY "Anyone can read addresses"
  ON addresses FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin user (update email as needed)
INSERT INTO users (email, name, phone, role, status)
VALUES ('admin@courieros.com', 'Admin User', '+1234567890', 'ADMIN', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
