import { create } from 'zustand';
import { dataService } from '../services/dataService';
import { initializeSampleData } from '../utils/sampleData';
import type { Property, Room } from '../types';

interface PropertyState {
  property: Property | null;
  rooms: Room[];
  selectedRoomId: string | null;
  isInitializing: boolean;
  initError: string | null;
  setProperty: (property: Property | null) => void;
  setRooms: (rooms: Room[]) => void;
  selectRoom: (roomId: string | null) => void;
  initialize: () => Promise<void>;
  loadHomeFromData: (jsonData: any) => Promise<void>;
  addRoom: (room: Room) => void;
  updateRooms: (propertyId: string) => Promise<void>;
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  property: null,
  rooms: [],
  selectedRoomId: null,
  isInitializing: true,
  initError: null,
  
  setProperty: (property) => set({ property }),
  
  setRooms: (rooms) => set({ rooms }),
  
  selectRoom: (roomId) => set({ selectedRoomId: roomId }),
  
  initialize: async () => {
    try {
      set({ isInitializing: true, initError: null });
      console.log('Initializing sample data...');
      const propertyId = await initializeSampleData();
      console.log('Property created:', propertyId);

      const propertyData = await dataService.getProperty(propertyId);
      console.log('Property data:', propertyData);

      const roomsData = await dataService.getRoomsByProperty(propertyId);
      console.log('Rooms data:', roomsData);

      set({
        property: propertyData,
        rooms: roomsData,
        selectedRoomId: roomsData.length > 0 ? roomsData[0].id : null,
        isInitializing: false,
      });
    } catch (err: any) {
      console.error('Error initializing app:', err);
      console.error('Error details:', err.message, err.details);
      set({
        initError: err.message || 'שגיאה לא ידועה',
        isInitializing: false,
      });
    }
  },
  
  loadHomeFromData: async (jsonData: any) => {
    try {
      // Detectar formato: nuevo (con id, name directamente) o antiguo (con property)
      let propertyData: { name: string; view_box: string };
      let roomsData: any[];

      if (jsonData.id && jsonData.name && jsonData.rooms) {
        // Formato nuevo: datos directamente en el objeto raíz
        propertyData = {
          name: jsonData.name,
          view_box: jsonData.view_box || '0 0 100 100'
        };
        roomsData = jsonData.rooms;
      } else if (jsonData.property && jsonData.rooms) {
        // Formato antiguo: datos dentro de property
        propertyData = {
          name: jsonData.property.name,
          view_box: jsonData.property.view_box || '0 0 100 100'
        };
        roomsData = jsonData.rooms;
      } else {
        throw new Error('פורמט JSON לא תקין. חייב להכיל property/name ו-rooms.');
      }

      // Crear la propiedad
      const newProperty = await dataService.createProperty(propertyData);

      // Crear las habitaciones y sus datos
      for (const roomData of roomsData) {
        const newRoom = await dataService.createRoom({
          property_id: newProperty.id,
          name: roomData.name,
          svg_path: roomData.svg_path,
          vertices: roomData.vertices,
          wall_height: roomData.wall_height || 2.6
        });

        // Crear instalaciones
        if (roomData.installations && Array.isArray(roomData.installations)) {
          for (const installation of roomData.installations) {
            await dataService.createInstallation({
              room_id: newRoom.id,
              type: installation.type as 'power_point' | 'door' | 'window',
              position: installation.position,
              subtype: installation.subtype || ''
            });
          }
        }

        // Crear equipos médicos
        if (roomData.equipment && Array.isArray(roomData.equipment)) {
          for (const equipment of roomData.equipment) {
            await dataService.createMedicalEquipment({
              room_id: newRoom.id,
              name: equipment.name,
              type: equipment.type,
              position: equipment.position,
              rotation: equipment.rotation || { x: 0, y: 0, z: 0 },
              dimensions: equipment.dimensions
            });
          }
        }
      }

      // Actualizar el estado con la nueva propiedad
      const updatedProperty = await dataService.getProperty(newProperty.id);
      const updatedRooms = await dataService.getRoomsByProperty(newProperty.id);

      set({
        property: updatedProperty,
        rooms: updatedRooms,
        selectedRoomId: updatedRooms.length > 0 ? updatedRooms[0].id : null,
      });
    } catch (error: any) {
      console.error('Error cargando casa:', error);
      throw error;
    }
  },
  
  addRoom: (room) => {
    set((state) => ({
      rooms: [...state.rooms, room],
    }));
  },
  
  updateRooms: async (propertyId: string) => {
    const updatedRooms = await dataService.getRoomsByProperty(propertyId);
    set({ rooms: updatedRooms });
  },
}));

