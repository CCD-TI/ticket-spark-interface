import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { getCurrentUser, getUserRole, createTicket, fetchAreas, fetchProyectos, fetchTiposProblema, supabase } from '@/lib/supabase';
import { Areas, Proyecto, TipoProblema, Priority, TicketInsert } from '@/types/ticket';

const CreateTicketPage = () => {
  const [formData, setFormData] = useState({
    asunto: '',
    descripcion: '',
    tipo_problema_id: '',
    proyecto_id: '',
    area_id: null,
    nombre_usuario: '',
    priority: 'low' as Priority,
  });
  const [areas, setAreas] = useState<Areas[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [tiposProblema, setTiposProblema] = useState<TipoProblema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await getCurrentUser();
      if (userError || !userData) {
        navigate('/login');
        return;
      }

      const [{ role, error: roleError }, { data: areasData }, { data: proyectosData }, { data: tiposData }] =
        await Promise.all([
          getUserRole(userData.id),
          fetchAreas(),
          fetchProyectos(),
          fetchTiposProblema(),
        ]);

      if (roleError) throw roleError;

      setUserRole(role);
      setAreas(areasData ?? []);
      setProyectos(proyectosData ?? []);
      setTiposProblema(tiposData ?? []);
      setFormData((prev) => ({ ...prev, nombre_usuario: userData.email ?? '' }));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsFetching(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verificación adicional del usuario
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast({ title: 'Error', description: 'No hay sesión activa', variant: 'destructive' });
        return;
      }

      const user = session.user;

      // Verifica el rol del usuario
      const { role, error: roleError } = await getUserRole(user.id);
      if (roleError || !role) {
        toast({ title: 'Error', description: 'No se pudo verificar el rol del usuario', variant: 'destructive' });
        return;
      }

      // Construye el ticket
      const ticketData: TicketInsert = {
        user_id: user.id, // Asegúrate de usar el ID correcto
        nombre_usuario: formData.nombre_usuario,
        proyecto_id: role === 'trabajador' && formData.proyecto_id ? parseInt(formData.proyecto_id) : null,
        tipo_problema_id: parseInt(formData.tipo_problema_id),
        area_id: role === 'trabajador' && formData.area_id ? parseInt(formData.area_id) : 1,
        asunto: formData.asunto,
        descripcion: formData.descripcion || null,
        status: 'open',
        priority: role === 'trabajador' ? formData.priority : 'low',
        visto: false,
        created_at: new Date().toISOString(),
        responded_at: null,
      };

      // Crea el ticket
      const { data, error } = await createTicket(ticketData);
      console.log('User ID in payload:', ticketData.user_id);
      if (error) throw error;

      toast({
        title: 'Ticket creado',
        description: `El ticket #${data?.id.substring(0, 8)} ha sido creado exitosamente.`,
      });
      navigate('/my-tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el ticket. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      asunto: '',
      descripcion: '',
      tipo_problema_id: '',
      proyecto_id: '',
      area_id: null,
      nombre_usuario: '',
      priority: 'low',
    });
    navigate('/my-tickets');
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              src="/favicon.ico"
              alt="Logo"
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/80')}
            />
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Crear Nuevo Ticket</h1>
              <p className="text-sm sm:text-base text-gray-400">Envía tu consulta o reporte de problema</p>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-gray-700 bg-gray-800">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl text-white">Información del Ticket</CardTitle>
                <CardDescription className="text-sm text-gray-400">
                  Completa todos los campos marcados con (*) para enviar tu ticket
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex items-center gap-2 h-10 sm:h-12 text-sm sm:text-base font-medium text-white border-gray-600 hover:bg-gray-700 hover:border-gray-500"
              >
                <ArrowLeft className="h-4 w-4" />
                Regresar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre_usuario" className="text-sm font-medium text-gray-300">
                    Nombre del Solicitante *
                  </Label>
                  <Input
                    id="nombre_usuario"
                    placeholder="Tu nombre completo"
                    value={formData.nombre_usuario}
                    onChange={(e) => setFormData({ ...formData, nombre_usuario: e.target.value })}
                    className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>
                {userRole === 'trabajador' && (
                  <div className="space-y-2">
                    <Label htmlFor="area_id" className="text-sm font-medium text-gray-300">
                      Área *
                    </Label>
                    <Select
                      value={formData.area_id}
                      onValueChange={(value) => setFormData({ ...formData, area_id: parseInt(value) })}
                      required
                    >
                      <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Selecciona un área" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id.toString()} className="py-2">
                            {area.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tipo_problema_id" className="text-sm font-medium text-gray-300">
                    Tipo de Problema *
                  </Label>
                  <Select
                    value={formData.tipo_problema_id}
                    onValueChange={(value) => setFormData({ ...formData, tipo_problema_id: value })}
                    required
                  >
                    <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Selecciona el tipo de problema" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {tiposProblema.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()} className="py-2">
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {userRole === 'trabajador' && (
                  <div className="space-y-2">
                    <Label htmlFor="proyecto_id" className="text-sm font-medium text-gray-300">
                      Proyecto
                    </Label>
                    <Select
                      value={formData.proyecto_id}
                      onValueChange={(value) => setFormData({ ...formData, proyecto_id: value })}
                    >
                      <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Selecciona un proyecto (opcional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        {proyectos.map((proyecto) => (
                          <SelectItem key={proyecto.id} value={proyecto.id.toString()} className="py-2">
                            {proyecto.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {userRole === 'trabajador' && (
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-300">
                    Prioridad *
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                    required
                  >
                    <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Selecciona la prioridad" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="asunto" className="text-sm font-medium text-gray-300">
                  Asunto / Título del Ticket *
                </Label>
                <Input
                  id="asunto"
                  placeholder="Resumen breve del problema o consulta"
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-sm font-medium text-gray-300">
                  Descripción del Problema
                </Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe detalladamente el problema, incluyendo pasos para reproducirlo si aplica..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-y bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-500">
                  Proporciona todos los detalles posibles para ayudarnos a resolver tu consulta más rápidamente
                </p>
              </div>
              {userRole === 'user' && (
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Ticket
                      </>
                    )}
                  </Button>
                </div>
              )}
              {userRole === 'trabajador' && (
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Ticket
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium text-white border-gray-600 hover:bg-gray-700 hover:border-gray-500"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTicketPage;