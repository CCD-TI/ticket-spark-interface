import { useState, useEffect } from "react";
import { Priority, ITicket, TicketResponse } from "@/types/Ticket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MessageSquare,
  Menu,
  X as CloseIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchTickets, signOut, getCurrentUser } from "@/lib/supabase";

const MyTicketsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
  const [myTickets, setMyTickets] = useState<ITicket[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const loadUserAndTickets = async () => {
      try {
        const { data: userData, error: userError } = await getCurrentUser();
        if (userError) throw userError;
        
        if (userData?.user) {
          setUser(userData.user);
          const { data: ticketsData, error: ticketsError } = await fetchTickets();
          if (ticketsError) throw ticketsError;
          
          const userTickets = ticketsData?.filter(ticket => ticket.user_id === userData.user.id) || [];
          setMyTickets(userTickets);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los tickets. Por favor intenta nuevamente.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserAndTickets();
  }, []);

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

  const getStatusBadge = (status: any) => {
    const styles = {
      open: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/30", 
      closed: "bg-green-500/10 text-green-400 border-green-500/30"
    };
    
    const labels = {
      open: "Abierto",
      in_progress: "En Progreso",
      closed: "Cerrado"
    };

    const icons = {
      open: <Clock className="h-3 w-3" />,
      in_progress: <AlertCircle className="h-3 w-3" />,
      closed: <CheckCircle className="h-3 w-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const filteredTickets = myTickets.map(ticket => {
    const lastResponseTime = ticket.ticket_responses?.length > 0 
      ? new Date(ticket.ticket_responses[ticket.ticket_responses.length - 1].created_at).getTime()
      : 0;
    const lastViewedTime = viewedTickets.has(ticket.id) 
      ? new Date(localStorage.getItem(`ticket_${ticket.id}_viewed`) || 0).getTime()
      : 0;

    return {
      ...ticket,
      hasNewResponse: Array.isArray(ticket.ticket_responses) && 
        ticket.ticket_responses.length > 0 &&
        (lastResponseTime > lastViewedTime || !viewedTickets.has(ticket.id))
    };
  });

  const visibleTickets = filteredTickets.filter((ticket: ITicket) => 
    ticket.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const markTicketAsViewed = (ticketId: string) => {
    setViewedTickets(prev => {
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
    pending: myTickets.filter(t => t.status === "open").length,
    inProgress: myTickets.filter(t => t.status === "in_progress").length,
    resolved: myTickets.filter(t => t.status === "closed").length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
            </button>
            <div className="p-2 bg-primary/20 rounded-lg">
              <img className="w-8 h-8" src="favicon.ico" alt="Logo" />
            </div>
          </div>
          
          <Button 
            onClick={() => navigate("/create-ticket")} 
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Header */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:flex items-center justify-between mb-8`}>
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 bg-primary/20 rounded-lg hidden md:block">
              <img className="w-10 h-10" src="favicon.ico" alt="Logo" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Mis Tickets</h1>
              <p className="text-gray-400 text-sm md:text-base">Portal de Usuario - Gestión de Solicitudes</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <Button 
              onClick={() => navigate("/create-ticket")} 
              className="gap-2 bg-primary hover:bg-primary/90 w-full md:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">Nuevo Ticket</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="gap-2 text-black md:text-white border-gray-600 hover:bg-gray-800 hover:text-white transition-colors w-full md:w-auto"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-blue-500/20 rounded-lg">
                  <Ticket className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Total</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-yellow-500/20 rounded-lg">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Pendientes</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-blue-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-400">En Progreso</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-xs md:text-sm text-gray-400">Resueltos</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardContent className="p-4 md:p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="text-gray-300 text-sm md:text-base">Buscar en mis tickets</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Buscar por ID o asunto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:ring-primary focus:border-primary h-10 md:h-12"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <div className="space-y-3 md:space-y-4">
          {visibleTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="hover:shadow-lg transition-shadow bg-gray-800 border-gray-700 hover:border-primary/50"
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1 md:mb-2">
                      <h3 className="text-base md:text-lg font-semibold text-white line-clamp-1">{ticket.asunto}</h3>
                      <span className="text-xs md:text-sm text-gray-400">#{ticket.id.substring(0, 8)}</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-3 line-clamp-2">
                      {ticket.descripcion}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      {getStatusBadge(ticket.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      {ticket.ticket_responses?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.ticket_responses.length}
                        </span>
                      )}
                      {ticket.hasNewResponse && (
                        <span className="inline-flex items-center justify-center h-3 w-3 md:h-4 md:w-4 rounded-full bg-red-500 text-white text-[10px] font-medium">
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
                    className="md:ml-4 relative bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500 w-full md:w-auto"
                  >
                    {ticket.hasNewResponse && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                    <Eye className="h-4 w-4 mr-1 md:mr-2" />
                    <span className="text-xs md:text-sm">Ver Detalle</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {visibleTickets.length === 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 md:p-12 text-center">
                <Ticket className="h-10 w-10 md:h-12 md:w-12 text-gray-600 mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-semibold text-white mb-1 md:mb-2">
                  {searchTerm ? "No hay resultados" : "No tienes tickets"}
                </h3>
                <p className="text-gray-500 text-sm md:text-base mb-3 md:mb-4">
                  {searchTerm ? 
                    "No hay tickets que coincidan con tu búsqueda." : 
                    "Aún no has creado ningún ticket."}
                </p>
                <Button 
                  onClick={() => navigate("/create-ticket")} 
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm md:text-base">Crear Ticket</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 md:p-4 z-50">
            <Card className="w-full max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-white">
                      <span>Ticket #{selectedTicket.id.substring(0, 8)}</span>
                      {getStatusBadge(selectedTicket.status)}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm md:text-base">
                      Creado el {new Date(selectedTicket.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  {selectedTicket.ticket_responses?.length > 0 && (
                    <div className="bg-blue-500/20 text-blue-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {selectedTicket.ticket_responses.length} respuesta{selectedTicket.ticket_responses.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <div>
                  <Label className="text-sm md:text-base font-semibold text-white">Asunto</Label>
                  <p className="text-gray-300 mt-1 text-sm md:text-base">{selectedTicket.asunto}</p>
                </div>
                
                <div>
                  <Label className="text-sm md:text-base font-semibold text-white">Descripción</Label>
                  <p className="text-gray-300 mt-1 text-sm md:text-base whitespace-pre-line">{selectedTicket.descripcion}</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  <div className="flex-1">
                    <Label className="text-sm md:text-base font-semibold text-white">Tipo de Problema</Label>
                    <p className="text-gray-300 mt-1 text-sm md:text-base">
                      {selectedTicket.tipo_problema_id?.nombre || 'No especificado'}
                    </p>
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm md:text-base font-semibold text-white">Proyecto</Label>
                    <p className="text-gray-300 mt-1 text-sm md:text-base">
                      {selectedTicket.proyecto_id?.nombre || 'No especificado'}
                    </p>
                  </div>
                </div>

                {selectedTicket.ticket_responses && selectedTicket.ticket_responses.length > 0 && (
                  <div>
                    <Label className="text-sm md:text-base font-semibold text-white">
                      Respuesta{selectedTicket.ticket_responses.length > 1 ? 's' : ''} del Equipo de Soporte
                    </Label>
                    <div className="space-y-3 md:space-y-4 mt-2 md:mt-3">
                      {selectedTicket.ticket_responses.map((response) => (
                        <div key={response.id} className="bg-blue-500/10 border-l-4 border-blue-500/50 p-3 md:p-4 rounded-r-lg">
                          <div className="flex justify-between items-start mb-1 md:mb-2">
                            <p className="text-xs md:text-sm font-medium text-blue-300">
                              {response.user_id === user?.id ? 'Tú' : 'Soporte'}
                            </p>
                            <p className="text-xs text-blue-400">
                              {new Date(response.created_at).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-xs md:text-sm text-blue-200 whitespace-pre-line">{response.mensaje}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 md:gap-4 pt-3 md:pt-4 border-t border-gray-700">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500 text-sm md:text-base"
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