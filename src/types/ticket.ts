export type Priority = 'low' | 'medium' | 'high';

export interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  mensaje: string;
  created_at: string;
}

export interface Proyecto {
  id: number;
  nombre: string;
}

export interface TipoProblema {
  id: number;
  nombre: string;
}

export interface Areas {
  id: number;
  nombre: string;
}

export interface ITicket {
  id: string;
  user_id: string;
  nombre_usuario: string | null;
  proyecto_id: Proyecto | null;
  tipo_problema_id: TipoProblema;
  area_id: Areas;
  asunto: string;
  descripcion: string | null;
  status: 'open' | 'in_progress' | 'closed';
  priority: Priority;
  visto: boolean;
  created_at: string;
  responded_at: string | null;
  ticket_responses: TicketResponse[];
}


export interface TicketInsert {
  user_id: string;
  nombre_usuario: string | null;
  proyecto_id: number | null;
  tipo_problema_id: number;
  area_id: number;
  asunto: string;
  descripcion: string | null;
  status: 'open' | 'in_progress' | 'closed';
  priority: Priority;
  visto: boolean;
  created_at: string;
  responded_at: string | null;
}

