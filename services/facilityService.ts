import { Facility } from '../types';
import { supabase } from './supabaseClient';

export const facilityService = {
  getFacilities: async (): Promise<Facility[]> => {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('Error fetching facilities:', error);
      return [];
    }
    return data as Facility[];
  },

  addFacility: async (name: string, equipment: string[]): Promise<Facility> => {
    const newFacility = {
      name,
      equipment,
      createdAt: Date.now()
    };

    const { data, error } = await supabase
      .from('facilities')
      .insert([newFacility])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Facility;
  },

  updateFacility: async (facility: Facility): Promise<Facility> => {
    const { data, error } = await supabase
      .from('facilities')
      .update(facility)
      .eq('id', facility.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Facility;
  },

  deleteFacility: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};