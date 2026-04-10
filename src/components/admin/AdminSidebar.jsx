import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Users,
    BarChart2,
    Settings,
    Ticket,
    BarChart3,
    LogOut,
    Sparkles,
    Palette,
    Store,
    Clock,
    LayoutTemplate,
    ChevronUp,
    ChevronDown,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/orderService';

const AdminSidebar = ({ activeTab, setActiveTab, onLogout, isOpen }) => {
    const { user, isSuperAdmin, isStaff } = useAuth();
    const [logoUrl, setLogoUrl] = useState('/logo_refined.png');
    const [expandedGroups, setExpandedGroups] = useState({
        'visao-geral': true // Expandido por padrão
    });

    const menuGroups = [
        {
            id: 'visao-geral',
            label: 'Visão Geral',
            icon: LayoutDashboard,
            items: [
                { id: 'overview', label: 'Resumo da Loja' },
                { id: 'history', label: 'Histórico Operacional' },
                { id: 'orders', label: 'Pedidos' },
                { id: 'products', label: 'Produtos' },
                { id: 'bulk_import', label: 'Importação Massiva' },
                { id: 'categories', label: 'Categorias' },
                { id: 'style-advisor', label: 'Consultor de Estilo', icon: <Sparkles size={20} /> },
                { id: 'customers', label: 'Clientes' }
            ]
        },
        ...(!isStaff ? [
            {
                id: 'financeiro',
                label: 'Financeiro e Vendas',
                icon: BarChart2,
                items: [
                    { id: 'reports', label: 'Relatórios' },
                    { id: 'finance', label: 'Gestão de Despesas' },
                    { id: 'performance', label: 'Performance' },
                    { id: 'coupons', label: 'Cupons de Desconto' },
                    { id: 'global_sales', label: 'Controle de Vendas Global' }
                ]
            }
        ] : []),
        {
            id: 'configuracoes',
            label: 'Sistema',
            icon: Settings,
            items: [
                ...(isSuperAdmin ? [
                    { id: 'branding_store', label: 'Branding & Loja' },
                    { id: 'branding', label: 'Estilo do Site' },
                ] : []),
                ...(!isStaff ? [
                    { id: 'settings', label: 'Ajustes Técnicos' },
                    { id: 'team', label: 'Equipe e Acessos' },
                ] : []),
                { id: 'health', label: 'Saúde do Sistema' },
                ...(!isStaff ? [{ id: 'ai_assistant', label: 'Assistente IA' }] : [])
            ]
        },
        ...(!isStaff ? [
            {
                id: 'central-comando',
                label: 'Central de Comando',
                icon: Sparkles,
                items: [
                    { id: 'nexus_intelligence', label: 'NEXUS Intelligence 🧠' },
                    { id: 'nexus_logistics', label: 'Logística (NEXUS) 📦' },
                    { id: 'nexus_core', label: 'NEXUS Core ✨' }
                ]
            },
            {
                id: 'inteligencia',
                label: 'Inteligência Estratégica',
                icon: BarChart3,
                items: [
                    { id: 'analytics', label: 'Análise de Produtos', icon: <TrendingUp size={20} /> },
                    { id: 'business-intelligence', label: 'Inteligência Comercial', icon: <BarChart3 size={20} /> },
                    { id: 'customer-intelligence', label: 'Inteligência de Clientes', icon: <Users size={20} /> }
                ]
            }
        ] : [])
    ];
    console.log('AdminSidebar: menuGroups loaded:', menuGroups.map(g => g.label));

    useEffect(() => {
        orderService.getSetting('store_logo_url').then(v => {
            if (v) setLogoUrl(v);
        }).catch(err => console.error(err));
    }, []);

    // Determina qual grupo expandir baseado na aba atual
    useEffect(() => {
        const activeGroup = menuGroups.find(g => g.items.some(i => i.id === activeTab));
        if (activeGroup && !expandedGroups[activeGroup.id]) {
            setExpandedGroups(prev => ({ ...prev, [activeGroup.id]: true }));
        }
    }, [activeTab]);

    const toggleGroup = (groupId) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId]
        }));
    };

    return (
        <aside className={`admin-sidebar glass${isOpen ? ' open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    <img src={logoUrl} alt="SYRON Man" style={{ height: '40px', objectFit: 'contain' }} onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }} />
                    <div className="logo-text-fallback" style={{ display: 'none', flexDirection: 'column', alignItems: 'center', scale: '0.8' }}>
                        <span className="style-text" style={{ fontFamily: 'serif', fontSize: '24px', color: 'var(--primary)', fontStyle: 'italic' }}>SYRON</span>
                        <span className="man-text" style={{ fontFamily: 'sans-serif', fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: 'white', textTransform: 'uppercase' }}>MAN</span>
                    </div>
                </div>
                <span className="badge-admin">Admin</span>
            </div>

            <nav className="sidebar-nav" style={{ padding: '20px 16px', overflowY: 'auto' }}>
                {menuGroups.map(group => {
                    const isExpanded = expandedGroups[group.id];
                    const hasActiveChild = group.items.some(item => item.id === activeTab);
                    return (
                        <div key={group.id} className="nav-group">
                            <button
                                className={`nav-group-header ${hasActiveChild ? 'active' : ''}`}
                                onClick={() => toggleGroup(group.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <group.icon size={18} color={hasActiveChild ? 'var(--secondary)' : 'currentColor'} />
                                    <span>{group.label}</span>
                                </div>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {isExpanded && (
                                <div className="nav-group-items animate-fade">
                                    {group.items.map(item => (
                                        <button
                                            key={item.id}
                                            className={`nav-sub-item ${activeTab === item.id ? 'active' : ''}`}
                                            onClick={() => setActiveTab(item.id)}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>


            <div className="sidebar-footer">
                <button onClick={onLogout} className="logout-btn">
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
