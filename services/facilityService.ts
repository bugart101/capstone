
import { Facility } from '../types';
import { supabase } from './supabaseClient';

export const facilityService = {
  getFacilities: async (): Promise<Facility[]> => {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;

    return data.map((f: any) => ({
      id: f.id,
      name: f.name,
      equipment: f.equipment || [],
      createdAt: f.created_at
    }));
  },

  addFacility: async (name: string, equipment: string[]): Promise<Facility> => {
    const { data, error } = await supabase
      .from('facilities')
      .insert([{ name, equipment }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      equipment: data.equipment,
      createdAt: data.created_at
    };
  },

  updateFacility: async (facility: Facility): Promise<Facility> => {
    const { data, error } = await supabase
      .from('facilities')
      .update({
        name: facility.name,
        equipment: facility.equipment
      })
      .eq('id', facility.id)
      .select()
      .single();

    if (error) throw error;
    return facility;
  },

  deleteFacility: async (id: string): Promise<void> => {
    const { error } = await supabase.from('facilities').delete().eq('id', id);
    if (error) throw error;
  }
};
