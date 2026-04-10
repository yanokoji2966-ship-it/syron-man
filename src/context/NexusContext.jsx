import React, { createContext, useContext, useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { useAuth } from './AuthContext';

const NexusContext = createContext();

export const useNexus = () => useContext(NexusContext);

export const NexusProvider = ({ children }) => {
    const { isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);

    const [banner, setBanner] = useState({
        images: [],
        title: 'Elegância em cada detalhe',
        subtitle: 'Descubra a nova coleção',
        buttonText: 'Ver coleção',
        buttonLink: '/colecao'
    });

    const [branding, setBranding] = useState({
        name: 'SYRON',
        phrase: 'O estilo mora nos detalhes'
    });

    const [sections, setSections] = useState({
        showCategories: true,
        showFeatured: true,
        showBanner: true,
        showPromotions: true,
        showFreeShipping: true
    });

    const [shipping, setShipping] = useState({
        active: true,
        threshold: 250,
        message: 'Frete grátis para compras acima de R$250',
        truckAnimation: true
    });

    const [maintenance, setMaintenance] = useState({
        active: false,
        message: 'Estamos atualizando nossa coleção. Voltamos em breve.'
    });

    const [layout, setLayout] = useState('banner_large');

    const [typography, setTypography] = useState({
        titleSize: 72,
        subtitleSize: 20,
        fontFamily: "'Inter', sans-serif"
    });

    const [colors, setColors] = useState({
        primary: '#ffcc00',
        secondary: '#3b82f6',
        background: '#050a14'
    });

    const [globalSales, setGlobalSales] = useState({
        enabled: false,
        limit: 0,
        count: 0
    });

    const loadNexusSettings = async () => {
        try {
            const keys = [
                'nexus_banner',
                'nexus_branding',
                'nexus_sections',
                'nexus_shipping',
                'nexus_maintenance',
                'nexus_layout',
                'nexus_typography',
                'nexus_colors',
                'global_sales_limit_enabled',
                'global_sales_limit_value',
                'global_sales_count'
            ];

            const results = await orderService.getSettingsBatch(keys);

            if (results['nexus_banner']) {
                const bData = JSON.parse(results['nexus_banner']);
                // Migração: se não tiver images mas tiver image, converte
                if (!bData.images && bData.image) {
                    bData.images = [bData.image];
                }
                setBanner(bData);
            }
            if (results['nexus_branding']) setBranding(JSON.parse(results['nexus_branding']));
            if (results['nexus_sections']) setSections(JSON.parse(results['nexus_sections']));
            if (results['nexus_shipping']) setShipping(JSON.parse(results['nexus_shipping']));
            if (results['nexus_maintenance']) setMaintenance(JSON.parse(results['nexus_maintenance']));
            if (results['nexus_layout']) setLayout(results['nexus_layout']);
            if (results['nexus_typography']) setTypography(JSON.parse(results['nexus_typography']));
            if (results['nexus_colors']) setColors(JSON.parse(results['nexus_colors']));

            setGlobalSales({
                enabled: results['global_sales_limit_enabled'] === 'true',
                limit: parseInt(results['global_sales_limit_value']) || 0,
                count: parseInt(results['global_sales_count']) || 0
            });

        } catch (error) {
            console.error('Erro ao carregar configurações NEXUS:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNexusSettings();
    }, []);

    // Se o admin salvar algo no NexusCore, podemos disparar um reload aqui via window event ou similar se necessário
    // Por enquanto, o refresh manual do painel admin já limpa cache se necessário, mas para tempo real 
    // o usuário costuma recarregar. 

    return (
        <NexusContext.Provider value={{
            banner,
            branding,
            sections,
            shipping,
            maintenance,
            layout,
            typography,
            colors,
            globalSales,
            loading,
            refreshNexus: loadNexusSettings
        }}>
            {children}
        </NexusContext.Provider>
    );
};
