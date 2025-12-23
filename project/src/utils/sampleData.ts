import { dataService } from '../services/dataService';
import sampleHouseData from '../data/sampleHouse.json';

export async function initializeSampleData() {
  try {
    const existingProperties = await dataService.getProperties();
    if (existingProperties.length > 0) {
      return existingProperties[0].id;
    }

    const property = await dataService.createProperty({
      name: sampleHouseData.property.name,
      view_box: sampleHouseData.property.view_box
    });

    for (const roomData of sampleHouseData.rooms) {
      const room = await dataService.createRoom({
        property_id: property.id,
        name: roomData.name,
        svg_path: roomData.svg_path,
        vertices: roomData.vertices,
        wall_height: roomData.wall_height
      });

      for (const installation of roomData.installations) {
        await dataService.createInstallation({
          room_id: room.id,
          type: installation.type as 'power_point' | 'door' | 'window',
          position: installation.position,
          subtype: installation.subtype
        });
      }

      if (roomData.equipment) {
        for (const equipment of roomData.equipment) {
          await dataService.createMedicalEquipment({
            room_id: room.id,
            name: equipment.name,
            type: equipment.type,
            position: equipment.position,
            rotation: { x: 0, y: 0, z: 0 },
            dimensions: equipment.dimensions
          });
        }
      }
    }

    return property.id;
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
}
