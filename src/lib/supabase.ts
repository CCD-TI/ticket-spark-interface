import { ITicket } from '@/types/ticket';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// En src/lib/supabase.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth methods
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password, 
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  return { data, error };
};

export const signUpWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const fetchTickets = async (): Promise<{ data: ITicket[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      tipo_problema_id (*),
      proyecto_id (*),
      ticket_responses (
        id,
        ticket_id,
        user_id,
        mensaje,
        created_at
      )`)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const createTicket = async (ticketData: Partial<ITicket>): Promise<{ data: ITicket[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticketData)
    .select();
  return { data, error };
};

// Subscribe to auth changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Get current user
export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const getUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error al obtener el rol del usuario:', error);
    return 'user'; // Rol por defecto
  }

  return data?.role || 'user';
};

// Actualizar estado de un ticket
export const updateTicketStatus = async (ticketId: string, newStatus: string) => {
  const { data, error } = await supabase
    .from('tickets')
    .update({ status: newStatus })
    .eq('id', ticketId)
    .select();
  return { data, error };
};

// Agregar respuesta a un ticket
export const addTicketResponse = async (responseData: {
  ticket_id: string;
  user_id: string;
  mensaje: string;
}) => {
  const { data, error } = await supabase
    .from('ticket_responses')
    .insert(responseData)
    .select();
  return { data, error };
};
