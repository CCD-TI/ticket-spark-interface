
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Ticket, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  Eye,
  MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const MyTicketsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Datos de ejemplo para tickets del usuario
  const myTickets = [
    {
      id: "TCK-004",
      subject: "Problema con la carga de archivos",
      description: "No puedo subir documentos PDF al sistema, siempre me da error...",
      incidentType: "Problema Técnico",
      status: "pending",
      priority: "medium",
      createdAt: "2024-01-16 10:30",
      responses: []
    },
    {
      id: "TCK-005",
      subject: "Solicitud de acceso a módulo de reportes",
      description: "Necesito acceso al módulo de reportes avanzados para mi proyecto...",
      incidentType: "Solicitud de Característica",
      status: "in-progress",
      priority: "low",
      createdAt: "2024-01-15 14:20",
      responses: [
        {
          admin: "Sara Admin",
          message: "Hemos recibido tu solicitud. Estamos evaluando los permisos necesarios.",
          timestamp: "2024-01-15 15:30"
        },
        {
          admin: "Sara Admin",
          message: "Se ha aprobado tu acceso. Los permisos estarán activos en las próximas 24 horas.",
          timestamp: "2024-01-16 09:15"
        }
      ]
    },
    {
      id: "TCK-006",
      subject: "Consulta sobre proceso de facturación",
      description: "¿Cuál es el procedimiento para generar facturas mensuales?",
      incidentType: "Pregunta / Consulta",
      status: "resolved",
      priority: "low",
      createdAt: "2024-01-14 11:45",
      responses: [
        {
          admin: "Juan Admin",
          message: "Para generar facturas mensuales: 1) Ve a Facturación > Generar, 2) Selecciona el período, 3) Haz clic en 'Procesar'. Si tienes más dudas, no dudes en contactarnos.",
          timestamp: "2024-01-14 13:20"
        }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "in-progress": "bg-blue-100 text-blue-800 border-blue-200", 
      resolved: "bg-green-100 text-green-800 border-green-200"
    };
    
    const labels = {
      pending: "Pendiente",
      "in-progress": "En Progreso",
      resolved: "Resuelto"
    };

    const icons = {
      pending: <Clock className="h-3 w-3" />,
      "in-progress": <AlertCircle className="h-3 w-3" />,
      resolved: <CheckCircle className="h-3 w-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-orange-100 text-orange-800",
      high: "bg-red-100 text-red-800"
    };
    
    const labels = {
      low: "Baja",
      medium: "Media", 
      high: "Alta"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority as keyof typeof styles]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const filteredTickets = myTickets.filter(ticket => 
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: myTickets.length,
    pending: myTickets.filter(t => t.status === "pending").length,
    inProgress: myTickets.filter(t => t.status === "in-progress").length,
    resolved: myTickets.filter(t => t.status === "resolved").length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Ticket className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mis Tickets</h1>
              <p className="text-muted-foreground">Portal de Usuario - Gestión de Solicitudes</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => navigate("/")} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Ticket
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/login")}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Ticket className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En Progreso</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resueltos</p>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar en mis tickets</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por ID o asunto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{ticket.subject}</h3>
                      <span className="text-sm text-muted-foreground">#{ticket.id}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      <span className="text-xs text-muted-foreground">
                        Creado: {ticket.createdAt}
                      </span>
                      {ticket.responses.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.responses.length} respuesta(s)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTicket(ticket)}
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredTickets.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron tickets</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "No hay tickets que coincidan con tu búsqueda." : "Aún no has creado ningún ticket."}
                </p>
                <Button onClick={() => navigate("/")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Crear Primer Ticket
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  Ticket #{selectedTicket.id}
                  {getStatusBadge(selectedTicket.status)}
                </CardTitle>
                <CardDescription>
                  Creado el {selectedTicket.createdAt}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Asunto</Label>
                  <p className="text-muted-foreground mt-1">{selectedTicket.subject}</p>
                </div>
                
                <div>
                  <Label className="text-base font-semibold">Descripción</Label>
                  <p className="text-muted-foreground mt-1">{selectedTicket.description}</p>
                </div>

                <div className="flex gap-6">
                  <div>
                    <Label className="text-base font-semibold">Tipo de Incidente</Label>
                    <p className="text-muted-foreground mt-1">{selectedTicket.incidentType}</p>
                  </div>
                  <div>
                    <Label className="text-base font-semibold">Prioridad</Label>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                </div>

                {selectedTicket.responses.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold">Respuestas del Equipo de Soporte</Label>
                    <div className="space-y-3 mt-3">
                      {selectedTicket.responses.map((response: any, index: number) => (
                        <div key={index} className="bg-blue-50 border-l-4 border-blue-200 p-4 rounded-r-lg">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-blue-900">{response.admin}</p>
                            <p className="text-xs text-blue-600">{response.timestamp}</p>
                          </div>
                          <p className="text-sm text-blue-800">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1"
                  >
                    Cerrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTicketsPage;
