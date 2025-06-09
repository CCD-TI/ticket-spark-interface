
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare,
  LogOut,
  Search,
  Filter,
  Eye,
  Edit,
  Send
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [responseText, setResponseText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Datos de ejemplo para tickets
  const mockTickets = [
    {
      id: "TCK-001",
      requesterName: "Ana García",
      department: "Ventas",
      project: "Proyecto Alpha",
      incidentType: "Bug / Error",
      subject: "Error en el módulo de facturación",
      description: "Al intentar generar una factura, el sistema muestra un error 500...",
      status: "pending",
      priority: "high",
      createdAt: "2024-01-15 09:30",
      responses: []
    },
    {
      id: "TCK-002", 
      requesterName: "Carlos López",
      department: "TI",
      project: "Sistema Gamma",
      incidentType: "Solicitud de Característica",
      subject: "Integración con API externa",
      description: "Necesitamos integrar el sistema con la API de pagos...",
      status: "in-progress",
      priority: "medium",
      createdAt: "2024-01-14 14:20",
      responses: [
        {
          admin: "María Admin",
          message: "Hemos comenzado a revisar tu solicitud. Te contactaremos pronto.",
          timestamp: "2024-01-14 15:00"
        }
      ]
    },
    {
      id: "TCK-003",
      requesterName: "Luis Rodríguez",
      department: "Marketing",
      project: "Plataforma Beta",
      incidentType: "Pregunta / Consulta",
      subject: "Duda sobre reportes de campaña",
      description: "¿Cómo puedo generar un reporte de rendimiento de la última campaña?",
      status: "resolved",
      priority: "low",
      createdAt: "2024-01-13 11:45",
      responses: [
        {
          admin: "Pedro Admin",
          message: "Para generar reportes, ve a la sección Analytics > Reportes > Selecciona el rango de fechas.",
          timestamp: "2024-01-13 12:30"
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

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
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

  const handleSendResponse = () => {
    if (!responseText.trim()) {
      toast({
        title: "Error",
        description: "Por favor escribe una respuesta antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Respuesta enviada",
      description: "La respuesta ha sido enviada al usuario.",
    });
    
    setResponseText("");
    setSelectedTicket(null);
  };

  const filteredTickets = mockTickets.filter(ticket => {
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: mockTickets.length,
    pending: mockTickets.filter(t => t.status === "pending").length,
    inProgress: mockTickets.filter(t => t.status === "in-progress").length,
    resolved: mockTickets.filter(t => t.status === "resolved").length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
              <p className="text-muted-foreground">Gestión de Tickets y Usuarios</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => navigate("/login")}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Tickets</p>
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

        {/* Main Content */}
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tickets">Gestión de Tickets</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Buscar por ID, usuario o asunto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:w-48">
                    <Label htmlFor="status">Estado</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                        <SelectItem value="in-progress">En Progreso</SelectItem>
                        <SelectItem value="resolved">Resueltos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Tickets</CardTitle>
                <CardDescription>
                  Gestiona y responde a los tickets de soporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Asunto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.id}</TableCell>
                        <TableCell>{ticket.requesterName}</TableCell>
                        <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{ticket.createdAt}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Administra usuarios y permisos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Funcionalidad de usuarios en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reportes y Estadísticas</CardTitle>
                <CardDescription>Analiza métricas del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Funcionalidad de reportes en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Detalle del Ticket - {selectedTicket.id}</CardTitle>
                <CardDescription>
                  Usuario: {selectedTicket.requesterName} | Departamento: {selectedTicket.department}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Asunto</Label>
                  <p className="text-sm text-muted-foreground">{selectedTicket.subject}</p>
                </div>
                
                <div>
                  <Label>Descripción</Label>
                  <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                </div>

                <div className="flex gap-4">
                  <div>
                    <Label>Estado</Label>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                  <div>
                    <Label>Prioridad</Label>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                </div>

                {selectedTicket.responses.length > 0 && (
                  <div>
                    <Label>Respuestas Anteriores</Label>
                    <div className="space-y-2 mt-2">
                      {selectedTicket.responses.map((response: any, index: number) => (
                        <div key={index} className="bg-muted p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium">{response.admin}</p>
                            <p className="text-xs text-muted-foreground">{response.timestamp}</p>
                          </div>
                          <p className="text-sm mt-1">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="response">Nueva Respuesta</Label>
                  <Textarea
                    id="response"
                    placeholder="Escribe tu respuesta al usuario..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="min-h-[100px] mt-2"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button onClick={handleSendResponse} className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Respuesta
                  </Button>
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

export default AdminDashboard;
