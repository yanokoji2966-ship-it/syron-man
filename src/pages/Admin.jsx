import React, { useState, useEffect, useRef } from 'react';
import { Package, Check, X, RefreshCw, Plus, Edit, Trash2, LayoutGrid, List, Menu } from 'lucide-react';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { licenseService } from '../services/licenseService';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import DashboardHome from '../components/admin/DashboardHome';
import OrdersTable from '../components/admin/OrdersTable';
import ProductsTable from '../components/admin/ProductsTable';
import CustomersTable from '../components/admin/CustomersTable';
import AIAssistantPlaceholder from '../components/admin/AIAssistantPlaceholder';
import CouponsManager from '../components/admin/CouponsManager';
import ProductAnalytics from '../components/admin/ProductAnalytics';
import FinancialReports from '../components/admin/FinancialReports';
import CategoriesManager from '../components/admin/CategoriesManager';
import Settings from '../components/admin/Settings';
import StoreSettings from '../components/admin/StoreSettings';
import StoreAppearance from '../components/admin/StoreAppearance';
import AdminTeam from '../components/admin/AdminTeam';
import AdminHealth from '../components/admin/AdminHealth';
import VisualCustomizer from '../components/admin/VisualCustomizer';
import AdminHistory from '../components/admin/AdminHistory';
import AdminExpenses from '../components/admin/AdminExpenses';
import NexusCore from '../components/admin/NexusCore';
import NexusIntelligence from '../components/admin/NexusIntelligence';
import StylesManagement from '../components/admin/StylesManagement';
import BusinessIntelligence from '../components/admin/BusinessIntelligence';
import CustomerIntelligence from '../components/admin/CustomerIntelligence';
import HighEndProductCreator from '../components/admin/HighEndProductCreator';
import BatchProductCreator from '../components/admin/BatchProductCreator';
import './Admin.css';


