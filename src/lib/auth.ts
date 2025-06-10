import { supabase } from "./supabase";

// src/lib/auth.ts
export const getUserRoleFromSession = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
    if (sessionError || !session) {
      return { user: null, role: null, error: sessionError || new Error("No session found") };
    }
  
    const user = session.user;
  
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
  
    const role = roleData?.role || null;
  
    return { user, role, error: roleError };
  };
  