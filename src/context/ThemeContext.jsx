import React, { createContext, useContext, useState, useEffect } from 'react';
import { orderService } from '../services/orderService';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Valores padrão baseados no index.css
    const [theme, setTheme] = useState({
        primary: '#ffcc00',
        secondary: '#3b82f6',
        background: '#050a14',
        surface: '#0a101f',
        radius: '8px',
        glass_intensity: '0.8',
        font_family: 'sans-serif', // 'sans-serif' ou 'serif'
        button_style: 'solid',      // 'solid', 'outline', 'glow'
        header_type: 'fixed'       // 'fixed', 'fluid'
    });

    const [loading, setLoading] = useState(true);

    // Carregar do Supabase ao iniciar
    useEffect(() => {
        async function loadTheme() {
            try {
                const keys = [
                    'theme_primary',
                    'theme_secondary',
                    'theme_background',
                    'theme_radius',
                    'theme_glass_intensity',
                    'theme_font_family',
                    'theme_button_style',
                    'theme_header_type'
                ];
                
                const results = await orderService.getSettingsBatch(keys);

                const newTheme = { ...theme };
                if (results['theme_primary']) newTheme.primary = results['theme_primary'];
                if (results['theme_secondary']) newTheme.secondary = results['theme_secondary'];
                if (results['theme_background']) newTheme.background = results['theme_background'];
                if (results['theme_radius']) newTheme.radius = results['theme_radius'];
                if (results['theme_glass_intensity']) newTheme.glass_intensity = results['theme_glass_intensity'];
                if (results['theme_font_family']) newTheme.font_family = results['theme_font_family'];
                if (results['theme_button_style']) newTheme.button_style = results['theme_button_style'];
                if (results['theme_header_type']) newTheme.header_type = results['theme_header_type'];

                setTheme(newTheme);
                applyTheme(newTheme);
            } catch (err) {
                console.error('Falha ao carregar tema:', err);
            } finally {
                setLoading(false);
            }
        }
        loadTheme();
    }, []);

    // Função para aplicar as variáveis CSS no :root
    const applyTheme = (t) => {
        const root = document.documentElement;
        root.style.setProperty('--primary', t.primary);
        root.style.setProperty('--secondary', t.secondary);
        root.style.setProperty('--background', t.background);
        root.style.setProperty('--radius-lg', t.radius);

        // Fontes
        const fontStack = t.font_family === 'serif'
            ? "'Playfair Display', serif"
            : "'Inter', sans-serif";
        root.style.setProperty('--font-family', fontStack);
        document.body.style.fontFamily = fontStack;

        // Estilos de Botão
        root.style.setProperty('--button-glow', t.button_style === 'glow' ? `0 0 20px ${t.primary}55` : 'none');
        root.style.setProperty('--button-border', t.button_style === 'outline' ? `2px solid ${t.primary}` : 'none');
        root.style.setProperty('--button-bg', t.button_style === 'outline' ? 'transparent' : 'var(--primary)');

        // Header
        root.style.setProperty('--header-position', t.header_type === 'fixed' ? 'sticky' : 'relative');

        // Atualizar cores derivadas e brilhos
        root.style.setProperty('--primary-glow', `${t.primary}33`); // 33 é ~20% opacidade em hex

        // Atualizar classe .glass dinamicamente
        const glassBg = `rgba(10, 16, 31, ${t.glass_intensity})`;
        // Como o React não facilita mudar regras de classe CSS puras no runtime sem bibliotecas, 
        // vamos usar variáveis CSS para o background do glass
        root.style.setProperty('--glass-bg', glassBg);
    };

    const updateTheme = async (updates) => {
        const updatedTheme = { ...theme, ...updates };
        setTheme(updatedTheme);
        applyTheme(updatedTheme);

        // Persistir no Supabase
        try {
            const promises = Object.entries(updates).map(([key, value]) =>
                orderService.updateSetting(`theme_${key}`, value)
            );
            await Promise.all(promises);
        } catch (err) {
            console.error('Erro ao salvar tema:', err);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, updateTheme, loading }}>
            {children}
        </ThemeContext.Provider>
    );
};
