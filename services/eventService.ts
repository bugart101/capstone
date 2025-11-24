
import { EventRequest } from '../types';
import { supabase } from './supabaseClient';

export const eventService = {
  getEvents: async (): Promise<EventRequest[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*');
    
    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }
    
    // Polyfill: Ensure 'dates' array exists for legacy events
    return (data || []).map((event: any) => ({
      ...event,
      dates: (event.dates && event.dates.length > 0) ? event.dates : [event.date]
    }));
  },

  createEvent: async (event: Omit<EventRequest, 'id' | 'createdAt' | 'status'>): Promise<EventRequest> => {
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...event,
        // Ensure 'dates' is stored as JSONB array. 
        // If we are passing just 'date', make sure 'dates' is set too
        dates: event.dates && event.dates.length > 0 ? event.dates : [event.date],
        status: 'Pending',
        createdAt: Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateEvent: async (event: EventRequest): Promise<EventRequest> => {
    const { data, error } = await supabase
      .from('events')
      .update({
        requesterName: event.requesterName,
        eventTitle: event.eventTitle,
        facility: event.facility,
        date: event.date,
        dates: event.dates,
        timeSlot: event.timeSlot,
        startTime: event.startTime,
        endTime: event.endTime,
        equipment: event.equipment,
        status: event.status
      })
      .eq('id', event.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
