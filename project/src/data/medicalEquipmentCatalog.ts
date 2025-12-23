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

export const medicalEquipmentCatalog: EquipmentTemplate[] = [
  {
    id: 'bed-hospital',
    name: 'Cama Hospitalaria',
    type: 'bed',
    category: 'Mobiliario',
    defaultDimensions: { width: 2.1, height: 0.9, depth: 1.0 },
    icon: '🛏️',
    color: '#3b82f6'
  },
  {
    id: 'monitor-vital-signs',
    name: 'Monitor de Signos Vitales',
    type: 'monitor',
    category: 'Monitoreo',
    defaultDimensions: { width: 0.4, height: 1.2, depth: 0.4 },
    icon: '📊',
    color: '#10b981'
  },
  {
    id: 'ventilator',
    name: 'Ventilador Mecánico',
    type: 'ventilator',
    category: 'Soporte Vital',
    defaultDimensions: { width: 0.5, height: 1.3, depth: 0.6 },
    icon: '🌬️',
    color: '#8b5cf6'
  },
  {
    id: 'infusion-pump',
    name: 'Bomba de Infusión',
    type: 'pump',
    category: 'Administración',
    defaultDimensions: { width: 0.3, height: 0.4, depth: 0.2 },
    icon: '💉',
    color: '#ec4899'
  },
  {
    id: 'ultrasound',
    name: 'Ecógrafo',
    type: 'scanner',
    category: 'Diagnóstico',
    defaultDimensions: { width: 0.6, height: 1.4, depth: 0.7 },
    icon: '🔬',
    color: '#f59e0b'
  },
  {
    id: 'xray-portable',
    name: 'Rayos X Portátil',
    type: 'xray',
    category: 'Diagnóstico',
    defaultDimensions: { width: 0.8, height: 1.6, depth: 0.8 },
    icon: '📷',
    color: '#6366f1'
  },
  {
    id: 'defibrillator',
    name: 'Desfibrilador',
    type: 'defibrillator',
    category: 'Emergencia',
    defaultDimensions: { width: 0.4, height: 1.0, depth: 0.4 },
    icon: '⚡',
    color: '#ef4444'
  },
  {
    id: 'medical-cart',
    name: 'Carro de Curaciones',
    type: 'cart',
    category: 'Mobiliario',
    defaultDimensions: { width: 0.6, height: 1.0, depth: 0.5 },
    icon: '🛒',
    color: '#14b8a6'
  },
  {
    id: 'oxygen-tank',
    name: 'Tanque de Oxígeno',
    type: 'oxygen',
    category: 'Suministros',
    defaultDimensions: { width: 0.3, height: 1.4, depth: 0.3 },
    icon: '🫁',
    color: '#06b6d4'
  },
  {
    id: 'dialysis-machine',
    name: 'Máquina de Diálisis',
    type: 'dialysis',
    category: 'Tratamiento',
    defaultDimensions: { width: 0.7, height: 1.5, depth: 0.7 },
    icon: '⚕️',
    color: '#a855f7'
  },
  {
    id: 'wheelchair',
    name: 'Silla de Ruedas',
    type: 'wheelchair',
    category: 'Movilidad',
    defaultDimensions: { width: 0.7, height: 1.0, depth: 1.0 },
    icon: '♿',
    color: '#84cc16'
  },
  {
    id: 'exam-table',
    name: 'Camilla de Examen',
    type: 'table',
    category: 'Mobiliario',
    defaultDimensions: { width: 1.8, height: 0.8, depth: 0.7 },
    icon: '🛋️',
    color: '#22d3ee'
  }
];

export function getEquipmentByType(type: string): EquipmentTemplate | undefined {
  return medicalEquipmentCatalog.find(eq => eq.type === type);
}

export function getEquipmentsByCategory(category: string): EquipmentTemplate[] {
  return medicalEquipmentCatalog.filter(eq => eq.category === category);
}

export const categories = Array.from(
  new Set(medicalEquipmentCatalog.map(eq => eq.category))
);
