import { supabase } from '../lib/supabase';
import type { Property, Room, Installation, MedicalEquipment } from '../types';

export const dataService = {
  async getProperties(): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getProperty(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .insert(property)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRoomsByProperty(propertyId: string): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('property_id', propertyId)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async getRoom(id: string): Promise<Room | null> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createRoom(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .insert(room)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getInstallationsByRoom(roomId: string): Promise<Installation[]> {
    const { data, error } = await supabase
      .from('installations')
      .select('*')
      .eq('room_id', roomId);

    if (error) throw error;
    return data || [];
  },

  async createInstallation(installation: Omit<Installation, 'id' | 'created_at'>): Promise<Installation> {
    const { data, error } = await supabase
      .from('installations')
      .insert(installation)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMedicalEquipmentByRoom(roomId: string): Promise<MedicalEquipment[]> {
    const { data, error } = await supabase
      .from('medical_equipment')
      .select('*')
      .eq('room_id', roomId);

    if (error) throw error;
    return data || [];
  },

  async createMedicalEquipment(equipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalEquipment> {
    const { data, error } = await supabase
      .from('medical_equipment')
      .insert(equipment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMedicalEquipment(id: string, updates: Partial<MedicalEquipment>): Promise<MedicalEquipment> {
    const { data, error } = await supabase
      .from('medical_equipment')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMedicalEquipment(id: string): Promise<void> {
    const { error } = await supabase
      .from('medical_equipment')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
