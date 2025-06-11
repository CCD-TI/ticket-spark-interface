import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Plus, Search, Clock, CheckCircle, AlertCircle, LogOut, Eye, MessageSquare, Menu, X } from 'lucide-react';
import { fetchTickets, signOut, getCurrentUser } from '@/lib/supabase';
import { ITicket, TicketResponse } from '@/types/ticket';

const MyTicketsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
  const [myTickets, setMyTickets] = useState<ITicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [viewedTickets, setViewedTickets] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('viewedTickets');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await getCurrentUser();
      if (userError || !userData) throw userError ?? new Error('No user');

      setUser(userData);
      const { data: ticketsData, error: ticketsError } = await fetchTickets();
      if (ticketsError) throw ticketsError;

      const userTickets = ticketsData?.filter((ticket) => ticket.user_id === userData.id) ?? [];
      setMyTickets(userTickets);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tickets. Por favor intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      closed: 'bg-green-500/10 text-green-400 border-green-500/30',
    };
    const labels = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      closed: 'Cerrado',
    };
    const icons = {
      open: <Clock className="h-3 w-3" />,
      in_progress: <AlertCircle className="h-3 w-3" />,
      closed: <CheckCircle className="h-3 w-3" />,
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
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
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  const filteredTickets = myTickets.map((ticket) => {
    const lastResponseTime =
      ticket.ticket_responses?.length > 0
        ? new Date(ticket.ticket_responses[ticket.ticket_responses.length - 1].created_at).getTime()
        : 0;
    const lastViewedTime = viewedTickets.has(ticket.id)
      ? new Date(localStorage.getItem(`ticket_${ticket.id}_viewed`) ?? 0).getTime()
      : 0;

    return {
      ...ticket,
      hasNewResponse:
        Array.isArray(ticket.ticket_responses) &&
        ticket.ticket_responses.length > 0 &&
        (lastResponseTime > lastViewedTime || !viewedTickets.has(ticket.id)),
    };
  });

  const visibleTickets = filteredTickets.filter((ticket: ITicket) =>
    (ticket.asunto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (ticket.id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const markTicketAsViewed = (ticketId: string) => {
    setViewedTickets((prev) => {
      const updated = new Set(prev).add(ticketId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('viewedTickets', JSON.stringify(Array.from(updated)));
        localStorage.setItem(`ticket_${ticketId}_viewed`, new Date().toISOString());
      }
      return updated;
    });
  };

  const stats = {
    total: myTickets.length,
    pending: myTickets.filter((t) => t.status === 'open').length,
    inProgress: myTickets.filter((t) => t.status === 'in_progress').length,
    resolved: myTickets.filter((t) => t.status === 'closed').length,
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
      <div className="max-w-6xl mx-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="p-2 bg-primary/20 rounded-lg">
              <img
                className="w-8 h-8 object-contain"
                src="/favicon.ico"
                alt="Logo"
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/32')}
              />
            </div>
          </div>
          <Button
            onClick={() => navigate('/create-ticket')}
            size="sm"
            className="h-8 text-sm bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Header Section */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:flex items-center justify-between mb-6 md:mb-8`}>
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 bg-primary/20 rounded-lg hidden md:block">
              <img
                className="w-10 h-10 object-contain"
                src="/favicon.ico"
                alt="Logo"
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40')}
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Mis Tickets</h1>
              <p className="text-sm sm:text-base text-gray-400">Portal de Usuario - Gestión de Solicitudes</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <Button
              onClick={() => navigate('/create-ticket')}
              className="flex items-center gap-2 h-10 md:h-12 w-full md:w-auto bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm md:text-base hidden md:inline">Nuevo Ticket</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2 h-10 md:h-12 w-full md:w-auto text-white bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm md:text-base hidden md:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[
            { icon: Ticket, label: 'Total', value: stats.total, color: 'blue' },
            { icon: Clock, label: 'Pendientes', value: stats.pending, color: 'yellow' },
            { icon: AlertCircle, label: 'En Progreso', value: stats.inProgress, color: 'blue' },
            { icon: CheckCircle, label: 'Resueltos', value: stats.resolved, color: 'green' },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="bg-gray-800 border-gray-700 shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 sm:p-3 rounded-lg bg-${color}-600/20`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 text-${color}-400`} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">{label}</p>
                    <p className="text-lg sm:text-2xl font-bold text-white">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Bar */}
        <Card className="mb-6 sm:mb-8 bg-gray-800 border-gray-700 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-sm sm:text-base text-gray-300">Buscar en mis tickets</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Buscar por ID o asunto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 sm:h-12 text-sm sm:text-base bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <div className="space-y-3 sm:space-y-4">
          {visibleTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="hover:shadow-lg transition-shadow bg-gray-800 border-gray-700 hover:border-primary/50"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
                      <h3 className="text-sm sm:text-lg font-semibold text-white line-clamp-1">{ticket.asunto}</h3>
                      <span className="text-xs sm:text-sm text-gray-400">#{ticket.id.substring(0, 8)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3 line-clamp-2">{ticket.descripcion}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {getStatusBadge(ticket.status)}
                      <span className="text-xs sm:text-sm text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      {ticket.ticket_responses?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs sm:text-sm text-blue-400">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.ticket_responses.length}
                        </span>
                      )}
                      {ticket.hasNewResponse && (
                        <span className="inline-flex items-center justify-center h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500 text-white text-[10px] font-medium">
                          !
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      markTicketAsViewed(ticket.id);
                    }}
                    className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm relative bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
                  >
                    {ticket.hasNewResponse && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                    <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                    Ver Detalle
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {visibleTickets.length === 0 && (
            <Card className="bg-gray-800 border-gray-700 shadow-lg">
              <CardContent className="p-8 sm:p-12 text-center">
                <Ticket className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                  {searchTerm ? 'No hay resultados' : 'No tienes tickets'}
                </h3>
                <p className="text-xs sm:text-base text-gray-500 mb-3 sm:mb-4">
                  {searchTerm
                    ? 'No hay tickets que coincidan con tu búsqueda.'
                    : 'Aún no has creado ningún ticket.'}
                </p>
                <Button
                  onClick={() => navigate('/create-ticket')}
                  className="h-10 sm:h-12 text-sm sm:text-base bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Ticket
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50">
            <Card className="w-full max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl text-white">
                  Detalle del Ticket - #{selectedTicket.id.substring(0, 8)}
                </CardTitle>
                <CardDescription className="text-sm text-gray-400">
                  Estado: {getStatusBadge(selectedTicket.status)} | Prioridad: {getPriorityBadge(selectedTicket.priority)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div>
                  <Label className="text-sm font-medium text-gray-300">Asunto</Label>
                  <p className="text-sm sm:text-base text-white">{selectedTicket.asunto || 'Sin asunto'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-300">Descripción</Label>
                  <p className="text-sm sm:text-base text-gray-400">{selectedTicket.descripcion || 'Sin descripción'}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Área</Label>
                    <p className="text-sm sm:text-base text-gray-400">{selectedTicket.area_id?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Proyecto</Label>
                    <p className="text-sm sm:text-base text-gray-400">{selectedTicket.proyecto_id?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Tipo de Problema</Label>
                    <p className="text-sm sm:text-base text-gray-400">{selectedTicket.tipo_problema_id?.nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Fecha de Creación</Label>
                    <p className="text-sm sm:text-base text-gray-400">
                      {new Date(selectedTicket.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {selectedTicket.ticket_responses?.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Respuestas</Label>
                    <div className="space-y-3 mt-2">
                      {selectedTicket.ticket_responses.map((response: TicketResponse) => (
                        <div key={response.id} className="bg-gray-700/50 p-3 sm:p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-white">
                              {response.user_id === user?.id ? 'Tú' : 'Soporte'}
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
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-medium text-white bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500"
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