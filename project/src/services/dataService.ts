// Migrado a jsonDataService - este archivo se mantiene para compatibilidad
// pero ahora usa jsonDataService internamente
import { jsonDataService } from './jsonDataService';
import type { Property, Room, Installation, MedicalEquipment } from '../types';

export const dataService = {
  async getProperties(): Promise<Property[]> {
    return jsonDataService.getProperties();
  },

  async getProperty(id: string): Promise<Property | null> {
    return jsonDataService.getProperty(id);
  },

  async createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property> {
    return jsonDataService.createProperty(property);
  },

  async getRoomsByProperty(propertyId: string): Promise<Room[]> {
    return jsonDataService.getRoomsByProperty(propertyId);
  },

  async getRoom(id: string): Promise<Room | null> {
    return jsonDataService.getRoom(id);
  },

  async createRoom(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Promise<Room> {
    return jsonDataService.createRoom(room);
  },

  async getInstallationsByRoom(roomId: string): Promise<Installation[]> {
    return jsonDataService.getInstallationsByRoom(roomId);
  },

  async createInstallation(installation: Omit<Installation, 'id' | 'created_at'>): Promise<Installation> {
    return jsonDataService.createInstallation(installation);
  },

  async getMedicalEquipmentByRoom(roomId: string): Promise<MedicalEquipment[]> {
    return jsonDataService.getMedicalEquipmentByRoom(roomId);
  },

  async createMedicalEquipment(equipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalEquipment> {
    return jsonDataService.createMedicalEquipment(equipment);
  },

  async updateMedicalEquipment(id: string, updates: Partial<MedicalEquipment>): Promise<MedicalEquipment> {
    return jsonDataService.updateMedicalEquipment(id, updates);
  },

  async deleteMedicalEquipment(id: string): Promise<void> {
    return jsonDataService.deleteMedicalEquipment(id);
  }
};
