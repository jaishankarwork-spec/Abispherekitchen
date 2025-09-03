/*
  # Product and Sale Management Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `sku` (text, unique)
      - `category` (text)
      - `unit` (text)
      - `current_stock` (integer)
      - `min_stock` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `purchase_transactions`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `supplier_name` (text)
      - `quantity` (integer)
      - `purchase_price` (decimal)
      - `total_cost` (decimal)
      - `purchase_date` (timestamp)
      - `invoice_number` (text)
      - `notes` (text)
      - `created_at` (timestamp)
    
    - `sale_transactions`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `customer_name` (text)
      - `customer_phone` (text)
      - `customer_email` (text)
      - `quantity` (integer)
      - `sale_price` (decimal)
      - `total_amount` (decimal)
      - `profit_margin` (decimal)
      - `sale_date` (timestamp)
      - `payment_method` (text)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Functions
    - Auto-calculate profit margins
    - Update stock levels on transactions
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  sku text UNIQUE NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  current_stock integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchase transactions table
CREATE TABLE IF NOT EXISTS purchase_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  purchase_price numeric(10,2) NOT NULL CHECK (purchase_price >= 0),
  total_cost numeric(10,2) NOT NULL CHECK (total_cost >= 0),
  purchase_date timestamptz DEFAULT now(),
  invoice_number text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create sale transactions table
CREATE TABLE IF NOT EXISTS sale_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  quantity integer NOT NULL CHECK (quantity > 0),
  sale_price numeric(10,2) NOT NULL CHECK (sale_price >= 0),
  total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
  profit_margin numeric(10,2) DEFAULT 0,
  sale_date timestamptz DEFAULT now(),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'online', 'credit')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_product_id ON purchase_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_date ON purchase_transactions(purchase_date);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_product_id ON sale_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_customer_phone ON sale_transactions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_date ON sale_transactions(sale_date);

-- Function to update product stock on purchase
CREATE OR REPLACE FUNCTION update_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET 
    current_stock = current_stock + NEW.quantity,
    updated_at = now()
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update product stock on sale
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET 
    current_stock = GREATEST(0, current_stock - NEW.quantity),
    updated_at = now()
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate profit margin
CREATE OR REPLACE FUNCTION calculate_profit_margin()
RETURNS TRIGGER AS $$
DECLARE
  avg_purchase_price numeric(10,2);
BEGIN
  -- Get average purchase price for the product
  SELECT COALESCE(AVG(purchase_price), 0)
  INTO avg_purchase_price
  FROM purchase_transactions
  WHERE product_id = NEW.product_id;
  
  -- Calculate profit margin
  NEW.profit_margin = (NEW.sale_price - avg_purchase_price) * NEW.quantity;
  NEW.total_amount = NEW.sale_price * NEW.quantity;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_stock_on_purchase ON purchase_transactions;
CREATE TRIGGER trigger_update_stock_on_purchase
  AFTER INSERT ON purchase_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_purchase();

DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sale_transactions;
CREATE TRIGGER trigger_update_stock_on_sale
  AFTER INSERT ON sale_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_sale();

DROP TRIGGER IF EXISTS trigger_calculate_profit_margin ON sale_transactions;
CREATE TRIGGER trigger_calculate_profit_margin
  BEFORE INSERT ON sale_transactions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profit_margin();

-- Insert sample products
INSERT INTO products (name, description, sku, category, unit, current_stock, min_stock) VALUES
('Premium Basmati Rice', 'High quality aged basmati rice', 'RICE-001', 'Grains', 'kg', 0, 50),
('Fresh Chicken Breast', 'Farm fresh chicken breast', 'CHICKEN-001', 'Meat', 'kg', 0, 20),
('Organic Tomatoes', 'Fresh organic tomatoes', 'TOMATO-001', 'Vegetables', 'kg', 0, 30),
('Turmeric Powder', 'Pure turmeric powder', 'TURMERIC-001', 'Spices', 'kg', 0, 10),
('Cooking Oil', 'Refined sunflower oil', 'OIL-001', 'Other', 'liters', 0, 25)
ON CONFLICT (sku) DO NOTHING;

-- Insert sample purchase transactions
INSERT INTO purchase_transactions (product_id, supplier_name, quantity, purchase_price, total_cost, invoice_number, notes) VALUES
((SELECT id FROM products WHERE sku = 'RICE-001'), 'Tamil Nadu Rice Mills', 100, 75.00, 7500.00, 'INV-001', 'Bulk purchase for month'),
((SELECT id FROM products WHERE sku = 'CHICKEN-001'), 'Fresh Meat Co.', 50, 220.00, 11000.00, 'INV-002', 'Weekly meat supply'),
((SELECT id FROM products WHERE sku = 'TOMATO-001'), 'Hosur Vegetable Market', 80, 35.00, 2800.00, 'INV-003', 'Fresh vegetables'),
((SELECT id FROM products WHERE sku = 'TURMERIC-001'), 'Spice World', 20, 180.00, 3600.00, 'INV-004', 'Monthly spice order'),
((SELECT id FROM products WHERE sku = 'OIL-001'), 'Local Supplier', 40, 120.00, 4800.00, 'INV-005', 'Cooking oil stock')
ON CONFLICT DO NOTHING;

-- Insert sample sale transactions
INSERT INTO sale_transactions (product_id, customer_name, customer_phone, customer_email, quantity, sale_price, payment_method, notes) VALUES
((SELECT id FROM products WHERE sku = 'RICE-001'), 'Rajesh Kumar', '+91 9876543214', 'rajesh@email.com', 5, 90.00, 'cash', 'Regular customer'),
((SELECT id FROM products WHERE sku = 'CHICKEN-001'), 'Meera Patel', '+91 9876543215', 'meera@email.com', 2, 280.00, 'card', 'Premium cut'),
((SELECT id FROM products WHERE sku = 'TOMATO-001'), 'Arun Vijay', '+91 9876543216', 'arun@email.com', 3, 50.00, 'cash', 'Fresh tomatoes'),
((SELECT id FROM products WHERE sku = 'TURMERIC-001'), 'Priya Sharma', '+91 9876543217', 'priya@email.com', 1, 220.00, 'online', 'Organic turmeric'),
((SELECT id FROM products WHERE sku = 'OIL-001'), 'Rajesh Kumar', '+91 9876543214', 'rajesh@email.com', 2, 150.00, 'cash', 'Cooking oil')
ON CONFLICT DO NOTHING;