export interface PathPoint {
  x: number;
  y: number;
  theta: number;
  timestamp: number;
}

export interface RoomMapData {
  vertices: Array<{ x: number; y: number }>;
  svgPath: string;
  wallHeight: number;
  pathHistory: PathPoint[];
}

export class MapGenerator3D {
  constructor();
  pathHistory: PathPoint[];
  walls: any[];
  obstacles: any[];
  
  addPathPoint(x: number, y: number, theta: number, timestamp?: number): void;
  generateSimpleMap(margin?: number): RoomMapData | null;
  exportToRoomFormat(roomName: string): RoomMapData | null;
  reset(): void;
  verticesToSvgPath(vertices: Array<{ x: number; y: number }>): string;
}

