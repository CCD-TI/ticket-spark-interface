import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Users, ArrowLeft, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createTicket, getCurrentUser } from "@/lib/supabase";

const CreateTicketPage = () => {
  const [formData, setFormData] = useState({
    nombre_usuario: "",
    cargo_id: "",
    proyecto_id: "",
    tipo_problema_id: "",
    asunto: "",
    descripcion: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const cargos = [
    { id: 1, nombre: "Marketing" },
    { id: 2, nombre: "Académico" },
    { id: 3, nombre: "Campaña" },
    { id: 4, nombre: "Soporte" },
    { id: 5, nombre: "Comercial" },
    { id: 6, nombre: "Administrativo" }
  ];

  const tiposProblema = [
    { id: 1, nombre: "Error en el sistema" },
    { id: 2, nombre: "No cargan archivos" },
    { id: 3, nombre: "Bug" },
    { id: 4, nombre: "Otro" }
  ];

  const proyectos = [
    { id: 1, nombre: "CCD" },
    { id: 2, nombre: "EGP" },
    { id: 3, nombre: "Digital College" },
    { id: 4, nombre: "Vicidial" },
    { id: 5, nombre: "Pasar Base" },
    { id: 6, nombre: "IAC" },
    { id: 7, nombre: "Masivos" },
    { id: 8, nombre: "Gestor" },
    { id: 9, nombre: "CRM" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre_usuario || !formData.cargo_id || !formData.tipo_problema_id || !formData.asunto) {
      toast({
        title: "Error de validación",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: userData, error: userError } = await getCurrentUser();
      if (userError) throw userError;
      
      if (!userData?.user) {
        throw new Error("No se pudo obtener la información del usuario");
      }

      const ticketData = {
        ...formData,
        cargo_id: parseInt(formData.cargo_id),
        proyecto_id: formData.proyecto_id ? parseInt(formData.proyecto_id) : null,
        tipo_problema_id: parseInt(formData.tipo_problema_id),
        user_id: userData.user.id,
        status: 'open'
      };

      const { data, error } = await createTicket(ticketData);
      
      if (error) throw error;

      toast({
        title: "Ticket creado exitosamente",
        description: `Tu ticket #${data?.[0]?.id?.substring(0, 8)} ha sido enviado y será revisado por nuestro equipo.`,
      });
      
      setFormData({
        nombre_usuario: "",
        cargo_id: "",
        proyecto_id: "",
        tipo_problema_id: "",
        asunto: "",
        descripcion: ""
      });
      
      navigate("/my-tickets");
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast({
        title: "Error al crear ticket",
        description: "Ocurrió un error al enviar tu ticket. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombre_usuario: "",
      cargo_id: "",
      proyecto_id: "",
      tipo_problema_id: "",
      asunto: "",
      descripcion: ""
    });
    navigate("/my-tickets");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <img
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              src="/favicon.ico"
              alt="Logo"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Crear Nuevo Ticket</h1>
              <p className="text-sm sm:text-base text-gray-400">Envía tu consulta o reporte de problema</p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <Card className="shadow-xl border-gray-700 bg-gray-800 relative">
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl text-white">Información del Ticket</CardTitle>
                <CardDescription className="text-sm text-gray-400">
                  Completa todos los campos marcados con (*) para enviar tu ticket
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex items-center gap-2 h-10 text-black sm:h-12 text-sm sm:text-base font-medium border-gray-600 hover:bg-gray-700 hover:border-gray-500"
              >
                <ArrowLeft className="h-4 w-4 text-black" />
                Regresar
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Primera fila - Información del solicitante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nombre_usuario" className="text-sm font-medium text-gray-300">
                    Nombre del Solicitante *
                  </Label>
                  <Input
                    id="nombre_usuario"
                    placeholder="Tu nombre completo"
                    value={formData.nombre_usuario}
                    onChange={(e) => setFormData({...formData, nombre_usuario: e.target.value})}
                    className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo_id" className="text-sm font-medium text-gray-300">
                    Cargo / Departamento *
                  </Label>
                  <Select
                    value={formData.cargo_id}
                    onValueChange={(value) => setFormData({...formData, cargo_id: value})}
                    required
                  >
                    <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Selecciona tu cargo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {cargos.map((cargo) => (
                        <SelectItem 
                          key={cargo.id} 
                          value={cargo.id.toString()}
                          className="text-sm sm:text-base hover:bg-gray-700 focus:bg-gray-700 py-2"
                        >
                          {cargo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Segunda fila - Proyecto e Incidente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="proyecto_id" className="text-sm font-medium text-gray-300">
                    Proyecto Asociado
                  </Label>
                  <Select
                    value={formData.proyecto_id}
                    onValueChange={(value) => setFormData({...formData, proyecto_id: value})}
                  >
                    <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Selecciona un proyecto (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {proyectos.map((proyecto) => (
                        <SelectItem 
                          key={proyecto.id} 
                          value={proyecto.id.toString()}
                          className="text-sm sm:text-base hover:bg-gray-700 focus:bg-gray-700 py-2"
                        >
                          {proyecto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo_problema_id" className="text-sm font-medium text-gray-300">
                    Tipo de Problema *
                  </Label>
                  <Select
                    value={formData.tipo_problema_id}
                    onValueChange={(value) => setFormData({...formData, tipo_problema_id: value})}
                    required
                  >
                    <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary">
                      <SelectValue placeholder="Selecciona el tipo de problema" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      {tiposProblema.map((tipo) => (
                        <SelectItem 
                          key={tipo.id} 
                          value={tipo.id.toString()}
                          className="text-sm sm:text-base hover:bg-gray-700 focus:bg-gray-700 py-2"
                        >
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tercera fila - Asunto */}
              <div className="space-y-2">
                <Label htmlFor="asunto" className="text-sm font-medium text-gray-300">
                  Asunto / Título del Ticket *
                </Label>
                <Input
                  id="asunto"
                  placeholder="Resumen breve del problema o consulta"
                  value={formData.asunto}
                  onChange={(e) => setFormData({...formData, asunto: e.target.value})}
                  className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              {/* Cuarta fila - Descripción */}
              <div className="space-y-2">
                <Label htmlFor="descripcion" className="text-sm font-medium text-gray-300">
                  Descripción del Problema
                </Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe detalladamente el problema, incluyendo pasos para reproducirlo si aplica..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-y bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-500">
                  Proporciona todos los detalles posibles para ayudarnos a resolver tu consulta más rápidamente
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-700">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 text-black h-10 sm:h-12 text-sm sm:text-base font-medium border-gray-600 hover:bg-gray-700 hover:border-gray-500"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTicketPage;