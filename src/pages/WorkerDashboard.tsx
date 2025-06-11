import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Clock, BarChart, Eye, Send, Plus, LogOut, Search } from 'lucide-react';
import { fetchTickets, getCurrentUser, getUserRole, updateTicketStatus, addTicketResponse, signOut, supabase } from '@/lib/supabase';
import { ITicket, Priority } from '@/types/ticket';

const WorkerDashboard = () => {
  const [ticketsArea, setTicketsArea] = useState<ITicket[]>([]);
  const [ticketsUser, setTicketsUser] = useState<ITicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [area_id, setAreaId] = useState(null);
  const [ticketView, setTicketView] = useState<'received' | 'sent'>('received');
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
      const { role, area_id: userAreaId, error: roleError } = await getUserRole(userData.id);
      if (roleError) throw roleError;

      if (role !== 'trabajador') {
        navigate('/my-tickets');
        return;
      }

      setAreaId(userAreaId);
      const { data: ticketsData, error: ticketsError } = await fetchTickets();
      if (ticketsError) throw ticketsError;

      const areaTickets = ticketsData?.filter((ticket) => ticket.area_id?.id === userAreaId) ?? [];
      setTicketsArea(areaTickets);

      const userTickets = ticketsData?.filter((ticket) => ticket.user_id === userData.id) ?? [];
      setTicketsUser(userTickets);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos.',
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
        await supabase
          .from('tickets')
          .update({ visto: true })
          .eq('id', ticket.id);
        setTicketsArea((prev) => prev.map((t) => t.id === ticket.id ? { ...t, visto: true } : t));
        setTicketsUser((prev) => prev.map((t) => t.id === ticket.id ? { ...t, visto: true } : t));
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
      open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      closed: 'bg-green-500/20 text-green-400 border-green-500/30',
    };

    const labels = {
      open: 'Pendiente',
      in_progress: 'En Progreso',
      closed: 'Resuelto',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPriorityBadge = (priority: Priority) => {
    const styles = {
      low: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
      medium: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    const labels = {
      low: 'Baja',
      medium: 'Mediana',
      high: 'Alta',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-semibold ${styles[priority]}`}>
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

      setTicketsArea(updatedTickets?.filter((ticket) => ticket.area_id?.id === area_id) ?? []);
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
      const { error: statusError } = await updateTicketStatus(ticketId, newStatus);
      if (statusError) throw statusError;

      const { data: updatedTickets, error: fetchError } = await fetchTickets();
      if (fetchError) throw fetchError;

      setTicketsArea(updatedTickets?.filter((ticket) => ticket.area_id?.id === area_id) ?? []);

      toast({
        title: 'Estado actualizado',
        description: `El ticket ha sido marcado como ${newStatus === 'closed' ? 'resuelto' : 'en progreso'}.`,
      });
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del ticket.',
        variant: 'destructive',
      });
    }
  };

  const filterTickets = (tickets: ITicket[]) => {
    return tickets.filter((ticket: ITicket) => {
      const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
      const matchesSearch =
        (ticket.asunto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (ticket.nombre_usuario?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (ticket.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  };

  const filteredTickets = ticketView === 'received' 
    ? filterTickets(ticketsArea) 
    : filterTickets(ticketsUser);

  const stats = {
    total: ticketView === 'received' ? ticketsArea.length : ticketsUser.length,
    pending: (ticketView === 'received' ? ticketsArea : ticketsUser).filter((t) => t.status === 'open').length,
    inProgress: (ticketView === 'received' ? ticketsArea : ticketsUser).filter((t) => t.status === 'in_progress').length,
    resolved: (ticketView === 'received' ? ticketsArea : ticketsUser).filter((t) => t.status === 'closed').length,
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-700/20 rounded-lg">
              <img
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                src="/favicon.ico"
                alt="Logo"
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/48')}
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Dashboard del Trabajador</h1>
              <p className="text-sm sm:text-base text-gray-400">Gestión de tickets asignados a tu área</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-4">
            <Button
              onClick={() => navigate('/create-ticket')}
              className="flex items-center gap-2 h-10 sm:h-12 text-sm sm:text-base bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nuevo Ticket
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 h-10 sm:h-12 text-sm sm:text-base text-white bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
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

        {/* Filters */}
        <Card className="shadow-lg bg-gray-800 border-gray-700 mb-6 sm:mb-8">
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
                    className="pl-10 h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Label htmlFor="status" className="text-sm sm:text-base font-medium text-gray-300">Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary">
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
          <div className='flex justify-between items-center'>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-white">Lista de Tickets</CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-400">
                Gestiona los tickets asignados a tu área
              </CardDescription>
            </CardHeader>
            <div className="flex items-center space-x-2 pr-6">
              <span className="text-sm font-medium text-gray-300">
                {ticketView === 'received' ? 'Recibidos' : 'Enviados'}
              </span>
              <button
                type="button"
                onClick={() => setTicketView(ticketView === 'received' ? 'sent' : 'received')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  ticketView === 'sent' ? 'bg-primary' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    ticketView === 'sent' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-sm sm:text-base text-gray-400">ID</TableHead>
                    <TableHead className="text-sm sm:text-base text-gray-400">Usuario</TableHead>
                    <TableHead className="text-sm sm:text-base text-gray-400">Asunto</TableHead>
                    <TableHead className="text-sm sm:text-base text-gray-400">Prioridad</TableHead>
                    <TableHead className="text-sm sm:text-base text-gray-400">Estado</TableHead>
                    <TableHead className="text-sm sm:text-base text-gray-400">Fecha</TableHead>
                    <TableHead className="text-sm sm:text-base text-gray-400">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket: ITicket) => (
                    <TableRow key={ticket.id} className="border-gray-700">
                      <TableCell className="text-sm sm:text-base font-medium text-white">
                        #{ticket.id.substring(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm sm:text-base text-gray-400">
                        {ticket.nombre_usuario || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm sm:text-base max-w-[150px] sm:max-w-[300px] truncate text-gray-400">
                        {ticket.asunto || 'Sin título'}
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
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
                            className="h-8 text-sm bg-gray-700 border-gray-600 text-white font-medium hover:bg-gray-600 hover:border-gray-500"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ticket.status !== 'closed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(ticket.id, ticket.status === 'open' ? 'in_progress' : 'closed')}
                              className="h-8 text-sm bg-gray-700 border-gray-600 text-white font-medium hover:bg-gray-600 hover:border-gray-500"
                            >
                              {ticket.status === 'open' ? (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
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
                      <TableCell colSpan={7} className="text-center py-6 text-gray-400">
                        No hay tickets que coincidan con los filtros.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50">
            <Card className="w-full max-w-md sm sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-white">
                  Detalle del Ticket - #{selectedTicket.id.substring(0, 8)}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-400">
                  Usuario: {selectedTicket.nombre_usuario || 'N/A'} | Área: {selectedTicket.area_id?.nombre || 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div>
                  <Label className="text-sm sm:text-base font-medium text-gray-300">Asunto</Label>
                  <p className="text-sm sm:text-base text-gray-400">{selectedTicket.asunto || 'Sin título'}</p>
                </div>
                <div>
                  <Label className="text-sm sm:text-base font-medium text-gray-300">Descripción</Label>
                  <p className="text-sm sm:text-base text-gray-400">{selectedTicket.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="text-sm sm:text-base font-medium text-gray-300">Estado</Label>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm sm:text-base font-medium text-gray-300">Prioridad</Label>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                  <div>
                    <Label className="text-sm sm:text-base font-medium text-gray-300">Proyecto</Label>
                    <p className="text-sm sm:text-base text-gray-400">{selectedTicket.proyecto_id?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm sm:text-base font-medium text-gray-300">Tipo de Problema</Label>
                    <p className="text-sm sm:text-base text-gray-400">{selectedTicket.tipo_problema_id?.nombre || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm sm:text-base font-medium text-gray-300">Fecha de Creación</Label>
                  <p className="text-sm sm:text-base text-gray-400">
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedTicket.ticket_responses?.length > 0 && (
                  <div>
                    <Label className="text-sm sm:text-base font-medium text-gray-300">Respuestas</Label>
                    <div className="space-y-3 mt-2">
                      {selectedTicket.ticket_responses.map((response) => (
                        <div key={response.id} className="bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <p className="text-sm sm:text-base font-medium text-white">
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
                  <Label htmlFor="response" className="text-sm sm:text-base font-medium text-gray-300">Nueva Respuesta</Label>
                  <Textarea
                    id="response"
                    placeholder="Escribe tu respuesta al usuario..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="min-h-[100px] sm:min-h-[120px] mt-2 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
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
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base text-white bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
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

export default WorkerDashboard;