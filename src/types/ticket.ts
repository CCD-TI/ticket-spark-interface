export type Priority = "low" | "medium" | "high";

// Respuesta de un admin al ticket (opcional)
export interface TicketResponse {
  id?: string;
  ticket_id?: string;
  user_id?: string; // puedes ajustarlo si tienes el nombre directamente
  mensaje: string;
  created_at?: string; // podrías omitirlo si no lo usas
}

// Estructura de un ticket (ajustada al backend y al frontend)
interface Proyecto {
  id: number;
  nombre: string;
  [key: string]: any;
}

interface TipoProblema {
  id: number;
  nombre: string;
  [key: string]: any;
}

export interface ITicket {
  id: string;
  asunto: string;
  descripcion: string;
  tipo_problema_id: number | TipoProblema;
  proyecto_id: number | Proyecto;
  status: string;
  priority?: Priority;
  created_at: string; // ISO string
  response?: string;
  responded_at?: string;
  user_id: string;
  ticket_responses?: TicketResponse[];
}
