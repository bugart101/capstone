
import { User } from '../types';
import { supabase } from './supabaseClient';

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    
    if (error) throw error;
    
    return data.map((u: any) => ({
      id: u.id,
      fullName: u.full_name,
      username: u.username,
      password: u.password,
      email: u.email,
      role: u.role,
      createdAt: u.created_at
    }));
  },

  createUser: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    // Check username uniqueness
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', user.username)
      .single();

    if (existing) throw new Error("Username already exists");

    const { data, error } = await supabase
      .from('users')
      .insert([{
        full_name: user.fullName,
        username: user.username,
        password: user.password,
        email: user.email,
        role: user.role,
        // created_at is auto-handled by DB default, but we can read it back
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      fullName: data.full_name,
      username: data.username,
      password: data.password,
      email: data.email,
      role: data.role as any,
      createdAt: data.created_at
    };
  },

  updateUser: async (user: User): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: user.fullName,
        username: user.username,
        password: user.password,
        email: user.email,
        role: user.role
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...user,
      fullName: data.full_name, // confirm update
    };
  },

  deleteUser: async (id: string): Promise<void> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }
};
