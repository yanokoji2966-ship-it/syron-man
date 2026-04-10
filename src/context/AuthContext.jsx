import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { SUPER_ADMIN_EMAIL } from '../constants';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isMfaVerified, setIsMfaVerified] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchUserRole = async (email) => {
        try {
            if (!supabase || !email) return;
            console.log('AuthContext: Buscando permissões via RPC...');

            // Tentativa via RPC V6 (Alta Precisão e Persistência)
            const { data: rpcRole, error: rpcError } = await supabase.rpc('get_my_role_v6');

            if (!rpcRole && !rpcError) {
                // Se der null sem erro, o usuário não é admin
                setUserRole(null);
                return;
            }

            if (!rpcError && rpcRole) {
                console.log(`✅ AuthContext: Role detectada via RPC V6 para ${email}:`, rpcRole);
                setUserRole(rpcRole);
                return;
            }

            if (rpcError) {
                console.warn('⚠️ AuthContext: RPC get_my_role_v6 falhou. Tentando fallback...', rpcError);
            }

            // Fallback: Consulta direta (Pode falhar se o RLS estiver em loop)
            const { data, error } = await supabase
                .from('admin_users')
                .select('role')
                .eq('email', email.toLowerCase())
                .single();

            if (data && !error) {
                console.log(`✅ AuthContext: Role encontrada (fallback) para ${email}:`, data.role);
                setUserRole(data.role);
            } else if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
                console.log('⚡ AuthContext: Aplicando role super_admin via bypass de e-mail proprietário.');
                setUserRole('super_admin');
            } else {
                console.warn(`⚠️ AuthContext: Nenhuma role encontrada para ${email}`, error);
                setUserRole(null);
            }
        } catch (err) {
            console.error('❌ AuthContext: Erro fatal ao buscar role:', err.message);
            setUserRole(null);
        }
    };

    useEffect(() => {
        // Timeout de segurança para o contexto de auth
        const authTimeout = setTimeout(() => {
            if (loading) {
                console.warn('AuthContext: Timeout de inicialização atingido. Forçando loading=false');
                setLoading(false);
            }
        }, 45000); // Aumentado para 45s (segurança máxima para redes críticas)

        // Check active sessions and sets the user
        const getSession = async () => {
            try {
                if (!supabase) {
                    setLoading(false);
                    return;
                }

                // Promise.race para evitar que getSession trave infinitamente (10s para redes lentas)
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 30000)); // 30s para redes lentas

                try {
                    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
                    setUser(session?.user ?? null);
                    
                    if (session?.user) {
                        // RPC com timeout interno de 12s para não travar o boot
                        const rolePromise = fetchUserRole(session.user.email);
                        const roleTimeout = new Promise(r => setTimeout(r, 12000));
                        await Promise.race([rolePromise, roleTimeout]);
                        
                        // AAL Check (MFA/2FA)
                        const { data: { currentLevel } } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                        setIsMfaVerified(currentLevel === 'aal2');
                        if (currentLevel !== 'aal2') {
                            console.warn('⚠️ [Segurança Auth] Usuário logado sem autenticação em dois fatores (MFA/2FA) ativa.');
                        }
                    }
                } catch (timeoutErr) {
                    console.error('AuthContext: Falha/Timeout ao buscar sessão:', timeoutErr);
                    // Continua sem sessão mas libera o loading
                }
            } catch (err) {
                console.error('Erro ao inicializar sessão:', err);
            } finally {
                setLoading(false);
                clearTimeout(authTimeout);
            }
        };

        getSession();

        // Listen for changes on auth state
        const { data: { subscription } } = supabase ? supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                setUser(session?.user ?? null);
                if (session?.user) {
                    await fetchUserRole(session.user.email);
                    const { data: { currentLevel } } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                    setIsMfaVerified(currentLevel === 'aal2');
                } else {
                    setUserRole(null);
                    setIsMfaVerified(false);
                }
            } catch (err) {
                console.error('Erro no observador de auth:', err);
            } finally {
                setLoading(false);
            }
        }) : { data: { subscription: null } };

        return () => {
            subscription?.unsubscribe();
            clearTimeout(authTimeout);
        };
    }, []);

    const value = {
        signUp: (data) => {
            if (!supabase) {
                return Promise.reject(new Error('Supabase não configurado. Configure as credenciais no arquivo .env'));
            }
            return supabase.auth.signUp(data);
        },
        signIn: (data) => {
            if (!supabase) {
                return Promise.reject(new Error('Supabase não configurado. Configure as credenciais no arquivo .env'));
            }
            return supabase.auth.signInWithPassword(data);
        },
        signOut: async () => {
            try {
                if (supabase) {
                    supabase.auth.signOut().catch(console.error); // Não usa await para não dar timeout
                }
            } catch (err) {
                console.error('AuthContext: Erro ao deslogar:', err);
            } finally {
                // Limpeza definitiva
                localStorage.removeItem('syronman_cart');
                localStorage.removeItem('syronman_favorites');
                window.location.href = '/';
            }
        },
        signInWithGoogle: async () => {
            if (!supabase) {
                return Promise.reject(new Error('Supabase não configurado. Configure as credenciais no arquivo .env'));
            }
            return supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
        },
        user,
        userRole,
        loading,
        refreshRole: () => fetchUserRole(user?.email),
        // Fallback de segurança: Se o banco demorar ou falhar, o email do dono ainda é reconhecido (SaaS-ready mas com fail-safe)
        isAdmin: !!userRole || (user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()),
        isSuperAdmin: userRole === 'super_admin' || (user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()),
        isStaff: userRole === 'staff',
        isMfaVerified
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
