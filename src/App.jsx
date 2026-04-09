import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './components/Toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import HeroSection from './components/HeroSection';
import CategorySection from './components/CategorySection';
import OfferSection from './components/OfferSection';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import OrderPending from './pages/OrderPending';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import About from './pages/About';
import StyleAdvisor from './pages/StyleAdvisor';
import NotFound from './pages/NotFound';
import ProductCard from './components/ProductCard';
import MiniCart from './components/MiniCart';
import Footer from './components/Footer';
import { ShoppingCart, X, ShieldCheck, Truck, Star, AlertTriangle, Sparkles, Palmtree, ArrowRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';
import SEO from './components/SEO';
import FloatingSupport from './components/FloatingSupport';
import { PRODUCTS as mockProducts } from './data';
import { productService } from './services/productService';
import { categoryService } from './services/categoryService';
import { wishlistService } from './services/wishlistService';
import { orderService } from './services/orderService';
import { supabase } from './supabaseClient';
import { AIProvider } from './context/AIContext';
import { NexusProvider, useNexus } from './context/NexusContext';
import './App.css';

function AppContent() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { maintenance, branding, sections, shipping, layout, colors, typography, globalSales, loading: nexusLoading } = useNexus();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = localStorage.getItem('styleman_current_page');
    return saved || 'home';
  });
  const [sortBy, setSortBy] = useState('newest');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('syronman_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('syronman_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [storeName, setStoreName] = useState('SYRON MAN');
  const [exclusiveCity, setExclusiveCity] = useState('São Raimundo Nonato - PI');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orders, setOrders] = useState([]); // Adicionado para evitar erro de referência
  const [globalError, setGlobalError] = useState(null);
  const [isLogoZoomed, setIsLogoZoomed] = useState(false);
  const [promoActive, setPromoActive] = useState(false);
  const [promoText, setPromoText] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('/logo_refined.png');
  const [storeFooterText, setStoreFooterText] = useState('A marca do homem moderno. Estilo, sofisticação e qualidade premium em cada detalhe.');
  const productsSectionRef = useRef(null);
  const [freeShippingBalloon, setFreeShippingBalloon] = useState({ visible: false, popping: false, threshold: null });


  useEffect(() => {
    localStorage.setItem('syronman_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // INJEÇÃO DE DESIGN DINÂMICO (NEXUS CORE)
  useEffect(() => {
    if (colors) {
      document.documentElement.style.setProperty('--primary', colors.primary);
      document.documentElement.style.setProperty('--secondary', colors.secondary);
      document.documentElement.style.setProperty('--background', colors.background);
      // Brilhos e sombras baseados na cor primária
      document.documentElement.style.setProperty('--primary-glow', `${colors.primary}33`); // 20% alpha
    }
    if (typography) {
      document.documentElement.style.setProperty('--font-family', typography.fontFamily);
    }
  }, [colors, typography]);

  useEffect(() => {
    localStorage.setItem('styleman_current_page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (user && user.id) {
      wishlistService.getFavorites(user.id).then(dbFavs => {
        if (dbFavs && dbFavs.length > 0) {
          setFavorites(prev => {
            const combined = [...dbFavs];
            prev.forEach(lp => {
              if (!combined.find(cp => cp.id === lp.id)) {
                combined.push(lp);
                wishlistService.addFavorite(user.id, lp.id);
              }
            });
            return combined;
          });
        }
      });
    }
  }, [user]);

  // Trigger truck notification once per session (cinematic/premium UX)
  useEffect(() => {
    if (shipping.active && shipping.truckAnimation && shipping.threshold) {
      const hasSeenTruck = sessionStorage.getItem('nexus_truck_seen');
      if (!hasSeenTruck) {
        // Show after 1.5s
        setTimeout(() => {
          setFreeShippingBalloon({ visible: true, popping: false, threshold: shipping.threshold });
          // Auto-dismiss: mark seen and fade out after 12s
          setTimeout(() => {
            sessionStorage.setItem('nexus_truck_seen', '1');
            setFreeShippingBalloon(prev => ({ ...prev, popping: true }));
            setTimeout(() => setFreeShippingBalloon({ visible: false, popping: false, threshold: null }), 800);
          }, 12000);
        }, 1500);
      }
    }
  }, [shipping]);

  useEffect(() => {
    localStorage.setItem('syronman_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Recuperação de Pedido via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderNum = params.get('order');
    if (orderNum && !currentOrder) {
      console.log('App: Recuperando pedido da URL:', orderNum);
      setCurrentOrder({ orderNumber: orderNum, total: 0 }); // Total será buscado no OrderPending
      setCurrentPage('order-pending');
      // Limpa o parâmetro da URL sem recarregar a página para evitar loops
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [currentOrder]);

  // Flag para evitar múltiplas cargas paralelas de dados globais
  const initialLoadDone = useRef(false);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 15000);

    async function loadData() {
      // Se já carregamos os dados globais e não estamos forçando refresh, pulamos
      if (initialLoadDone.current) {
        setLoading(false);
        return;
      }

      try {
        console.log('App: [TURBO LOAD] Iniciando carregamento otimizado...');
        
        // 1. Carga paralela de macro-dados (Produtos e Categorias)
        const [prodData, catData, settingsBatch] = await Promise.all([
          productService.getProducts(false).catch(e => { console.error('App: Prod fetch failed', e); return null; }),
          categoryService.getAllCategories().catch(e => { console.error('App: Cat fetch failed', e); return null; }),
          orderService.getSettingsBatch([
            'store_logo_url', 
            'store_footer_text', 
            'store_name', 
            'exclusive_city', 
            'free_shipping_threshold'
          ])
        ]);

        // 2. Aplicar configurações do lote
        if (settingsBatch) {
          if (settingsBatch.store_logo_url) setStoreLogoUrl(settingsBatch.store_logo_url);
          if (settingsBatch.store_footer_text) setStoreFooterText(settingsBatch.store_footer_text);
          if (settingsBatch.store_name) setStoreName(settingsBatch.store_name);
          if (settingsBatch.exclusive_city) setExclusiveCity(settingsBatch.exclusive_city);
          // O threshold de frete grátis é consumido diretamente via getSetting se necessário,
          // ou podemos salvar num estado global se o app precisar.
        }

        if (prodData) {
          setProducts(prodData || []);
          setGlobalError(null);
        }

        if (catData) {
          setCategories(catData || []);
        }

        initialLoadDone.current = true;
        console.log('App: [TURBO LOAD] Sistema sincronizado.');

      } catch (err) {
        console.error('App: Load global failed', err);
        setGlobalError('Erro crítico ao carregar dados do sistema.');
      } finally {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    }
    loadData();
  }, [currentPage]); // Mantido currentPage para sincronia de navegação, mas o ref evita a carga repetitiva


  const navigateToDetail = (product) => {
    setSelectedProduct(product);
    setCurrentPage('detail');
    window.scrollTo(0, 0);
  };

  const toggleFavorite = async (product) => {
    const isFav = favorites.find(p => p.id === product.id);
    setFavorites(prev => isFav ? prev.filter(p => p.id !== product.id) : [...prev, product]);
    if (user && user.id) {
      if (isFav) await wishlistService.removeFavorite(user.id, product.id);
      else await wishlistService.addFavorite(user.id, product.id);
    }
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === product.selectedSize);
      if (existing) {
        return prev.map(item => (item.id === product.id && item.selectedSize === product.selectedSize) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsMiniCartOpen(true);
    showToast(`"${product.name}" adicionado ao carrinho!`, 'success');
  };

  const updateCartQty = (id, selectedSize, newQuantity) => {
    setCartItems(prev => prev.map(item => (item.id === id && item.selectedSize === selectedSize) ? { ...item, quantity: Math.max(1, newQuantity) } : item));
  };

  const removeFromCart = (id, selectedSize) => {
    if (id === 'all') {
      setCartItems([]);
      return;
    }
    setCartItems(prev => prev.filter(item => !(item.id === id && item.selectedSize === selectedSize)));
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    // Scroll suave para a seção de produtos ao filtrar
    if (categoryId) {
      setTimeout(() => {
        productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const renderPage = () => {
    if (loading || authLoading || nexusLoading) return (
      <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background)' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '20px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '2px' }}>CONECTANDO AO NEXUS CORE...</p>
      </div>
    );

    // MODO MANUTENÇÃO
    if (maintenance.active && !isAdmin) {
      return (
        <div className="maintenance-screen animate-fade" style={{
          height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'var(--background)', textAlign: 'center', padding: '40px'
        }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', padding: '24px', borderRadius: '50%', marginBottom: '32px' }}>
            <Palmtree size={64} color="var(--secondary)" className="animate-pulse" />
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '16px', letterSpacing: '-2px' }}>{branding.name} <span style={{ color: 'var(--secondary)' }}>SQUAD</span></h1>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '500px', lineHeight: '1.6' }}>
            {maintenance.message}
          </p>
          <div style={{ marginTop: '50px', opacity: 0.3, fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px' }}>
            ESTILO & SOFISTICAÇÃO EM ATUALIZAÇÃO
          </div>
        </div>
      );
    }

    if (globalError) {
      return (
        <div className="empty-cart glass" style={{ padding: '60px', borderRadius: '24px', textAlign: 'center', margin: '40px auto', maxWidth: '800px' }}>
          <AlertTriangle size={48} color="#FF5252" style={{ marginBottom: '20px' }} />
          <p style={{ fontSize: '18px', marginBottom: '10px', color: '#fff', fontWeight: 'bold' }}>Problema de Conexão</p>
          <p style={{ fontSize: '14px', marginBottom: '30px', color: 'var(--text-muted)' }}>{globalError}</p>
          <button className="checkout-btn" onClick={() => window.location.reload()} style={{ width: 'auto', margin: '0 auto', padding: '16px 40px' }}>TENTAR NOVAMENTE</button>
        </div>
      );
    }

    switch (currentPage) {
      case 'categories':
      case 'home':
        let filtered = products;
        if (selectedCategory) {
          filtered = filtered.filter(p => {
            const cat = categories.find(c => c.id === selectedCategory);
            if (!cat) return false;

            const targetName = cat.name.toLowerCase();
            const prodCatName = (p.category_name || p.category || '').toLowerCase();

            // Match by ID OR Exact Name OR Partial Name (e.g. Camisa matches Camisas)
            return p.category_id === selectedCategory ||
              prodCatName === targetName ||
              targetName.includes(prodCatName) ||
              prodCatName.includes(targetName);
          });
        }
        if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return (
          <>
            {sections.showCategories && (
              <CategorySection
                categories={categories}
                onSelectCategory={handleCategorySelect}
                selectedCategoryId={selectedCategory}
              />
            )}
            {sections.showBanner && (
              <HeroSection onCtaClick={() => productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} />
            )}

            {(sections.showFeatured || searchQuery) && (
              <div ref={productsSectionRef} className="products-grid">
                {filtered.map(p => (
                  <div key={p.id} onClick={() => navigateToDetail(p)}>
                    <ProductCard
                      product={p}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={favorites.some(f => f.id === p.id)}
                    />
                  </div>
                ))}
              </div>
            )}

            {sections.showPromotions && <OfferSection products={products} onAddToCart={addToCart} onNavigateToDetail={navigateToDetail} />}

            {/* STYLE ADVISOR TEASER */}
            <section className="animate-fade" style={{ padding: '80px 20px', textAlign: 'center', background: 'linear-gradient(180deg, transparent 0%, rgba(236,72,153,0.05) 50%, transparent 100%)' }}>
              <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(236,72,153,0.1)', padding: '5px 15px', borderRadius: '40px', marginBottom: '20px' }}>
                  <Sparkles size={14} color="var(--primary)" />
                  <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '3px', color: 'var(--primary)', textTransform: 'uppercase' }}>NEXUS STYLE ADVISOR</span>
                </div>
                <h2 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '20px', letterSpacing: '-1px' }}>ELEVE SEU ESTILO AO NÍVEL <span style={{ color: 'var(--secondary)' }}>PREMIUM</span></h2>
                <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '600px', marginBottom: '40px', lineHeight: '1.6' }}>
                  Nossos consultores curaram combinações perfeitas para você. Compre looks completos e economize tempo com a nossa inteligência de moda.
                </p>
                <button
                  onClick={() => setCurrentPage('style')}
                  className="checkout-btn"
                  style={{ width: 'auto', padding: '16px 45px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '50px' }}
                >
                  EXPLORAR LOOKS CURADOS <ArrowRight size={20} />
                </button>
              </div>
            </section>
          </>
        );
      case 'detail': return (
        <ProductDetail 
          product={selectedProduct} 
          onBack={() => setCurrentPage('home')} 
          onAddToCart={addToCart} 
          allProducts={products} 
          onNavigate={navigateToDetail}
          onToggleFavorite={toggleFavorite}
          favorites={favorites}
        />
      );
      case 'cart': return <Cart items={cartItems} onUpdateQty={updateCartQty} onRemove={removeFromCart} onCheckout={o => { setCurrentOrder(o); setCartItems([]); setCurrentPage('order-pending'); }} />;
      case 'favorites': return <Favorites onNavigateToDetail={navigateToDetail} onToggleFavorite={toggleFavorite} favorites={favorites} onAddToCart={addToCart} />;
      case 'order-pending': return <OrderPending {...currentOrder} onNavigate={setCurrentPage} />;
      case 'profile': return user ? <Profile user={user} onNavigate={setCurrentPage} initialSection="orders" /> : <Login onNavigate={setCurrentPage} />;
      case 'login': return <Login onNavigate={setCurrentPage} />;
      case 'signup': return <SignUp onNavigate={setCurrentPage} />;
      case 'admin': return isAdmin ? <Admin onNavigate={setCurrentPage} /> : <NotFound onNavigate={setCurrentPage} />;
      case 'privacy': return <PrivacyPolicy onBack={() => setCurrentPage('home')} />;
      case 'about': return <About onBack={() => setCurrentPage('home')} />;
      case 'style': return <StyleAdvisor onBack={() => setCurrentPage('home')} onNavigate={setCurrentPage} onAddToCart={addToCart} />;
      default: return <NotFound onNavigate={setCurrentPage} />;
    }
  };

  return (
    <HelmetProvider>
      <div className={`app-container ${isMenuOpen ? 'menu-open' : ''}`}>
        <SEO />
        <FloatingSupport />
        <Header
          onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
          cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
          onCartClick={() => setIsMiniCartOpen(true)}
          onNavigate={setCurrentPage}
          onLogoClick={() => {
            setCurrentPage('home');
            setSelectedCategory(null);
            setSearchQuery('');
          }}
          onSearch={(q) => {
            setSearchQuery(q);
            if (q) {
              setCurrentPage('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onAuthClick={setCurrentPage}
          logoUrl={storeLogoUrl}
          storeName={storeName}
          exclusiveCity={exclusiveCity}
          categories={categories}
        />
        <Sidebar categories={categories} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={setCurrentPage} logoUrl={storeLogoUrl} />
        <MobileNav
          activePage={currentPage}
          onNavigate={setCurrentPage}
          onCartClick={() => setIsMiniCartOpen(true)}
        />
        {globalSales?.enabled && globalSales?.count >= globalSales?.limit && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.95)',
            color: 'white',
            textAlign: 'center',
            padding: '12px',
            fontSize: '13px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            position: 'sticky',
            bottom: '80px',
            zIndex: '1000',
            backdropFilter: 'blur(10px)',
            margin: '10px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
            LIMITE DIÁRIO DE VENDAS ATINGIDO: O site atingiu o volume máximo de pedidos para hoje e as vendas estão temporariamente suspensas.
          </div>
        )}
        <AIProvider products={products} orders={orders}>
          <main className="main-content">
            {renderPage()}
          </main>
        </AIProvider>
        <Footer onNavigate={setCurrentPage} logoUrl={storeLogoUrl} footerText={storeFooterText} storeName={storeName} />
        {isMiniCartOpen && (

          <MiniCart isOpen={isMiniCartOpen} onClose={() => setIsMiniCartOpen(false)} items={cartItems} onUpdateQty={updateCartQty} onRemove={removeFromCart} onCheckout={() => setCurrentPage('cart')} />
        )}

        {/* 🚚 CINEMATIC MINIMAL TRUCK NOTIFICATION */}
        {freeShippingBalloon.visible && freeShippingBalloon.threshold && (
          <div style={{
            position: 'fixed', bottom: '32px', left: 0, width: '100vw',
            zIndex: 9999, pointerEvents: 'none'
          }}>
            {/* Truck + Card assembly */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              animation: freeShippingBalloon.popping
                ? 'truckDriveOut 0.8s cubic-bezier(0.4, 0, 0.6, 1) forwards'
                : 'truckDriveAcross 15s cubic-bezier(0.25, 0.1, 0.4, 1) forwards'
            }}>
              {/* Truck SVG – gold lineart */}
              <svg width="72" height="44" viewBox="0 0 72 44" fill="none"
                style={{ filter: 'drop-shadow(0 0 10px rgba(201,168,76,0.9)) drop-shadow(0 0 4px rgba(245,226,122,0.6))' }}
              >
                {/* Body */}
                <rect x="2" y="10" width="46" height="24" rx="3" stroke="#C9A84C" strokeWidth="1.5" fill="rgba(201,168,76,0.04)" />
                {/* Cab */}
                <path d="M48 18 L48 34 L68 34 L68 22 L58 10 L48 10 Z" stroke="#C9A84C" strokeWidth="1.5" fill="rgba(201,168,76,0.04)" strokeLinejoin="round" />
                {/* Windshield */}
                <path d="M51 13 L51 21 L66 21 L66 22 L58 13 Z" fill="rgba(245,226,122,0.12)" stroke="rgba(245,226,122,0.5)" strokeWidth="1" />
                {/* Rear wheel */}
                <circle cx="16" cy="37" r="5.5" stroke="#C9A84C" strokeWidth="1.5" fill="rgba(0,0,0,0.9)" />
                <circle cx="16" cy="37" r="2" fill="rgba(201,168,76,0.5)" />
                {/* Front wheel */}
                <circle cx="58" cy="37" r="5.5" stroke="#C9A84C" strokeWidth="1.5" fill="rgba(0,0,0,0.9)" />
                <circle cx="58" cy="37" r="2" fill="rgba(201,168,76,0.5)" />
                {/* Speed lines */}
                <line x1="0" y1="18" x2="10" y2="18" stroke="rgba(201,168,76,0.4)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="22" x2="14" y2="22" stroke="rgba(201,168,76,0.3)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="26" x2="8" y2="26" stroke="rgba(201,168,76,0.2)" strokeWidth="1" strokeDasharray="2 4" />
              </svg>

              {/* Message card */}
              <div style={{
                pointerEvents: 'all',
                marginLeft: '0px',
                padding: '12px 20px 12px 16px',
                background: 'rgba(10,8,3,0.94)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(201,168,76,0.2)',
                borderLeft: '2px solid rgba(201,168,76,0.7)',
                borderRadius: '0 10px 10px 0',
                display: 'flex', alignItems: 'center', gap: '14px',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(201,168,76,0.1)'
              }}
                onClick={() => {
                  setFreeShippingBalloon(prev => ({ ...prev, popping: true }));
                  if (user?.id) localStorage.setItem(`balloon_seen_${user.id}`, '1');
                  setTimeout(() => setFreeShippingBalloon({ visible: false, popping: false, threshold: null }), 800);
                }}
              >
                <div>
                  <div style={{ fontSize: '9px', letterSpacing: '3px', color: 'rgba(201,168,76,0.6)', fontWeight: '700', marginBottom: '3px', textTransform: 'uppercase' }}>
                    Entrega Syron Man
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                    Frete grátis a partir de{' '}
                    <span style={{ color: '#F5E27A', fontWeight: '800', textShadow: '0 0 12px rgba(245,226,122,0.5)' }}>
                      R$ {freeShippingBalloon.threshold.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <style>{`
              @keyframes truckDriveAcross {
                0%   { transform: translateX(-100%); opacity: 0; }
                5%   { opacity: 1; }
                40%  { transform: translateX(50vw) translateX(-50%); opacity: 1; }
                66%  { transform: translateX(50vw) translateX(-50%); opacity: 1; }
                95%  { transform: translateX(110vw); opacity: 1; }
                100% { transform: translateX(120vw); opacity: 0; }
              }
              @keyframes truckDriveOut {
                0%   { opacity: 1; transform: translateX(inherit); }
                100% { transform: translateX(120vw); opacity: 0; }
              }
            `}</style>
          </div>
        )}

      </div>
    </HelmetProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <NexusProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ThemeProvider>
      </NexusProvider>
    </AuthProvider>
  );
}

export default App;
