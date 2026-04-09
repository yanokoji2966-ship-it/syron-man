-- ADICIONA COLUNAS PARA RECUPERAÇÃO DE PAGAMENTO
-- Execute isso no SQL Editor do Supabase

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pix_data JSONB,
ADD COLUMN IF NOT EXISTS checkout_url TEXT;

-- Comentário para documentação:
-- pix_data: Armazena o objeto retornado pelo Mercado Pago (qr_code, copy_paste_key, etc)
-- checkout_url: Armazena o link do Checkout Pro (init_point) do Mercado Pago
