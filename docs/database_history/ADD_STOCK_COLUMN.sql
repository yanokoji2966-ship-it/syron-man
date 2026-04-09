-- SYRON Man - Add stock_quantity column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Optional: Update existing products to have some stock
UPDATE public.products SET stock_quantity = 10 WHERE stock_quantity = 0;
