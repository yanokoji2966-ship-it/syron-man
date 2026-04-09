-- Migration: Unify Settings & AI Settings
-- Date: 2026-03-06

-- 1. Ensure the main settings table has the necessary columns
ALTER TABLE IF EXISTS public.settings 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Migrate AI settings to the main settings table with 'ai_' prefix
INSERT INTO public.settings (key, value, description, active)
SELECT 
    'ai_' || setting_key, 
    setting_value, 
    description, 
    active
FROM public.ai_settings
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    active = EXCLUDED.active,
    updated_at = now();

-- 3. Drops the ai_settings table (Optional, but recommended for clean-up)
-- DROP TABLE IF EXISTS public.ai_settings;

-- 4. Update ai_insights table to remove redundant foreign key if necessary (if we change something else)
-- But for now we just want to unify settings.
