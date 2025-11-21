import { EventRequest } from '../types';

const EVENTS_KEY = 'scheduler_events';

const getLocal = (): EventRequest[] => {
  const data = localStorage.getItem(EVENTS_KEY);
  return data ? JSON.parse(data) : [];
};

const setLocal = (data: EventRequest[]) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(data));
};

export const eventService = {
  getEvents: async (): Promise<EventRequest[]> => {
    await new Promise(r => setTimeout(r, 400));
    return getLocal();
  },

  createEvent: async (event: Omit<EventRequest, 'id' | 'createdAt' | 'status'>): Promise<EventRequest> => {
    await new Promise(r => setTimeout(r, 400));
    const list = getLocal();
    const newEvent: EventRequest = {
      ...event,
      id: crypto.randomUUID(),
      status: 'Pending',
      createdAt: Date.now()
    };
    list.push(newEvent);
    setLocal(list);
    return newEvent;
  },

  updateEvent: async (event: EventRequest): Promise<EventRequest> => {
    await new Promise(r => setTimeout(r, 400));
    const list = getLocal();
    const index = list.findIndex(e => e.id === event.id);
    if (index !== -1) {
      list[index] = event;
      setLocal(list);
      return event;
    }
    throw new Error('Event not found');
  },

  deleteEvent: async (id: string): Promise<void> => {
    await new Promise(r => setTimeout(r, 400));
    const list = getLocal();
    setLocal(list.filter(e => e.id !== id));
  }
};