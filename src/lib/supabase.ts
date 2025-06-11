import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ITicket, Priority, TicketInsert } from '@/types/ticket';

export const supabase: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { data: session?.user ?? null, error };
};

export const getUserRole = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, area_id')
    .eq('user_id', userId)
    .single();
  return { role: data?.role ?? 'user', area_id: data?.area_id ?? null, error };
};

export const getUserRoleFromSession = async () => {
  const { data: user, error: userError } = await getCurrentUser();
  if (userError || !user) {
    return { user: null, role: null, area_id: null, error: userError ?? new Error('No user') };
  }
  const { role, area_id, error: roleError } = await getUserRole(user.id);
  return { user, role, area_id, error: roleError };
};

export const fetchTickets = async () => {
  const { data, error } = await supabase
    .from('tickets')
    .select(
      'id, user_id, nombre_usuario, proyecto_id:proyectos(id, nombre), tipo_problema_id:tipos_problema(id, nombre), area_id:areas(id, nombre), asunto, descripcion, status, priority, visto, created_at, responded_at, ticket_responses(id, ticket_id, user_id, mensaje, created_at)'
    )
    .order('created_at', { ascending: false });
  return { data: data as unknown as ITicket[] | null, error };
};

export const createTicket = async (ticketData: TicketInsert) => {
  const { data, error } = await supabase
    .from('tickets')
    .insert(ticketData)
    .select(
      'id, user_id, nombre_usuario, proyecto_id:proyectos(id, nombre), tipo_problema_id:tipos_problema(id, nombre), area_id:areas(id, nombre), asunto, descripcion, status, priority, visto, created_at, responded_at, ticket_responses(id, ticket_id, user_id, mensaje, created_at)'
    )
    .single();

  return { data: data as unknown as ITicket | null, error };
};

export const updateTicketStatus = async (ticketId: string, status: string) => {
  const { data, error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)
    .select();
  return { data, error };
};

export const addTicketResponse = async (response: {
  ticket_id: string;
  user_id: string;
  mensaje: string;
}) => {
  const { data, error } = await supabase
    .from('ticket_responses')
    .insert([response])
    .select();
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/my-tickets' },
  });
  return { data, error };
};

export const fetchAreas = async () => {
  const { data, error } = await supabase
    .from('areas')
    .select('id, nombre')
    .order('nombre', { ascending: true });
  return { data, error };
};

export const fetchProyectos = async () => {
  const { data, error } = await supabase
    .from('proyectos')
    .select('id, nombre')
    .order('nombre', { ascending: true });
  return { data, error };
};

export const fetchTiposProblema = async () => {
  const { data, error } = await supabase
    .from('tipos_problema')
    .select('id, nombre')
    .order('nombre', { ascending: true });
  return { data, error };
};