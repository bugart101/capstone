
import { User } from '../types';
import { supabase } from './supabaseClient';

const SESSION_KEY = 'greensync_session';

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    // Query Supabase for the user
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password) // Note: In production, compare hashed passwords!
      .single();

    if (error || !data) {
      throw new Error('Invalid username or password');
    }

    // Map DB fields to Type (snake_case to camelCase)
    const user: User = {
      id: data.id,
      fullName: data.full_name,
      username: data.username,
      password: data.password,
      email: data.email,
      role: data.role as any,
      createdAt: data.created_at
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  }
};
