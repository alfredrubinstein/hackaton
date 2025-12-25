/**
 * Servicio de datos basado en archivos JSON y localStorage
 * Reemplaza a Supabase para trabajar completamente con archivos locales
 */

import type { Property, Room, Installation, MedicalEquipment } from '../types';
import centroMedicoData from '../data/homes/centro-medico-san-rafael.json';

// Claves para localStorage
const STORAGE_KEYS = {
  PROPERTIES: 'care_home_properties',
  ROOMS: 'care_home_rooms',
  INSTALLATIONS: 'care_home_installations',
  EQUIPMENT: 'care_home_equipment',
  INITIALIZED: 'care_home_initialized'
};

// Función helper para generar IDs únicos
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Función helper para obtener timestamp ISO
function getTimestamp(): string {
  return new Date().toISOString();
}

// Inicializar datos desde JSON estático si no están inicializados
function initializeFromJSON() {
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true') {
    return;
  }

  try {
    // Convertir el JSON estático al formato de almacenamiento
    const property: Property = {
      id: centroMedicoData.id,
      name: centroMedicoData.name,
      view_box: centroMedicoData.view_box,
      created_at: centroMedicoData.created_at,
      updated_at: centroMedicoData.updated_at
    };

    const rooms: Room[] = centroMedicoData.rooms.map(room => ({
      id: room.id,
      property_id: room.property_id,
      name: room.name,
      svg_path: room.svg_path,
      vertices: room.vertices,
      wall_height: room.wall_height,
      created_at: room.created_at,
      updated_at: room.updated_at
    }));

    const installations: Installation[] = centroMedicoData.rooms.flatMap(room =>
      room.installations.map(inst => ({
        id: inst.id,
        room_id: inst.room_id,
        type: inst.type as 'power_point' | 'door' | 'window',
        position: inst.position,
        subtype: inst.subtype,
        created_at: inst.created_at
      }))
    );

    const equipment: MedicalEquipment[] = centroMedicoData.rooms.flatMap(room =>
      room.equipment.map(eq => ({
        id: eq.id,
        room_id: eq.room_id,
        name: eq.name,
        type: eq.type,
        position: eq.position,
        rotation: eq.rotation,
        dimensions: eq.dimensions,
        created_at: eq.created_at,
        updated_at: eq.updated_at
      }))
    );

    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify([property]));
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
    localStorage.setItem(STORAGE_KEYS.INSTALLATIONS, JSON.stringify(installations));
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  } catch (error) {
    console.error('Error initializing from JSON:', error);
  }
}

// Funciones helper para leer/escribir en localStorage
function getStoredData<T>(key: string, defaultValue: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return defaultValue;
  }
}

function setStoredData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
    throw error;
  }
}

// Inicializar al cargar el módulo
initializeFromJSON();

