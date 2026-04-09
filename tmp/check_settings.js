import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    console.log('--- SETTINGS DIAGNOSTIC ---');

    const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'nexus_sections')
        .single();

    if (error) {
        console.error('Error fetching nexus_sections:', error.message);
        return;
    }

    console.log('Nexus Sections:', settings.value);
}

checkSettings();
