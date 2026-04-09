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

            const results = await Promise.all(keys.map(k => orderService.getSetting(k)));

            if (results[0]) {
                const bData = JSON.parse(results[0]);
                // Migração: se não tiver images mas tiver image, converte
                if (!bData.images && bData.image) {
                    bData.images = [bData.image];
                }
                setBanner(bData);
            }
            if (results[1]) setBranding(JSON.parse(results[1]));
            if (results[2]) setSections(JSON.parse(results[2]));
            if (results[3]) setShipping(JSON.parse(results[3]));
            if (results[4]) setMaintenance(JSON.parse(results[4]));
            if (results[5]) setLayout(results[5]);
            if (results[6]) setTypography(JSON.parse(results[6]));
            if (results[7]) setColors(JSON.parse(results[7]));

            setGlobalSales({
                enabled: results[8] === 'true',
                limit: parseInt(results[9]) || 0,
                count: parseInt(results[10]) || 0
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
