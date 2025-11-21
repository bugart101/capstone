import { Facility } from '../types';

const FACILITY_KEY = 'scheduler_facilities';

const getLocal = (): Facility[] => {
  const data = localStorage.getItem(FACILITY_KEY);
  return data ? JSON.parse(data) : [];
};

const setLocal = (data: Facility[]) => {
  localStorage.setItem(FACILITY_KEY, JSON.stringify(data));
};

// Seed defaults
if (!localStorage.getItem(FACILITY_KEY)) {
  const seeds: Facility[] = [
    { id: '1', name: 'Main Conference Room', equipment: ['Projector', 'Whiteboard', 'Video Conf'], createdAt: Date.now() },
    { id: '2', name: 'Computer Lab A', equipment: ['30 PCs', 'Projector', 'Printer'], createdAt: Date.now() },
    { id: '3', name: 'Auditorium', equipment: ['Sound System', 'Stage Lights', 'Projector'], createdAt: Date.now() }
  ];
  setLocal(seeds);
}

export const facilityService = {
  getFacilities: async (): Promise<Facility[]> => {
    await new Promise(r => setTimeout(r, 300));
    return getLocal();
  },

  addFacility: async (name: string, equipment: string[]): Promise<Facility> => {
    await new Promise(r => setTimeout(r, 300));
    const list = getLocal();
    const newFac: Facility = {
      id: crypto.randomUUID(),
      name,
      equipment,
      createdAt: Date.now()
    };
    list.push(newFac);
    setLocal(list);
    return newFac;
  },

  updateFacility: async (facility: Facility): Promise<Facility> => {
    await new Promise(r => setTimeout(r, 300));
    const list = getLocal();
    const index = list.findIndex(f => f.id === facility.id);
    if (index !== -1) {
      list[index] = facility;
      setLocal(list);
      return facility;
    }
    throw new Error('Facility not found');
  },

  deleteFacility: async (id: string): Promise<void> => {
    await new Promise(r => setTimeout(r, 300));
    const list = getLocal();
    setLocal(list.filter(f => f.id !== id));
  }
};