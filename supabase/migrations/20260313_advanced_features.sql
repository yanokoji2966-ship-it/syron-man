-- Create table for product price history
CREATE TABLE IF NOT EXISTS public.product_price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read-only access to price history" ON public.product_price_history;
CREATE POLICY "Allow public read-only access to price history" 
ON public.product_price_history FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow service_role to manage price history" ON public.product_price_history;
CREATE POLICY "Allow service_role to manage price history" 
ON public.product_price_history FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

-- Trigger function to log price changes
CREATE OR REPLACE FUNCTION log_product_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (NEW.price IS DISTINCT FROM OLD.price) THEN
        INSERT INTO public.product_price_history (product_id, price)
        VALUES (NEW.id, NEW.price);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log price changes on products table
DROP TRIGGER IF EXISTS tr_log_product_price_change ON public.products;
CREATE TRIGGER tr_log_product_price_change
AFTER INSERT OR UPDATE OF price ON public.products
FOR EACH ROW
EXECUTE FUNCTION log_product_price_change();

-- Ensure view_count exists on products table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'view_count') THEN
        ALTER TABLE public.products ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sales_count') THEN
        ALTER TABLE public.products ADD COLUMN sales_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Function to update sales count on product
CREATE OR REPLACE FUNCTION update_product_sales_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o pedido foi pago, incrementa o contador de vendas dos itens
    IF (NEW.payment_status = 'paid' AND OLD.payment_status != 'paid') THEN
        UPDATE public.products p
        SET sales_count = p.sales_count + oi.quantity
        FROM public.order_items oi
        WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for sales count
DROP TRIGGER IF EXISTS tr_update_product_sales_count ON public.orders;
CREATE TRIGGER tr_update_product_sales_count
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_product_sales_count();
