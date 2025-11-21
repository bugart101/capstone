import { User } from '../types';
import { supabase } from './supabaseClient';

const SESSION_KEY = 'greensync_session';

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      throw new Error('Invalid username or password');
    }

    const user = data as User;
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