const Admin = ({ onNavigate }) => {
    console.log('Admin: Component mounting...');
    const { user, isAdmin, isSuperAdmin, isStaff, signOut } = useAuth() || {};
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [paymentLink, setPaymentLink] = useState('');
    const [editingLink, setEditingLink] = useState(false);
    const [tempLink, setTempLink] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [diagResult, setDiagResult] = useState(null);
    const [ping, setPing] = useState(null);
    const [categories, setCategories] = useState([]);
    const [licenseInfo, setLicenseInfo] = useState(null);

    const handleTestConnection = async () => {
        setDiagResult('Testando Rota de Dados...');
        const result = await productService.testConnection();
        setDiagResult(result.ok ? `OK (${result.duration}ms)` : `FALHA: ${result.message}`);
        setPing(result.ok ? result.duration : 'ERRO');

        // Se falhou, sugere refresh forçado
        if (!result.ok) {
            setError("Instabilidade detectada. A lista de produtos pode estar desatualizada.");
        }

        setTimeout(() => setDiagResult(null), 10000);
    };

    const handleResetSession = async () => {
        if (window.confirm('Isso vai deslogar você e limpar o cache do sistema. Deseja continuar?')) {
            try {
                localStorage.clear();
                window.location.reload();
            } catch (err) {
                console.error(err);
            }
        }
    };
    const [isCompact, setIsCompact] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    // Estado para formulário de produto
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const handleOpenBatchCreator = () => {
        setIsBatchModalOpen(true);
    };
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        old_price: '',
        category_name: '',
        image_url: '',
        gallery: [],
        video_url: '',
        stock_quantity: 0,
        sales_limit: 0,
        limit_enabled: false,
        cost_price: '',
        material: '',
        is_active: true,
        category_id: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);

    useEffect(() => {
        if (!user) {
            onNavigate('login');
            return;
        }

        if (isAdmin === false) {
            alert('Acesso negado: Você não tem permissões de administrador.');
            onNavigate('home');
            return;
        }

        // Registrar Log de Acesso se ainda não fez na sessão
        if (!sessionStorage.getItem('admin_access_logged')) {
            const logAccess = async () => {
                try {
                    const { supabase } = await import('../supabaseClient');
                    await supabase.from('admin_logs').insert([{ admin_email: user.email, action: 'LOGIN_PANEL' }]);
                    sessionStorage.setItem('admin_access_logged', 'true');
                } catch (e) {
                    console.warn('Falha ao registrar auditoria (Pode ser que a query SQL de admin_logs ainda não tenha sido rodada):', e);
                }
            };
            logAccess();
        }
    }, [user, isAdmin, onNavigate]);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const validTabs = [
                'overview', 'orders', 'products', 'categories', 'customers',
                'reports', 'finance', 'performance', 'ai_assistant',
                'appearance', 'branding_store', 'branding', 'team', 'branding', 'health', 'settings', 'history', 'nexus_core', 'nexus_intelligence', 'nexus_logistics'
            ];
            if (validTabs.includes(hash)) {
                setActiveTab(hash);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Check on mount

        const checkLicense = async () => {
            try {
                const info = await licenseService.getStatus();
                setLicenseInfo(info);
            } catch (e) {
                console.warn('Falha silenciosa na verificação de licença');
            }
        };
        checkLicense();

        // [TURBO LOAD] Carregar dados iniciais (pedidos, produtos, etc)
        loadData();

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const dataLoaded = useRef(false);

    const loadData = async (silent = false) => {
        if (dataLoaded.current && !silent) return; // Evitar carga dupla se já carregado globalmente
        
        if (!silent) setLoading(true);
        setUpdating(true);
        setError(null);
        console.log('Admin: [TURBO LOAD] Iniciando sincronização de nodes...');

        try {
            const ordersPromise = (async () => {
                try {
                    const d = await orderService.getAllOrders();
                    console.log(`Admin: ${d?.length || 0} pedidos recebidos.`);
                    setOrders(d || []);
                } catch (e) {
                    console.error('Falha ao carregar pedidos:', e);
                    if (!silent) setError('Erro ao sincronizar pedidos.');
                }
            })();

            const productsPromise = (async () => {
                try {
                    const d = await productService.getProducts(false);
                    console.log(`Admin: ${d?.length || 0} produtos recebidos.`);
                    setProducts(d || []);
                } catch (e) {
                    console.error('Falha ao carregar produtos:', e);
                    if (!silent) setError('Erro ao sincronizar produtos.');
                }
            })();

            const categoriesPromise = (async () => {
                try {
                    const d = await categoryService.getAllCategories(true);
                    setCategories(d || []);
                } catch (e) { console.error('Falha ao carregar categorias:', e); }
            })();

            await Promise.allSettled([ordersPromise, productsPromise, categoriesPromise]);
            dataLoaded.current = true;
        } catch (error) {
            console.error('Admin: Erro crítico na carga:', error);
            setError('Instabilidade crítica na rede.');
        } finally {
            setLoading(false);
            setUpdating(false);
        }
    };


    // --- Configurações ---
    const handleSaveLink = async () => {
        setUpdating(true);
        try {
            await orderService.updateSetting('payment_link', tempLink);
            setPaymentLink(tempLink);
            setEditingLink(false);
            alert('Link atualizado!');
        } catch (error) {
            alert('Erro ao atualizar link.');
        } finally {
            setUpdating(false);
        }
    };

    // --- Gestão de Produtos ---
    const handleOpenAddProduct = () => {
        setEditingProduct(null);
        setProductForm({
            name: '',
            description: '',
            price: '',
            old_price: '',
            category_id: categories.length > 0 ? categories[0].id : '',
            image_url: '',
            gallery: [],
            video_url: '',
            stock_quantity: 0,
            sales_limit: 0,
            limit_enabled: false,
            cost_price: '',
            material: '',
            is_active: true
        });
        setIsProductModalOpen(true);
        setImageFile(null);
        setGalleryFiles([]);
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);

        let catName = product.category_name || product.category || '';
        if (catName === 'Anéis Escolares') catName = 'Anéis e Colares';

        setProductForm({
            name: product.name,
            description: product.description || '',
            price: product.price,
            old_price: product.old_price || '',
            category_name: catName,
            image_url: product.image_url || product.imageUrl || '',
            gallery: product.gallery || [],
            video_url: product.video_url || '',
            stock_quantity: product.stock_quantity || 0,
            sales_limit: product.sales_limit || 0,
            limit_enabled: product.limit_enabled || false,
            cost_price: product.cost_price || '',
            material: product.material || '',
            is_active: product.is_active !== false,
            category_id: product.category_id || ''
        });
        setIsProductModalOpen(true);
        setImageFile(null);
        setGalleryFiles([]);
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Tem certeza que deseja EXCLUIR este produto?')) return;
        setUpdating(true);
        try {
            await productService.deleteProduct(productId);
            await loadData();
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            alert('Erro ao EXCLUIR: Certifique-se de que executou o script TABELAS_PRODUTOS.sql no Supabase SQL Editor.');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateStatus = async (productId, newStatus) => {
        setUpdating(true);
        try {
            await productService.saveProduct({ id: productId, is_active: newStatus });
            await loadData();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status do produto.');
        } finally {
            setUpdating(false);
        }
    };

    const [saveLogs, setSaveLogs] = useState([]);

    const addLog = (msg) => {
        setSaveLogs(prev => [...prev, `➤ ${new Date().toLocaleTimeString()}: ${msg}`].slice(-5));
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setSaveLogs(['➤ Iniciando processo de salvamento...']);
        console.log('Admin: Iniciando salvamento de produto...');
        try {
            // Teste de Sanidade SQL inicial para acalmar o usuário sobre o banco
            await productService.testConnection(addLog);

            let finalImageUrl = productForm.image_url;
            let finalGallery = Array.isArray(productForm.gallery) ? [...productForm.gallery] : [];

            // 1. Upload Imagem Principal
            if (imageFile) {
                try {
                    finalImageUrl = await productService.uploadImage(imageFile, addLog);
                } catch (err) {
                    if (productForm.image_url) {
                        if (window.confirm(`Upload da foto principal falhou. Usar link existente?`)) {
                            finalImageUrl = productForm.image_url;
                        } else throw err;
                    } else throw err;
                }
            }

            // 2. Upload Múltiplas Imagens da Galeria
            if (galleryFiles.length > 0) {
                addLog(`Enviando ${galleryFiles.length} fotos para a galeria...`);
                for (let i = 0; i < galleryFiles.length; i++) {
                    try {
                        addLog(`Enviando foto ${i + 1}/${galleryFiles.length}...`);
                        const url = await productService.uploadImage(galleryFiles[i], addLog);
                        finalGallery.push(url);
                    } catch (err) {
                        addLog(`Erro na foto ${i + 1}: ${err.message}`);
                    }
                }
            }

            const payload = {
                ...productForm,
                image_url: finalImageUrl,
                gallery: finalGallery,
                video_url: productForm.video_url,
                price: parseFloat(productForm.price),
                stock_quantity: parseInt(productForm.stock_quantity) || 0,
                sales_limit: parseInt(productForm.sales_limit) || 0,
                limit_enabled: productForm.limit_enabled,
                cost_price: productForm.cost_price ? parseFloat(productForm.cost_price) : 0,
                old_price: productForm.old_price ? parseFloat(productForm.old_price) : null
            };

            if (editingProduct) payload.id = editingProduct.id;

            addLog('Finalizando persistência...');
            await productService.saveProduct(payload, addLog);

            // Forçar atualização do estado local IMEDIATAMENTE antes de fechar o modal
            console.log('Admin: Produto salvo. Forçando sync...');
            await loadData(true);

            setIsProductModalOpen(false);
            setImageFile(null);
            setSaveLogs([]);
            alert('Produto salvo com sucesso e catálogo sincronizado!');
        } catch (error) {
            console.error('Erro detalhado ao salvar:', error);
            const isHandshake = error.message?.includes('Handshake') || error.message?.includes('session');
            const isTimeout = error.message?.includes('limite') || error.message?.includes('Timeout') || error.message?.includes('excedido');

            let finalMsg = error.message;
            if (isHandshake) finalMsg = "Falha ao validar sua sessão. Tente sair e entrar no sistema.";

            if (isTimeout) {
                if (imageFile) {
                    finalMsg = "O envio da foto demorou demais mesmo após 3 tentativas. Sua internet parece estar muito instável. Tente usar apenas o LINK da imagem.";
                } else {
                    finalMsg = "A conexão com o banco de dados está muito instável no momento. Tente salvar novamente em alguns instantes.";
                }
            }

            alert(`Erro ao Salvar: ${finalMsg}`);
        } finally {
            setUpdating(false);
        }
    };

    // Blocos de carregamento removidos para permitir entrada imediata

    const renderContent = (isSuper) => {
        switch (activeTab) {
            case 'overview':
                return <DashboardHome orders={orders} products={products} />;
            case 'orders':
                return (
                    <div className="orders-section animate-fade">
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            borderRadius: '16px', padding: '20px 24px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Gestão de Pedidos</h2>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
                                    {orders.length} pedidos no total &bull; {orders.filter(o => o.payment_status === 'paid').length} pagos
                                </p>
                            </div>
                            <button onClick={() => loadData()} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 18px', borderRadius: '10px',
                                background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
                                border: '1px solid rgba(59,130,246,0.3)', fontWeight: '700',
                                cursor: 'pointer', fontSize: '13px'
                            }} disabled={updating}>
                                <RefreshCw size={15} /> Atualizar
                            </button>
                        </div>
                        <OrdersTable orders={orders} onUpdateOrder={loadData} />
                    </div>
                );
            case 'products':
                return (
                    <div className="products-section animate-fade">
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(180,120,20,0.06) 100%)',
                            border: '1px solid rgba(212,175,55,0.2)',
                            borderRadius: '16px', padding: '20px 24px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Catálogo de Produtos</h2>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
                                    {products.length} produtos cadastrados &bull; {products.filter(p => p.is_active !== false).length} visíveis na loja
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={handleOpenBatchCreator}
                                    style={{
                                        padding: '10px 18px', borderRadius: '10px', fontSize: '13px',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: 'rgba(255,255,255,0.05)', color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.1)', fontWeight: '700'
                                    }}
                                >
                                    <List size={16} /> Cadastro em Lote
                                </button>
                                <button className="add-product-btn" onClick={handleOpenAddProduct} style={{
                                    padding: '10px 20px', borderRadius: '10px', fontSize: '14px',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <Plus size={16} /> Novo Produto
                                </button>
                            </div>
                        </div>
                        <ProductsTable
                            products={products}
                            onEdit={handleEditProduct}
                            onDelete={handleDeleteProduct}
                            onUpdateStatus={handleUpdateStatus}
                            onRefresh={() => loadData()}
                        />
                    </div>
                );
            case 'categories':
                return <CategoriesManager categories={categories} onRefresh={() => loadData(true)} />;
            case 'style-advisor': return <StylesManagement products={products} />;
            case 'business-intelligence': return <BusinessIntelligence />;
            case 'customer-intelligence': return <CustomerIntelligence />;
            case 'expenses': return <AdminExpenses />;
            case 'customers':
                return (
                    <div className="customers-section animate-fade">
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.06) 100%)',
                            border: '1px solid rgba(168,85,247,0.2)',
                            borderRadius: '16px', padding: '20px 24px',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Base de Clientes</h2>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
                                {[...new Set(orders.map(o => o.customer_email).filter(Boolean))].length} clientes únicos registrados
                            </p>
                        </div>
                        <CustomersTable orders={orders} />
                    </div>
                );
            case 'reports':
                return (
                    <div className="reports-section animate-fade">
                        <FinancialReports orders={orders} />
                    </div>
                );
            case 'coupons':
                return <CouponsManager />;
            case 'performance':
                return <ProductAnalytics products={products} orders={orders} />;
            case 'ai_assistant':
                return <AIAssistantPlaceholder products={products} orders={orders} />;
            case 'branding_store':
                return isSuper ? <StoreSettings /> : <DashboardHome orders={orders} products={products} />;
            case 'appearance':
                return isSuper ? <StoreAppearance /> : <DashboardHome orders={orders} products={products} />;
            case 'team':
                return <AdminTeam />;
            case 'branding':
                return isSuper ? <VisualCustomizer /> : <DashboardHome orders={orders} products={products} />;
            case 'health':
                return <AdminHealth />;
            case 'history':
                return <AdminHistory />;
            case 'finance':
                return <AdminExpenses />;
            case 'nexus_core':
                return <NexusCore />;
            case 'global_sales':
                return <StoreSettings />;
            case 'nexus_intelligence':
                return <NexusIntelligence />;
            case 'nexus_logistics':
                return <NexusIntelligence initialTab="logistics" />;
            case 'settings':
                return (
                    <Settings
                        paymentLink={paymentLink}
                        onSaveLink={async (newLink) => {
                            setTempLink(newLink); // Update local temp via prop callback if needed, but mainly for triggering save
                            setUpdating(true);
                            try {
                                await orderService.updateSetting('payment_link', newLink);
                                setPaymentLink(newLink);
                                alert('Link atualizado!');
                            } catch (error) {
                                console.error(error);
                                alert('Erro ao atualizar link.');
                            } finally {
                                setUpdating(false);
                            }
                        }}
                        updating={updating}
                    />
                );
            default:
                return null;
        }
    };

    const renderSafeContent = (isSuper) => {
        // Bloqueio de Segurança para Funcionários (RBAC)
        const restrictedTabs = [
            'reports', 'finance', 'performance', 'coupons', 
            'global_sales', 'settings', 'team', 'ai_assistant',
            'nexus_core', 'nexus_intelligence', 'nexus_logistics',
            'analytics', 'business-intelligence', 'customer-intelligence'
        ];

        if (isStaff && restrictedTabs.includes(activeTab)) {
            console.warn(`Acesso negado para role staff na aba: ${activeTab}`);
            return <DashboardHome orders={orders} products={products} />;
        }

        try {
            return renderContent(isSuper);
        } catch (err) {
            console.error('Admin: Error rendering content:', err);
            return (
                <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,0,0,0.05)', borderRadius: '20px', border: '1px solid rgba(255,0,0,0.2)' }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '10px' }}>⚠️ Erro Interno</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Ocorreu um erro ao carregar esta seção do painel.</p>
                    <code style={{ display: 'block', margin: '20px 0', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '12px' }}>
                        {err.message}
                    </code>
                    <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: 'var(--secondary)', color: 'var(--primary)', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Recarregar Sistema
                    </button>
                </div>
            );
        }
    };

    return (
        <div className="admin-layout">
            {/* Overlay para fechar sidebar no mobile */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 99,
                        backdropFilter: 'blur(2px)'
                    }}
                />
            )}

            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false); }}
                isOpen={sidebarOpen}
                onLogout={async () => { await signOut(); }}
            />

            {/* Modais Elite */}
            {isProductModalOpen && (
                <HighEndProductCreator 
                    initialProduct={editingProduct}
                    categories={categories}
                    onClose={() => setIsProductModalOpen(false)}
                    onSaveComplete={loadData}
                />
            )}

            {isBatchModalOpen && (
                <BatchProductCreator 
                    categories={categories}
                    onClose={() => setIsBatchModalOpen(false)}
                    onSaveComplete={loadData}
                />
            )}

            <main className="admin-content">
                <header className="admin-topbar glass">
                    <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Botão hambúrguer - só aparece no mobile */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="admin-menu-toggle"
                            title="Menu"
                        >
                            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ margin: 0 }}>Olá, Administrador</h2>
                                <span style={{
                                    background: '#7000ff', color: 'white', fontSize: '9px',
                                    fontWeight: '900', padding: '2px 6px', borderRadius: '4px',
                                    letterSpacing: '1px', boxShadow: '0 0 10px rgba(112,0,255,0.5)'
                                }}>NEXUS ACTIVE</span>
                            </div>
                            <span className="date-badge">{new Date().toLocaleDateString('pt-BR')}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {licenseInfo && licenseInfo.days_to_expiry > 0 && licenseInfo.days_to_expiry <= 3 && (
                            <div style={{ 
                                fontSize: '11px', 
                                background: 'rgba(245, 158, 11, 0.1)', 
                                color: '#f59e0b', 
                                padding: '6px 12px', 
                                borderRadius: '6px',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                fontWeight: 'bold'
                            }}>
                                {licenseInfo.days_to_expiry === 1 
                                    ? '⚠️ Seu plano vence amanhã!' 
                                    : `📅 Seu plano vence em ${licenseInfo.days_to_expiry} dias`}
                            </div>
                        )}
                        {ping !== null && (
                            <div title="Latência com o Banco" style={{ fontSize: '10px', color: typeof ping === 'number' ? (ping < 500 ? '#4ade80' : '#fbbf24') : '#ef4444', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                {typeof ping === 'number' ? `Ping: ${ping}ms` : 'Ping: FALHA'}
                            </div>
                        )}
                        {loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(212,175,55,0.8)', background: 'rgba(212,175,55,0.05)', padding: '4px 10px', borderRadius: '40px', border: '1px solid rgba(212,175,55,0.2)' }}>
                                <RefreshCw className="animate-spin" size={12} />
                                <span>Sincronizando...</span>
                            </div>
                        )}
                        {diagResult && (
                            <span style={{ fontSize: '12px', color: diagResult.includes('OK') ? '#4ade80' : '#ef4444' }}>
                                {diagResult}
                            </span>
                        )}
                        <button
                            onClick={handleTestConnection}
                            title="Testar Conexão com Banco"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                            Diagnosticar
                        </button>
                        <button
                            onClick={handleResetSession}
                            title="Resetar Sessão se Travado"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                            Resetar
                        </button>
                    </div>

                    {error && (
                        <div className="error-badge">
                            ⚠️ {error}
                        </div>
                    )}

                    {licenseInfo && licenseInfo.status === 'grace' && (
                        <div className="error-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                            ⚠️ SEU PLANO VENCERÁ EM BREVE: Você está em período de carência. Evite interrupções renovando agora.
                        </div>
                    )}

                    {licenseInfo && licenseInfo.status === 'expired' && (
                        <div className="error-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                            {licenseInfo.soft_blocked 
                                ? '🚫 SEU PLANO ESTÁ INATIVO: Recursos limitados. Acesso a pedidos liberado por 48h para consulta.'
                                : '🚫 PLANO EXPIRADO: Acesso administrativo bloqueado. Por favor, renove para continuar.'}
                        </div>
                    )}

                    {licenseInfo && licenseInfo.status === 'suspended' && (
                        <div className="error-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                            🚫 PLANO SUSPENSO: Este sistema foi desativado manualmente. Entre em contato com o suporte.
                        </div>
                    )}

                    {licenseInfo && licenseInfo.status === 'violation' && (
                        <div className="error-badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                            🚨 ERRO DE AUTORIZAÇÃO: Este sistema não está autorizado para rodar neste endereço.
                        </div>
                    )}

                    {licenseInfo && !licenseInfo.valid && !['grace', 'expired', 'suspended', 'violation'].includes(licenseInfo.status) && licenseInfo.message !== 'Sistema não inicializado' && (
                        <div className="error-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                            ⚠️ ASSINATURA INVÁLIDA: Verificação de segurança falhou.
                        </div>
                    )}
                </header>

                <div className="content-wrapper">
                    {renderSafeContent(isSuperAdmin)}
                </div>
            </main>

        </div>
    );
};

export default Admin;
