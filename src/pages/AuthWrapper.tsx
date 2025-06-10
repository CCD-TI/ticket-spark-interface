// src/pages/AuthWrapper.tsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { getUserRoleFromSession } from '@/lib/auth';

// Rutas públicas que no requieren autenticación
const publicPaths = ['/login'];

export function AuthWrapper({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const roleCheckInProgress = useRef(false);

    useEffect(() => {
        let mounted = true;
        let authListener: { subscription: any } | null = null;

        const checkUser = async () => {
            if (roleCheckInProgress.current) return;

            try {
                roleCheckInProgress.current = true;

                if (publicPaths.includes(location.pathname)) {
                    if (mounted) setLoading(false);
                    return;
                }

                const { user, role, error } = await getUserRoleFromSession();

                if (!user || error) {
                    if (mounted) {
                        navigate('/login', { replace: true, state: { from: location.pathname } });
                    }
                    return;
                }

                if (mounted) {
                    const rolePaths = {
                        admin: ['/admin-dashboard', '/create-ticket'],
                        user: ['/my-tickets', '/create-ticket'],
                    };

                    const allowedPaths = rolePaths[role] || [];
                    const isAllowed = allowedPaths.some(path => location.pathname.startsWith(path));

                    if (!isAllowed) {
                        navigate(allowedPaths[0], { replace: true });
                        return;
                    }
                }

            } catch (error) {
                console.error('Error en AuthWrapper:', error);
                if (mounted) {
                    navigate('/login', { replace: true });
                }
            } finally {
                roleCheckInProgress.current = false;
                if (mounted) setLoading(false);
            }
        };


        // Solo ejecutar la verificación si no estamos en una ruta pública
        if (!publicPaths.includes(location.pathname)) {
            checkUser();
        } else {
            setLoading(false);
        }

        // Configurar el listener de cambios de autenticación
        const { data } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!session && !publicPaths.includes(location.pathname)) {
                    if (mounted) {
                        navigate('/login', {
                            replace: true,
                            state: { from: location.pathname }
                        });
                    }
                } else if (session && !publicPaths.includes(location.pathname)) {
                    await checkUser();
                }
            }
        );

        authListener = data;

        return () => {
            mounted = false;
            roleCheckInProgress.current = false;
            authListener?.subscription?.unsubscribe();
        };
    }, [navigate, location.pathname]); // Solo dependemos de location.pathname, no de todo el objeto location

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}