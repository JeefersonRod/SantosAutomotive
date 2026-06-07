-- Supabase Migration Schema

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  plate TEXT NOT NULL UNIQUE,
  color TEXT,
  vin TEXT,
  engine TEXT,
  fuel TEXT,
  hp TEXT,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS staff_members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  username TEXT UNIQUE,
  password TEXT,
  permissions TEXT DEFAULT 'technician',
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registration_requests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_orders (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  description TEXT,
  status TEXT DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  checklist JSONB DEFAULT '{}'::jsonb,
  checkin_images TEXT,
  entry_date DATE,
  exit_date DATE,
  is_priority BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER DEFAULT 1,
  type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_technicians (
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  technician_id INTEGER NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  PRIMARY KEY (order_id, technician_id)
);

CREATE TABLE IF NOT EXISTS service_order_tests (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  result TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  expiration_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES service_orders(id) ON DELETE SET NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  manual_client_name TEXT,
  manual_vehicle_model TEXT,
  manual_plate TEXT,
  document_type TEXT DEFAULT 'note',
  total_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid',
  paid_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS note_items (
  id SERIAL PRIMARY KEY,
  note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER DEFAULT 1,
  type TEXT NOT NULL,
  discount_percent NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  category TEXT,
  image_url TEXT,
  is_promotion BOOLEAN DEFAULT FALSE,
  promotion_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vehicles_client_id ON vehicles(client_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_vehicle_id ON service_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_technicians_technician_id ON order_technicians(technician_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_order_id ON notes(order_id);
CREATE INDEX IF NOT EXISTS idx_notes_client_id ON notes(client_id);
CREATE INDEX IF NOT EXISTS idx_note_items_note_id ON note_items(note_id);
