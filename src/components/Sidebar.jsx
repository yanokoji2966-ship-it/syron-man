import { Home, Grid, ShoppingBag, Heart, User, X, LogIn, LogOut, Settings, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';
const Sidebar = ({ categories = [], isOpen, onClose, onNavigate, logoUrl = '/logo_refined.png' }) => {
    const { user, signOut, isAdmin } = useAuth();
    const menuItems = [
        { name: 'Início', icon: <Home size={20} />, id: 'home' },
        { name: 'Categorias', icon: <Grid size={20} />, id: 'categories' },
        { name: 'Ofertas', icon: <ShoppingBag size={20} />, id: 'home' },
        { name: 'Meus Favoritos', icon: <Heart size={20} />, id: 'favorites' },
        { name: 'Meus Pedidos', icon: <ShoppingBag size={20} />, id: 'profile' },
        { name: 'Meu Perfil', icon: <User size={20} />, id: 'profile' },
    ];

    if (isAdmin) {
        menuItems.push({ name: 'Painel Admin', icon: <Settings size={20} />, id: 'admin' });
    }

    const handleItemClick = (id) => {
        if (onNavigate) {
            onNavigate(id);
        }
        onClose();
    };

    const handleLogout = async () => {
        await signOut();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="sidebar-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.aside
                        className="sidebar"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <div className="sidebar-header">
                            <div className="logo">
                                <img src={logoUrl} alt="SYRON Man" className="logo-img" style={{ height: '50px' }} />
                            </div>
                            <button onClick={onClose} className="close-btn">
                                <X size={24} color="white" />
                            </button>
                        </div>

                        <nav className="sidebar-nav">
                            {menuItems.map((item, index) => (
                                <button key={index} onClick={() => handleItemClick(item.id)} className="sidebar-link">
                                    <span className="sidebar-icon">{item.icon}</span>
                                    {item.name}
                                </button>
                            ))}

                            {categories.length > 0 && (
                                <div className="sidebar-submenu animate-fade" style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Layers size={10} /> Departamentos
                                    </div>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => { onNavigate('home'); window.dispatchEvent(new CustomEvent('filterCategory', { detail: cat.id })); onClose(); }}
                                            className="sidebar-link sub-link"
                                            style={{ padding: '8px 12px', fontSize: '13px', opacity: 0.8 }}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="sidebar-divider"></div>
                            {user ? (
                                <button onClick={handleLogout} className="sidebar-link logout-link">
                                    <span className="sidebar-icon"><LogOut size={20} /></span>
                                    Sair
                                </button>
                            ) : (
                                <button onClick={() => onNavigate('login')} className="sidebar-link login-link">
                                    <span className="sidebar-icon"><LogIn size={20} /></span>
                                    Entrar
                                </button>
                            )}
                        </nav>

                        <div className="sidebar-footer">
                            <p>© 2025 SYRON MAN. <br /> Todos os direitos reservados.</p>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
