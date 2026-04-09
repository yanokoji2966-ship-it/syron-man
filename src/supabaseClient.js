import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
    console.warn('Supabase credentials missing! Standard mock data will be used.');
    console.log('Diagnostic: URL exists:', !!supabaseUrl, 'Key exists:', !!supabaseAnonKey);
} else {
    try {
        // Validação básica de formato para evitar erros silenciosos de fetch
        if (!supabaseUrl.startsWith('https://')) {
            throw new Error('Supabase URL deve começar com https://');
        }
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Supabase: Cliente inicializado com sucesso.');
    } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
    }
}

export { supabase }
