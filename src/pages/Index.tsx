
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Users, ArrowLeft, Send, X } from "lucide-react";

const CreateTicketPage = () => {
  const [formData, setFormData] = useState({
    requesterName: "",
    department: "",
    project: "",
    incidentType: "",
    subject: "",
    description: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const departments = [
    "Ventas",
    "Marketing", 
    "Desarrollo",
    "Soporte Técnico",
    "Recursos Humanos",
    "Contabilidad",
    "TI",
    "Operaciones"
  ];

  const incidentTypes = [
    "Problema Técnico",
    "Bug / Error", 
    "Pregunta / Consulta",
    "Solicitud de Característica",
    "Otro"
  ];

  // Simulación de proyectos cargados dinámicamente
  const projects = [
    "Proyecto Alpha",
    "Plataforma Beta",
    "Sistema Gamma",
    "Aplicación Delta"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.requesterName || !formData.department || !formData.incidentType || !formData.subject) {
      toast({
        title: "Error de validación",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulación de envío
    setTimeout(() => {
      toast({
        title: "Ticket creado exitosamente",
        description: "Tu ticket ha sido enviado y será revisado por nuestro equipo.",
      });
      
      // Resetear formulario
      setFormData({
        requesterName: "",
        department: "",
        project: "",
        incidentType: "",
        subject: "",
        description: ""
      });
      
      setIsLoading(false);
    }, 2000);
  };

  const handleCancel = () => {
    setFormData({
      requesterName: "",
      department: "",
      project: "",
      incidentType: "",
      subject: "",
      description: ""
    });
    
    toast({
      title: "Formulario cancelado",
      description: "Los datos del formulario han sido descartados.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Ticket className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Crear Nuevo Ticket</h1>
              <p className="text-muted-foreground">Envía tu consulta o reporte de problema</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Sistema de Gestión de Tickets - Portal de Usuario</span>
          </div>
        </div>

        {/* Formulario */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl text-card-foreground">Información del Ticket</CardTitle>
            <CardDescription>
              Completa todos los campos marcados con (*) para enviar tu ticket
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Primera fila - Información del solicitante */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="requesterName" className="text-sm font-medium">
                    Nombre del Solicitante *
                  </Label>
                  <Input
                    id="requesterName"
                    placeholder="Tu nombre completo"
                    value={formData.requesterName}
                    onChange={(e) => setFormData({...formData, requesterName: e.target.value})}
                    className="h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Área / Departamento *
                  </Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({...formData, department: value})}
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecciona tu departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Segunda fila - Proyecto e Incidente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project" className="text-sm font-medium">
                    Proyecto Asociado
                  </Label>
                  <Select
                    value={formData.project}
                    onValueChange={(value) => setFormData({...formData, project: value})}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecciona un proyecto (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Los proyectos se cargan dinámicamente desde la base de datos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incidentType" className="text-sm font-medium">
                    Tipo de Incidente *
                  </Label>
                  <Select
                    value={formData.incidentType}
                    onValueChange={(value) => setFormData({...formData, incidentType: value})}
                    required
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecciona el tipo de incidente" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tercera fila - Asunto */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                  Asunto / Título del Ticket *
                </Label>
                <Input
                  id="subject"
                  placeholder="Resumen breve del problema o consulta"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="h-12"
                  required
                />
              </div>

              {/* Cuarta fila - Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Descripción del Problema
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe detalladamente el problema, incluyendo pasos para reproducirlo si aplica..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="min-h-[120px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Proporciona todos los detalles posibles para ayudarnos a resolver tu consulta más rápidamente
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-12 text-base font-medium"
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
                  className="flex-1 sm:flex-none h-12 text-base font-medium"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer informativo */}
        <div className="mt-8 text-center">
          <div className="bg-card/30 backdrop-blur-sm rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground">
              <strong>Tiempo de respuesta:</strong> Los tickets son revisados dentro de las próximas 24 horas hábiles.
              Para emergencias, contacta directamente al equipo de soporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketPage;
