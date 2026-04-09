-- SYRON Man - SCHEMA INICIAL COMPLETO
-- Este script cria todas as tabelas necessÃ¡rias do zero.
-- Execute este script no SQL Editor do Supabase se estiver com erros de "relation does not exist".

-- 0. Habilitar extensÃµes necessÃ¡rias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2) DEFAULT 0.00,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_name VARCHAR(100),
  image_url TEXT,
  gallery TEXT[] DEFAULT '{}',
  video_url TEXT,
  material VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tabela de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_cpf TEXT,
  customer_zipcode VARCHAR(10),
  customer_street VARCHAR(255),
  customer_number VARCHAR(20),
  customer_neighborhood VARCHAR(100),
  customer_city VARCHAR(100),
  customer_state VARCHAR(2),
  customer_complement VARCHAR(255),
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  coupon_code TEXT,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  payment_status VARCHAR(50) DEFAULT 'pending',
  order_status VARCHAR(50) DEFAULT 'aguardando_pagamento',
  payment_method VARCHAR(100) DEFAULT 'Link Externo',
  tracking_code TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tabela de Itens do Pedido (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2) DEFAULT 0.00,
  image_url TEXT,
  size VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Outras Tabelas
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10, 2) NOT NULL,
    min_purchase_value DECIMAL(10, 2) DEFAULT 0.00,
    expires_at TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 7. PolÃ­ticas BÃ¡sicas
DROP POLICY IF EXISTS "Public read access" ON categories;
CREATE POLICY "Public read access" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON products;
CREATE POLICY "Public read access" ON products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public read access" ON settings;
CREATE POLICY "Public read access" ON settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public create orders" ON orders;
CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public create order items" ON order_items;
CREATE POLICY "Public create order items" ON order_items FOR INSERT WITH CHECK (true);

-- 8. Seed Inicial (Categorias)
INSERT INTO categories (name, icon) VALUES 
('Alfaiataria', 'Briefcase'),
('Camisas', 'Shirt'),
('CalÃ§as', 'Scissors'),
('Bermudas', 'Layers'),
('CalÃ§ados', 'Footprints'),
('RelÃ³gios', 'Watch')
ON CONFLICT (name) DO NOTHING;

-- 9. Admin Inicial
INSERT INTO admin_users (email) VALUES ('otacilio2966@gmail.com') ON CONFLICT (email) DO NOTHING;
-- 10. FunÃ§Ãµes UtilitÃ¡rias
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Triggers para updated_at
DROP TRIGGER IF EXISTS tr_update_products_updated_at ON products;
CREATE TRIGGER tr_update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_update_orders_updated_at ON orders;
CREATE TRIGGER tr_update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_update_settings_updated_at ON settings;
CREATE TRIGGER tr_update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
