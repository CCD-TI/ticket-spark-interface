import { useToast } from "@/hooks/use-toast";
import { addTicketResponse, fetchTickets, getCurrentUser, getUserRole, signOut, updateTicketStatus } from "@/lib/supabase";
import { ITicket, Priority } from "@/types/ticket";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { BarChart, Clock, CheckCircle, AlertCircle, LogOut, Search, Send, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";


const AdminDashboard = () => {
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
  const [responseText, setResponseText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await getCurrentUser();
      if (userError || !userData) {
        navigate('/login');
        return;
      }

      setUser(userData);
      const { role, error: roleError } = await getUserRole(userData.id);
      if (roleError) throw roleError;

      if (role !== 'admin') {
        navigate('/my-tickets');
        return;
      }

      const { data: ticketsData, error: ticketsError } = await fetchTickets();
      if (ticketsError) throw ticketsError;

      setTickets(ticketsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleViewTicket = async (ticket: ITicket) => {
    if (!ticket.visto) {
      try {
        await supabase.from('tickets').update({ visto: true }).eq('id', ticket.id);
        setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, visto: true } : t)));
      } catch (error) {
        console.error('Error marking ticket as viewed:', error);
        toast({
          title: 'Error',
          description: 'Error al marcar el ticket como visto.',
          variant: 'destructive',
        });
      }
    }
    setSelectedTicket(ticket);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
      in_progress: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      closed: 'bg-green-600/20 text-green-400 border-green-600/30',
    };

    const labels = {
      open: 'Pendiente',
      in_progress: 'En Progreso',
      closed: 'Resuelto',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPriorityBadge = (priority: Priority) => {
    const styles = {
      low: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
      medium: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
      high: 'bg-red-600/20 text-red-400 border-red-600/30',
    };

    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  const handleSendResponse = async () => {
    if (!responseText.trim() || !selectedTicket || !user) {
      toast({
        title: 'Error',
        description: 'Por favor escribe una respuesta antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error: responseError } = await addTicketResponse({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        mensaje: responseText,
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
        title: 'Respuesta enviada',
        description: 'La respuesta ha sido enviada al usuario.',
      });
      setResponseText('');
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error sending response:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la respuesta. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await updateTicketStatus(ticketId, newStatus);
      if (error) throw error;

      const { data: updatedTickets, error: fetchError } = await fetchTickets();
      if (fetchError) throw fetchError;

      setTickets(updatedTickets || []);
      toast({
        title: 'Estado actualizado',
        description: `El ticket ha sido marcado como ${newStatus === 'closed' ? 'resuelto' : 'en progreso'}.`,
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del ticket.',
        variant: 'destructive',
      });
    }
  };

  const filteredTickets = tickets.filter((ticket: ITicket) => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesSearch =
      (ticket.asunto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.nombre_usuario?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (ticket.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'closed').length,
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error al cerrar sesión',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-lg">
              <img
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                src="/favicon.ico"
                alt="Logo"
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/48')}
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Panel de Administración</h1>
              <p className="text-sm sm:text-base text-gray-400">Gestión de Tickets y Usuarios</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto flex items-center gap-2 h-10 sm:h-12 text-sm sm:text-base font-medium text-white bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[
            { icon: BarChart, label: 'Total Tickets', value: stats.total, color: 'blue' },
            { icon: Clock, label: 'Pendientes', value: stats.pending, color: 'yellow' },
            { icon: AlertCircle, label: 'En Progreso', value: stats.inProgress, color: 'blue' },
            { icon: CheckCircle, label: 'Resueltos', value: stats.resolved, color: 'green' },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="shadow-lg bg-gray-800 border-gray-700">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`p-2 sm:p-3 rounded-lg bg-${color}-600/20`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${color}-400`} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">{label}</p>
                    <p className="text-lg sm:text-2xl font-semibold text-white">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="bg-gray-800 p-1 flex flex-col sm:flex-row items-center gap-2 rounded-lg">
            <TabsTrigger
              value="tickets"
              className="text-sm sm:text-base text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Gestión de Tickets
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="text-sm sm:text-base text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Usuarios
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="text-sm sm:text-base text-gray-400 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
            >
              Reportes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-6">
            {/* Filters */}
            <Card className="shadow-lg bg-gray-800 border-gray-700">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-6">
                  <div className="flex-1">
                    <Label htmlFor="search" className="text-sm sm:text-base font-medium text-gray-300">Buscar</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Buscar por ID, usuario o asunto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="w-full sm:w-48">
                    <Label htmlFor="status" className="text-sm sm:text-base font-medium text-gray-300">Estado</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500">
                        <SelectValue placeholder="Filtrar por estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white">
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="open">Pendiente</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="closed">Resueltos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card className="shadow-lg bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-white">Lista de Tickets</CardTitle>
                <CardDescription className="text-sm text-gray-400">Gestiona y responde a los tickets de soporte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-600">
                        <TableHead className="text-sm sm:text-base text-gray-400">ID</TableHead>
                        <TableHead className="text-sm sm:text-base text-gray-400">Usuario</TableHead>
                        <TableHead className="text-sm sm:text-base text-gray-400">Asunto</TableHead>
                        <TableHead className="text-sm sm:text-base text-gray-400">Área</TableHead>
                        <TableHead className="text-sm sm:text-base text-gray-400">Estado</TableHead>
                        <TableHead className="text-sm sm:text-base text-gray-400">Fecha</TableHead>
                        <TableHead className="text-sm sm:text-base text-gray-400">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((ticket: ITicket) => (
                        <TableRow key={ticket.id} className="border-gray-600">
                          <TableCell className="text-sm sm:text-base font-medium text-white">
                            #{ticket.id.substring(0, 8)}
                          </TableCell>
                          <TableCell className="text-sm sm:text-base text-gray-400">
                            {ticket?.nombre_usuario || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm sm:text-base max-w-[150px] sm:max-w-[300px] truncate text-white">
                            {ticket?.asunto || 'Sin título'}
                          </TableCell>
                          <TableCell className="text-sm sm:text-base text-gray-400">
                            {ticket.area_id?.nombre || 'N/A'}
                          </TableCell>
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                          <TableCell className="text-sm sm:text-base text-gray-400">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewTicket(ticket)}
                                className="h-8 text-sm bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {ticket.status !== 'closed' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateStatus(
                                      ticket.id,
                                      ticket.status === 'open' ? 'in_progress' : 'closed'
                                    )
                                  }
                                  className="h-8 text-sm bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
                                >
                                  {ticket.status === 'open' ? (
                                    <CheckCircle className="h-4 w-4 text-blue-400" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredTickets.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-400 py-3">
                            No hay tickets que coincidan con los filtros.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="shadow-lg bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-white">Gestión de Usuarios</CardTitle>
                <CardDescription className="text-sm text-gray-400">Administra usuarios y permisos</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-gray-400">Funcionalidad de usuarios en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="shadow-lg bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-white">Reportes y Estadísticas</CardTitle>
                <CardDescription className="text-sm text-gray-400">Analiza métricas del sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-gray-400">Funcionalidad de reportes en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50">
            <Card className="w-full max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-white">
                  Detalle del Ticket - #{selectedTicket.id.substring(0, 8)}
                </CardTitle>
                <CardDescription className="text-sm text-gray-400">
                  Usuario: {selectedTicket.nombre_usuario || 'N/A'} | Área: {selectedTicket.area_id?.nombre || 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Asunto</Label>
                  <p className="text-sm sm:text-base text-gray-400">{selectedTicket.asunto || 'Sin asunto'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-300">Descripción</Label>
                  <p className="text-sm sm:text-base text-gray-400">{selectedTicket.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-300">Estado</Label>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-300">Prioridad</Label>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-300">Proyecto</Label>
                    <p className="text-sm sm:text-base text-gray-400">{selectedTicket.proyecto_id?.nombre || 'N/A'}</p>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-gray-300">Tipo de Problema</Label>
                    <p className="text-sm sm:text-base text-gray-400">{selectedTicket.tipo_problema_id?.nombre || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-300">Fecha de Creación</Label>
                  <p className="text-sm sm:text-base text-gray-400">
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedTicket.ticket_responses?.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Respuestas</Label>
                    <div className="space-y-3 mt-2">
                      {selectedTicket.ticket_responses.map((response) => (
                        <div key={response.id} className="bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-white">
                              {response.user_id === user?.id ? 'Tú' : 'Usuario'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-400">
                              {new Date(response.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm sm:text-base text-gray-400 mt-1">{response.mensaje}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Label htmlFor="response" className="text-sm font-medium text-gray-300">Nueva Respuesta</Label>
                  <Textarea
                    id="response"
                    placeholder="Escribe tu respuesta al usuario..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="min-h-[100px] sm:min-h-[120px] mt-2 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-700">
                  <Button
                    onClick={handleSendResponse}
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Respuesta
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTicket(null);
                      setResponseText('');
                    }}
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
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
