import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { signInWithGoogle } from '@/lib/supabase';
import { FcGoogle } from 'react-icons/fc';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      toast({
        title: 'Error de autenticación',
        description: 'Ocurrió un error al intentar iniciar sesión con Google. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Error',
      description: 'Inicio de sesión con email no está habilitado. Usa Google.',
      variant: 'destructive',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <img
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
                src="/favicon.ico"
                alt="Logo"
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/128')}
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Sistema de Tickets</h1>
              <p className="text-sm sm:text-base text-gray-400">Portal de Acceso</p>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-gray-700 bg-gray-800">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl text-white text-center">Iniciar Sesión</CardTitle>
            <CardDescription className="text-sm sm:text-base text-gray-400 text-center">
              Usa tu cuenta de Google para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-300">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                  disabled
                  placeholder="Email login deshabilitado"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                    disabled
                    placeholder="Email login deshabilitado"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    disabled
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-10 sm:h-12 text-sm sm:text-base" disabled>
                Iniciar Sesión
              </Button>
            </form>
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">O</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
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
        <div className="text-center mt-4 sm:mt-6">
          <p className="text-xs sm:text-sm text-gray-400">
            ¿Problemas para iniciar sesión? Contacta a soporte técnico
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;