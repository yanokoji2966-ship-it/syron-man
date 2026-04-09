import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    console.log('--- SETTINGS CHECK ---');

    const { data: settings, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'nexus_sections')
        .maybeSingle();

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (!settings) {
        console.log('nexus_sections key NOT FOUND in settings table. Using defaults.');
    } else {
        console.log('Value:', settings.value);
    }
}

checkSettings();
