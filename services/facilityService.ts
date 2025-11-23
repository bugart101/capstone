
import { Facility } from '../types';
import { supabase } from './supabaseClient';

export const facilityService = {
  getFacilities: async (): Promise<Facility[]> => {
    const { data, error } = await supabase
      .from('facilities')
      .select('*');
    
    if (error) {
      console.error('Error fetching facilities:', error);
      return [];
    }
    return data || [];
  },

  addFacility: async (name: string, equipment: string[], color: string): Promise<Facility> => {
    const { data, error } = await supabase
      .from('facilities')
      .insert({
        name,
        equipment, // Supabase handles JSONB conversion
        color: color || '#3b82f6',
        createdAt: Date.now()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateFacility: async (facility: Facility): Promise<Facility> => {
    const { data, error } = await supabase
      .from('facilities')
      .update({
        name: facility.name,
        equipment: facility.equipment,
        color: facility.color
      })
      .eq('id', facility.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteFacility: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
