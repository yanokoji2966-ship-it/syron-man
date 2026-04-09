import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Github, Chrome, Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await signIn({ email, password });
            if (error) throw error;
            onNavigate('profile');
        } catch (err) {
            setError(err.message || 'Falha ao entrar. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
        } catch (err) {
            setError(err.message || 'Falha ao entrar com Google.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-glass-card">
                <div className="login-header">
                    <div className="login-logo-container">
                        <div className="login-logo-glow"></div>
                        <LogIn size={32} className="login-icon-main" />
                    </div>
                    <h1>Bem-vindo de volta</h1>
                    <p>Entre para acessar sua conta</p>
                </div>

                {error && <div className="login-error-message">{error}</div>}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="login-input-group">
                        <label htmlFor="email">E-mail</label>
                        <div className="login-input-wrapper">
                            <Mail size={20} className="login-field-icon" />
                            <input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="login-input-group">
                        <div className="login-label-row">
                            <label htmlFor="password">Senha</label>
                            <span onClick={() => onNavigate('forgot-password')} className="login-forgot-link">Esqueceu?</span>
                        </div>
                        <div className="login-input-wrapper">
                            <Lock size={20} className="login-field-icon" />
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="login-field-icon-right"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <p className="login-footer">
                    Não tem uma conta? <span onClick={() => onNavigate('signup')} className="login-footer-link">Cadastre-se</span>
                </p>
            </div>
        </div>
    );
};

export default Login;
