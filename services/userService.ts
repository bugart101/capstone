import { User } from '../types';
import { supabase } from './supabaseClient';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }
    return data as User[];
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

    const newUser = {
      ...user,
      createdAt: Date.now()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  },

  updateUser: async (user: User): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update(user)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};