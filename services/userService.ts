
import { User } from '../types';
import { supabase } from './supabaseClient';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return data || [];
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    // Check if username exists
    const { data: existing } = await supabase
      .from('users')
      .select('username')
      .eq('username', user.username)
      .single();

    if (existing) {
      throw new Error('Username already exists');
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        ...user,
        createdAt: Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateUser: async (user: User): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update({
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        password: user.password
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
