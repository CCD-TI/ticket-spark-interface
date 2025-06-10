
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Ticket, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signInWithEmail, signInWithGoogle, supabase } from "@/lib/supabase";
import { FcGoogle } from "react-icons/fc";
import { getUserRoleFromSession } from "@/lib/auth";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await signInWithGoogle();

      if (error) throw error;

      // No necesitamos redirigir manualmente aquí
      // El AuthWrapper manejará la redirección
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      toast({
        title: "Error de autenticación",
        description: "Ocurrió un error al intentar iniciar sesión con Google. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Después de login exitoso
    const { user, role } = await getUserRoleFromSession();

    toast({
      title: `Bienvenido ${role === 'admin' ? 'Administrador' : 'Usuario'}`,
      description: role === 'admin'
        ? "Acceso al panel de administración concedido."
        : "Bienvenido al portal de tickets.",
    });

    navigate(role === 'admin' ? "/admin-dashboard" : "/my-tickets");
  };

  useEffect(() => {
    // Verificar si ya está autenticado
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        const role = roleData?.role || 'user';
        navigate(role === 'admin' ? '/admin-dashboard' : '/my-tickets', { replace: true });
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-primary/20 rounded-lg">
                  <img className="w-36 h-36 -mb-2" src="favicon.ico" alt="" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Sistema de Tickets</h1>
                  <p className="text-gray-400">Portal de Acceso</p>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <Card className="shadow-lg border-gray-700 bg-gray-800">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl text-white text-center">Iniciar Sesión</CardTitle>
                <CardDescription className="text-gray-400 text-center">
                  Usa tu cuenta de Google para acceder al sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full h-12 text-base font-medium bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FcGoogle className="mr-2 h-5 w-5" />
                  )}
                  Iniciar con Google
                </Button>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-400">
                ¿Problemas para iniciar sesión? Contacta a soporte técnico
              </p>
            </div>
          </div>
        </div>
  );
};

export default LoginPage;
