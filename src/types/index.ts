export interface Vertex {
  x: number;
  y: number;
}

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface Property {
  id: string;
  name: string;
  view_box: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  property_id: string;
  name: string;
  svg_path: string;
  vertices: Vertex[];
  wall_height: number;
  created_at: string;
  updated_at: string;
}

export interface Installation {
  id: string;
  room_id: string;
  type: 'power_point' | 'door' | 'window';
  position: Position3D | { start: Vertex; end: Vertex };
  subtype: string;
  created_at: string;
}

export interface MedicalEquipment {
  id: string;
  room_id: string;
  name: string;
  type: string;
  position: Position3D;
  rotation: Position3D;
  dimensions: Dimensions;
  created_at: string;
  updated_at: string;
}
