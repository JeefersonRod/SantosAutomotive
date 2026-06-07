export interface OrderItem {
  id?: number;
  description: string;
  price: number;
  quantity?: number;
  type: 'labor' | 'parts';
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  image_url?: string;
  created_at: string;
}

export interface Vehicle {
  id: number;
  client_id: number;
  make: string;
  model: string;
  year?: number;
  plate: string;
  color?: string;
  vin?: string;
  engine?: string;
  fuel?: string;
  hp?: string;
  image_url?: string;
  client_name?: string;
}

export interface StaffMember {
  id: number;
  name: string;
  roles: string[];
  phone?: string;
  email?: string;
  username?: string;
  password?: string;
  permissions?: 'super_admin' | 'admin' | 'technician' | 'attendant' | 'client';
  active: boolean;
}

export interface User extends Omit<StaffMember, 'active'> {
  // User is a logged in staff member
}

export interface NoteItem {
  id?: number;
  note_id: number;
  description: string;
  price?: number;
  quantity: number;
  type: 'service' | 'part';
  discount_percent?: number;
}

export interface Note {
  id: number;
  order_id?: number;
  client_id?: number;
  vehicle_id?: number;
  manual_client_name?: string;
  manual_vehicle_model?: string;
  manual_plate?: string;
  document_type?: 'note' | 'budget';
  total_amount: number;
  payment_status?: 'paid' | 'unpaid' | 'partial';
  paid_amount?: number;
  created_at: string;
  client_name?: string;
  vehicle_model?: string;
  plate?: string;
  items?: NoteItem[];
}

// Legacy technical type kept for compatibility with the existing database/API.
// Products are no longer exposed as a primary commercial module in the app.
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  min_stock?: number;
  category?: string;
  image_url?: string;
  is_promotion?: boolean;
  promotion_price?: number;
  created_at?: string;
}

export interface ServiceOrder {
  id: number;
  vehicle_id: number;
  technician_ids?: number[];
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  total_amount: number;
  notes?: string;
  checklist?: Record<string, any>;
  checkin_images?: string[];
  created_at: string;
  entry_date?: string;
  exit_date?: string;
  is_priority?: boolean;
  vehicle_model?: string;
  plate?: string;
  customer_name?: string;
  customer_phone?: string;
  technician_names?: string[];
  items?: OrderItem[];
  tests?: OrderTest[];
  note_id?: number;
}

export interface OrderTest {
  id?: number;
  order_id?: number;
  component_name: string;
  result: string;
  notes?: string;
}
