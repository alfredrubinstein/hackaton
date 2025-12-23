import type { Vertex, Position3D } from '../types';

export function calculateCentroid(vertices: Vertex[]): Vertex {
  const sum = vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }),
    { x: 0, y: 0 }
  );
  return {
    x: sum.x / vertices.length,
    y: sum.y / vertices.length
  };
}

export function isPointInPolygon(point: Vertex, vertices: Vertex[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isEquipmentInValidPosition(
  position: Position3D,
  dimensions: { width: number; depth: number },
  roomVertices: Vertex[]
): boolean {
  const corners = [
    { x: position.x - dimensions.width / 2, y: position.y - dimensions.depth / 2 },
    { x: position.x + dimensions.width / 2, y: position.y - dimensions.depth / 2 },
    { x: position.x + dimensions.width / 2, y: position.y + dimensions.depth / 2 },
    { x: position.x - dimensions.width / 2, y: position.y + dimensions.depth / 2 }
  ];

  return corners.every(corner => isPointInPolygon(corner, roomVertices));
}

export function verticesTo3DPath(vertices: Vertex[], height: number): Position3D[] {
  return vertices.map(v => ({ x: v.x, y: height, z: v.y }));
}
