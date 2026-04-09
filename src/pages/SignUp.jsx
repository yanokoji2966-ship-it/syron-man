import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, UserPlus, User, Github, Chrome, Eye, EyeOff } from 'lucide-react';
import './SignUp.css';

const SignUp = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('As senhas não coincidem.');
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await signUp({ email, password });
            if (error) throw error;

            // Sucesso!
            setError('Cadastro realizado com sucesso! Faça login para continuar.');
            setTimeout(() => {
                onNavigate('login');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Falha ao cadastrar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setError(null);
        try {
            const { error } = await signInWithGoogle();
            if (error) throw error;
            // If successful, AuthContext should handle navigation or state update
        } catch (err) {
            setError(err.message || 'Falha ao cadastrar com Google.');
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-glass-card">
                <div className="signup-header">
                    <div className="signup-logo-container">
                        <div className="signup-logo-glow"></div>
                        <UserPlus size={32} className="signup-icon-main" />
                    </div>
                    <h1>Crie sua conta</h1>
                    <p>Junte-se a nós para uma experiência completa</p>
                </div>

                {error && (
                    <div className={`signup-message ${error.includes('Verifique') ? 'success' : 'error'}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignUp} className="signup-form">
                    <div className="signup-input-group">
                        <label htmlFor="email">E-mail</label>
                        <div className="signup-input-wrapper">
                            <Mail size={20} className="signup-field-icon" />
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

                    <div className="signup-input-group">
                        <label htmlFor="password">Senha</label>
                        <div className="signup-input-wrapper">
                            <Lock size={20} className="signup-field-icon" />
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
                                className="signup-field-icon-right"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex="-1"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="signup-input-group">
                        <label htmlFor="confirmPassword">Confirmar Senha</label>
                        <div className="signup-input-wrapper">
                            <Lock size={20} className="signup-field-icon" />
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="signup-field-icon-right"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex="-1"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="signup-submit-btn" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Cadastrar'}
                    </button>
                </form>

                <p className="signup-footer">
                    Já tem uma conta? <span onClick={() => onNavigate('login')} className="signup-footer-link">Entrar</span>
                </p>
            </div>
        </div>
    );
};

export default SignUp;
