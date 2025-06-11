import { supabase, getCurrentUser, getUserRole } from './supabase';
import { User } from '@supabase/supabase-js';

type UserRoleResponse = {
  user: User | null;
  role: string | null;
  area_id: string | null;
  error: any;
};

export const getUserRoleFromSession = async (): Promise<UserRoleResponse> => {
  const { data: userData, error: userError } = await getCurrentUser();
  if (userError || !userData) {
    return { user: null, role: null, area_id: null, error: userError ?? new Error('No user') };
  }

  const { role, area_id, error: roleError } = await getUserRole(userData.id);
  return {
    user: userData,
    role,
    area_id,
    error: roleError,
  };
};