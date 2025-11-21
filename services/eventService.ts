
import { EventRequest } from '../types';
import { supabase } from './supabaseClient';

export const eventService = {
  getEvents: async (): Promise<EventRequest[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }
    
    return data.map((e: any) => ({
      id: e.id,
      userId: e.user_id,
      requesterName: e.requester_name,
      eventTitle: e.event_title,
      facility: e.facility,
      date: e.date,
      timeSlot: e.time_slot,
      startTime: e.start_time,
      endTime: e.end_time,
      equipment: e.equipment || [],
      status: e.status as any,
      createdAt: e.created_at
    }));
  },

  createEvent: async (event: Omit<EventRequest, 'id' | 'createdAt' | 'status'>): Promise<EventRequest> => {
    const { data, error } = await supabase
      .from('events')
      .insert([{
        user_id: event.userId,
        requester_name: event.requesterName,
        event_title: event.eventTitle,
        facility: event.facility,
        date: event.date,
        time_slot: event.timeSlot,
        start_time: event.startTime,
        end_time: event.endTime,
        equipment: event.equipment, // Supabase handles JSON automatically
        status: 'Pending'
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...event,
      id: data.id,
      status: 'Pending',
      createdAt: data.created_at
    };
  },

  updateEvent: async (event: EventRequest): Promise<EventRequest> => {
    const { error } = await supabase
      .from('events')
      .update({
        requester_name: event.requesterName,
        event_title: event.eventTitle,
        facility: event.facility,
        date: event.date,
        time_slot: event.timeSlot,
        start_time: event.startTime,
        end_time: event.endTime,
        equipment: event.equipment,
        status: event.status
      })
      .eq('id', event.id);

    if (error) throw error;
    return event;
  },

  deleteEvent: async (id: string): Promise<void> => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  }
};
