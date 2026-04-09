-- Tabela para registro de custos operacionais e despesas
CREATE TABLE IF NOT EXISTS admin_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    admin_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE admin_expenses ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Apenas usuários autenticados/admins)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON admin_expenses;
CREATE POLICY "Enable read access for authenticated users" ON admin_expenses
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admin_expenses;
CREATE POLICY "Enable insert for authenticated users" ON admin_expenses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON admin_expenses;
CREATE POLICY "Enable delete for authenticated users" ON admin_expenses
    FOR DELETE USING (auth.role() = 'authenticated');
