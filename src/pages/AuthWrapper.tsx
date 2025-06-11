import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const publicPaths = ['/login'];

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isPublicPath = publicPaths.includes(location.pathname);

        if (!session && !isPublicPath) {
          navigate('/login', {
            replace: true,
            state: { from: location.pathname },
          });
          return;
        }

        if (session) {
          const { data: roleData, error } = await supabase
            .from('user_roles')
            .select('role, area_id')
            .eq('user_id', session.user.id)
            .single();

          if (error) throw error;

          const role = roleData?.role ?? 'user';
          const redirectPath =
            role === 'admin' ? '/admin-dashboard' :
            role === 'trabajador' ? '/worker-dashboard' :
            '/my-tickets';

          const rolePaths: Record<string, string[]> = {
            admin: ['/admin-dashboard', '/create-ticket'],
            trabajador: ['/worker-dashboard', '/create-ticket'],
            user: ['/my-tickets', '/create-ticket'],
          };
          const allowedPaths = rolePaths[role] ?? [];
          const isAllowed = allowedPaths.some(path =>
            location.pathname === path || location.pathname.startsWith(path)
          );

          if (isPublicPath) {
            navigate(redirectPath, { replace: true });
            return;
          }

          if (!isAllowed) {
            navigate(redirectPath, { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error('AuthWrapper error:', error);
        if (!publicPaths.includes(location.pathname)) {
          navigate('/login', { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        checkAuth();
      } else if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}