export const jsonDataService = {
  // Properties
  async getProperties(): Promise<Property[]> {
    return getStoredData<Property>(STORAGE_KEYS.PROPERTIES, []);
  },

  async getProperty(id: string): Promise<Property | null> {
    const properties = await this.getProperties();
    return properties.find(p => p.id === id) || null;
  },

  async createProperty(property: Omit<Property, 'id' | 'created_at' | 'updated_at'>): Promise<Property> {
    const properties = await this.getProperties();
    const newProperty: Property = {
      ...property,
      id: generateId(),
      created_at: getTimestamp(),
      updated_at: getTimestamp()
    };
    properties.push(newProperty);
    setStoredData(STORAGE_KEYS.PROPERTIES, properties);
    return newProperty;
  },

  // Rooms
  async getRoomsByProperty(propertyId: string): Promise<Room[]> {
    const rooms = getStoredData<Room>(STORAGE_KEYS.ROOMS, []);
    return rooms.filter(r => r.property_id === propertyId).sort((a, b) => a.name.localeCompare(b.name));
  },

  async getRoom(id: string): Promise<Room | null> {
    const rooms = getStoredData<Room>(STORAGE_KEYS.ROOMS, []);
    return rooms.find(r => r.id === id) || null;
  },

  async createRoom(room: Omit<Room, 'id' | 'created_at' | 'updated_at'>): Promise<Room> {
    const rooms = getStoredData<Room>(STORAGE_KEYS.ROOMS, []);
    const newRoom: Room = {
      ...room,
      id: generateId(),
      created_at: getTimestamp(),
      updated_at: getTimestamp()
    };
    rooms.push(newRoom);
    setStoredData(STORAGE_KEYS.ROOMS, rooms);
    return newRoom;
  },

  // Installations
  async getInstallationsByRoom(roomId: string): Promise<Installation[]> {
    const installations = getStoredData<Installation>(STORAGE_KEYS.INSTALLATIONS, []);
    return installations.filter(i => i.room_id === roomId);
  },

  async createInstallation(installation: Omit<Installation, 'id' | 'created_at'>): Promise<Installation> {
    const installations = getStoredData<Installation>(STORAGE_KEYS.INSTALLATIONS, []);
    const newInstallation: Installation = {
      ...installation,
      id: generateId(),
      created_at: getTimestamp()
    };
    installations.push(newInstallation);
    setStoredData(STORAGE_KEYS.INSTALLATIONS, installations);
    return newInstallation;
  },

  // Medical Equipment
  async getMedicalEquipmentByRoom(roomId: string): Promise<MedicalEquipment[]> {
    const equipment = getStoredData<MedicalEquipment>(STORAGE_KEYS.EQUIPMENT, []);
    return equipment.filter(e => e.room_id === roomId);
  },

  async createMedicalEquipment(equipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>): Promise<MedicalEquipment> {
    const allEquipment = getStoredData<MedicalEquipment>(STORAGE_KEYS.EQUIPMENT, []);
    const newEquipment: MedicalEquipment = {
      ...equipment,
      id: generateId(),
      created_at: getTimestamp(),
      updated_at: getTimestamp()
    };
    allEquipment.push(newEquipment);
    setStoredData(STORAGE_KEYS.EQUIPMENT, allEquipment);
    return newEquipment;
  },

  async updateMedicalEquipment(id: string, updates: Partial<MedicalEquipment>): Promise<MedicalEquipment> {
    const allEquipment = getStoredData<MedicalEquipment>(STORAGE_KEYS.EQUIPMENT, []);
    const index = allEquipment.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error(`Equipment with id ${id} not found`);
    }
    const updated: MedicalEquipment = {
      ...allEquipment[index],
      ...updates,
      updated_at: getTimestamp()
    };
    allEquipment[index] = updated;
    setStoredData(STORAGE_KEYS.EQUIPMENT, allEquipment);
    return updated;
  },

  async deleteMedicalEquipment(id: string): Promise<void> {
    const allEquipment = getStoredData<MedicalEquipment>(STORAGE_KEYS.EQUIPMENT, []);
    const filtered = allEquipment.filter(e => e.id !== id);
    if (filtered.length === allEquipment.length) {
      throw new Error(`Equipment with id ${id} not found`);
    }
    setStoredData(STORAGE_KEYS.EQUIPMENT, filtered);
  },

  // Utilidades adicionales
  async resetData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.PROPERTIES);
    localStorage.removeItem(STORAGE_KEYS.ROOMS);
    localStorage.removeItem(STORAGE_KEYS.INSTALLATIONS);
    localStorage.removeItem(STORAGE_KEYS.EQUIPMENT);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    initializeFromJSON();
  },

  async exportData(): Promise<string> {
    const data = {
      properties: await this.getProperties(),
      rooms: getStoredData<Room>(STORAGE_KEYS.ROOMS, []),
      installations: getStoredData<Installation>(STORAGE_KEYS.INSTALLATIONS, []),
      equipment: getStoredData<MedicalEquipment>(STORAGE_KEYS.EQUIPMENT, [])
    };
    return JSON.stringify(data, null, 2);
  }
};

