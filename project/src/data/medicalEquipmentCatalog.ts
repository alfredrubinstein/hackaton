import equipmentTemplates from './equipment/equipment-templates.json';

export interface EquipmentTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  defaultDimensions: {
    width: number;
    height: number;
    depth: number;
  };
  icon: string;
  color: string;
}

// Cargar catálogo desde JSON
export const medicalEquipmentCatalog: EquipmentTemplate[] = equipmentTemplates as EquipmentTemplate[];

export function getEquipmentByType(type: string): EquipmentTemplate | undefined {
  return medicalEquipmentCatalog.find(eq => eq.type === type);
}

export function getEquipmentsByCategory(category: string): EquipmentTemplate[] {
  return medicalEquipmentCatalog.filter(eq => eq.category === category);
}

export const categories = Array.from(
  new Set(medicalEquipmentCatalog.map(eq => eq.category))
);
