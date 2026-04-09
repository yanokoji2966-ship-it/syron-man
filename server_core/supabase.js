import { createClient } from '@supabase/supabase-js';

// No Vercel, as variáveis de ambiente já são injetadas no process.env automaticamente.
// Removemos o dotenv e path para evitar erros de leitura de arquivo em ambiente serverless.

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log('Backend Error: Supabase URL or Key missing in process.env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
