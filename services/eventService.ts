import { EventRequest } from '../types';
import { supabase } from './supabaseClient';

export const eventService = {
  getEvents: async (): Promise<EventRequest[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }
    return data as EventRequest[];
  },

  createEvent: async (event: Omit<EventRequest, 'id' | 'createdAt' | 'status'>): Promise<EventRequest> => {
    const newEvent = {
      ...event,
      status: 'Pending',
      createdAt: Date.now()
    };

    const { data, error } = await supabase
      .from('events')
      .insert([newEvent])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as EventRequest;
  },

  updateEvent: async (event: EventRequest): Promise<EventRequest> => {
    const { data, error } = await supabase
      .from('events')
      .update(event)
      .eq('id', event.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as EventRequest;
  },

  deleteEvent: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};