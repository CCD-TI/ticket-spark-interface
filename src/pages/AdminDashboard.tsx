import { useState, useEffect } from "react";
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
  Send
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchTickets, signOut, getCurrentUser, getUserRole, updateTicketStatus, addTicketResponse } from "@/lib/supabase";

const AdminDashboard = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: userData, error: userError } = await getCurrentUser();
        if (userError) throw userError;
        
        if (userData?.user) {
          setUser(userData.user);
          const role = await getUserRole(userData.user.id);
          if (role !== 'admin') {
            navigate('/my-tickets');
            return;
          }
          
          const { data: ticketsData, error: ticketsError } = await fetchTickets();
          if (ticketsError) throw ticketsError;
          
          console.log("Fetched tickets:", ticketsData); // Debug log
          setTickets(ticketsData || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos. Por favor intenta nuevamente.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, toast]);

  const getStatusBadge = (status) => {
    const styles = {
      open: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
      in_progress: "bg-blue-600/20 text-blue-400 border-blue-600/30", 
      closed: "bg-green-600/20 text-green-400 border-green-600/30"
    };
    
    const labels = {
      open: "Pendiente",
      in_progress: "En Progreso",
      closed: "Resuelto"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: "bg-gray-600/20 text-gray-400",
      medium: "bg-orange-600/20 text-orange-400",
      high: "bg-red-600/20 text-red-400"
    };
    
    const labels = {
      low: "Baja",
      medium: "Media", 
      high: "Alta"
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  const handleSendResponse = async () => {
    if (!responseText.trim() || !selectedTicket || !user) {
      toast({
        title: "Error",
        description: "Por favor escribe una respuesta antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error: responseError } = await addTicketResponse({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        mensaje: responseText
      });

      if (responseError) throw responseError;

      if (selectedTicket.status === 'open') {
        const { error: statusError } = await updateTicketStatus(selectedTicket.id, 'in_progress');
        if (statusError) throw statusError;
      }

      const { data: updatedTickets, error: fetchError } = await fetchTickets();
      if (fetchError) throw fetchError;
      setTickets(updatedTickets || []);

      toast({
        title: "Respuesta enviada",
        description: "La respuesta ha sido enviada al usuario.",
      });
      
      setResponseText("");
      setSelectedTicket(null);
    } catch (error) {
      console.error("Error sending response:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const { error } = await updateTicketStatus(ticketId, newStatus);
      if (error) throw error;

      const { data: updatedTickets, error: fetchError } = await fetchTickets();
      if (fetchError) throw fetchError;
      setTickets(updatedTickets || []);

      toast({
        title: "Estado actualizado",
        description: `El ticket ha sido marcado como ${newStatus === 'closed' ? 'resuelto' : 'en progreso'}.`,
      });
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del ticket.",
        variant: "destructive"
      });
    }
  };

  const handleSelectTicket = (ticket) => {
    console.log("Selecting ticket:", ticket);
    if (ticket && ticket.id) {
      setSelectedTicket(ticket);
    } else {
      console.error("Invalid ticket data:", ticket);
      toast({
        title: "Error",
        description: "No se pudo cargar el ticket seleccionado.",
        variant: "destructive"
      });
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesSearch = 
      (ticket.asunto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.nombre_usuario?.nombre ? ticket.nombre_usuario.nombre.toLowerCase() : ticket.nombre_usuario?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === "open").length,
    inProgress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "closed").length
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive"
      });
    } else {
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Settings className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Panel de Administración</h1>
              <p className="text-gray-400">Gestión de Tickets y Usuarios</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full sm:w-auto gap-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-gray-700 bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Tickets</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-700 bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-600/20 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pendientes</p>
                  <p className="text-2xl font-bold text-white">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-700 bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">En Progreso</p>
                  <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-gray-700 bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Resueltos</p>
                  <p className="text-2xl font-bold text-white">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="bg-gray-700 flex flex-wrap">
            <TabsTrigger value="tickets" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">Gestión de Tickets</TabsTrigger>
            <TabsTrigger value="users" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">Usuarios</TabsTrigger>
            <TabsTrigger value="reports" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            {/* Filters */}
            <Card className="shadow-lg border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search" className="text-gray-300">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Buscar por ID, usuario o asunto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-48">
                    <Label htmlFor="status" className="text-gray-300">Estado</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-12 bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="open">Pendientes</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="closed">Resueltos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card className="shadow-lg border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Lista de Tickets</CardTitle>
                <CardDescription className="text-gray-400">
                  Gestiona y responde a los tickets de soporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">ID</TableHead>
                        <TableHead className="text-gray-300">Usuario</TableHead>
                        <TableHead className="text-gray-300">Asunto</TableHead>
                        <TableHead className="text-gray-300">Estado</TableHead>
                        <TableHead className="text-gray-300">Fecha</TableHead>
                        <TableHead className="text-gray-300">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket) => (
                        <TableRow key={ticket.id} className="border-gray-700">
                          <TableCell className="font-medium text-white">#{ticket.id.substring(0, 8)}</TableCell>
                          <TableCell className="text-gray-300">{ticket.nombre_usuario?.nombre || ticket.nombre_usuario || 'N/A'}</TableCell>
                          <TableCell className="max-w-[150px] sm:max-w-xs truncate text-gray-300">{ticket.asunto || 'Sin asunto'}</TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell className="text-gray-300">{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelectTicket(ticket)}
                                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {ticket.status !== 'closed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(
                                    ticket.id, 
                                    ticket.status === 'open' ? 'in_progress' : 'closed'
                                  )}
                                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
                                >
                                  {ticket.status === 'open' ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="shadow-lg border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Gestión de Usuarios</CardTitle>
                <CardDescription className="text-gray-400">Administra usuarios y permisos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Funcionalidad de usuarios en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="shadow-lg border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Reportes y Estadísticas</CardTitle>
                <CardDescription className="text-gray-400">Analiza métricas del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Funcionalidad de reportes en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-lg border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Detalle del Ticket - #{selectedTicket.id.substring(0, 8)}</CardTitle>
                <CardDescription className="text-gray-400">
                  Usuario: {selectedTicket.nombre_usuario?.nombre || selectedTicket.nombre_usuario || 'N/A'} | Cargo: {selectedTicket.cargo_id || 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Asunto</Label>
                  <p className="text-sm text-gray-400">{selectedTicket.asunto || 'Sin asunto'}</p>
                </div>
                
                <div>
                  <Label className="text-gray-300">Descripción</Label>
                  <p className="text-sm text-gray-400">{selectedTicket.descripcion || 'Sin descripción'}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <Label className="text-gray-300">Estado</Label>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Proyecto</Label>
                    <p className="text-sm text-gray-400">{selectedTicket.proyecto_id?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-300">Tipo de Problema</Label>
                    <p className="text-sm text-gray-400">{selectedTicket.tipo_problema_id?.nombre || 'N/A'}</p>
                  </div>
                </div>

                {selectedTicket.response && (
                  <div>
                    <Label className="text-gray-300">Respuesta Anterior</Label>
                    <div className="bg-gray-700/50 p-3 rounded-lg mt-2">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-white">Soporte</p>
                        <p className="text-xs text-gray-400">
                          {selectedTicket.responded_at ? 
                            new Date(selectedTicket.responded_at).toLocaleString() : 
                            'Fecha no disponible'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{selectedTicket.response}</p>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="response" className="text-gray-300">Nueva Respuesta</Label>
                  <Textarea
                    id="response"
                    placeholder="Escribe tu respuesta al usuario..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="min-h-[100px] mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary w-full"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    onClick={handleSendResponse} 
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Respuesta
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
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