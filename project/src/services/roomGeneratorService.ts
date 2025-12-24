/**
 * Servicio para generar JSON de habitaciones desde análisis de Vision API
 * Convierte los resultados del análisis en el formato compatible con Room
 */

import type { Room, Installation, Vertex } from '../types';
import type { VisionAnalysisResult } from './visionService';

export interface GeneratedRoomData {
  name: string;
  svg_path: string;
  vertices: Vertex[];
  wall_height: number;
  installations: Array<{
    type: 'power_point' | 'door' | 'window';
    position: Installation['position'];
    subtype: string;
  }>;
}

export class RoomGeneratorService {
  /**
   * Genera datos de habitación desde el análisis de Vision API
   */
  generateRoomFromAnalysis(
    analysis: VisionAnalysisResult,
    roomName: string = 'Habitación desde Foto',
    referenceMeasurement?: { value: number; unit: 'meters' | 'feet' }
  ): GeneratedRoomData {
    // Normalizar vértices y asegurar que formen un polígono válido
    const vertices = this.normalizeVertices(analysis.geometry.vertices);

    // Generar SVG path desde vértices
    const svgPath = this.verticesToSvgPath(vertices);

    // Calcular altura de pared (usar estimación o estándar)
    const wallHeight = analysis.geometry.estimatedHeight || 2.6;

    // Convertir instalaciones detectadas al formato correcto
    const installations = this.convertInstallations(
      analysis.installations,
      vertices,
      wallHeight
    );

    return {
      name: roomName,
      svg_path: svgPath,
      vertices,
      wall_height: wallHeight,
      installations,
    };
  }

  /**
   * Normaliza y valida los vértices para formar un polígono válido
   */
  private normalizeVertices(vertices: Vertex[]): Vertex[] {
    if (vertices.length < 3) {
      // Si no hay suficientes vértices, crear un rectángulo por defecto
      return [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 4 },
        { x: 0, y: 4 },
      ];
    }

    // Asegurar que el polígono esté cerrado (primer y último vértice iguales)
    const normalized = [...vertices];
    const first = normalized[0];
    const last = normalized[normalized.length - 1];

    if (first.x !== last.x || first.y !== last.y) {
      normalized.push({ x: first.x, y: first.y });
    }

    // Asegurar que los vértices estén en orden correcto (sentido horario o antihorario)
    return this.ensureCounterClockwise(normalized);
  }

  /**
   * Asegura que los vértices estén en orden antihorario (estándar para polígonos)
   */
  private ensureCounterClockwise(vertices: Vertex[]): Vertex[] {
    // Calcular el área con signo (shoelace formula)
    let area = 0;
    for (let i = 0; i < vertices.length - 1; i++) {
      area += (vertices[i + 1].x - vertices[i].x) * (vertices[i + 1].y + vertices[i].y);
    }

    // Si el área es positiva, está en sentido horario, invertir
    if (area > 0) {
      return [...vertices].reverse();
    }

    return vertices;
  }

  /**
   * Convierte vértices a formato SVG path
   */
  private verticesToSvgPath(vertices: Vertex[]): string {
    if (vertices.length === 0) return '';

    const pathParts: string[] = [];
    pathParts.push(`M ${vertices[0].x},${vertices[0].y}`);

    for (let i = 1; i < vertices.length; i++) {
      pathParts.push(`L ${vertices[i].x},${vertices[i].y}`);
    }

    pathParts.push('Z'); // Cerrar el path

    return pathParts.join(' ');
  }

  /**
   * Convierte instalaciones detectadas al formato de Installation
   */
  private convertInstallations(
    detectedInstallations: VisionAnalysisResult['installations'],
    roomVertices: Vertex[],
    wallHeight: number
  ): GeneratedRoomData['installations'] {
    const installations: GeneratedRoomData['installations'] = [];

    // Calcular centro y dimensiones de la habitación para posicionar instalaciones
    const bounds = this.calculateRoomBounds(roomVertices);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;

    detectedInstallations.forEach((inst) => {
      if (inst.type === 'door' && 'start' in inst.position) {
        // Puerta: posición relativa en el perímetro
        const start = inst.position.start;
        const end = inst.position.end;

        // Las coordenadas pueden estar normalizadas (0-1) o en metros
        // Si están normalizadas, convertirlas a coordenadas reales
        const doorStart = {
          x: start.x <= 1 ? bounds.minX + start.x * (bounds.maxX - bounds.minX) : start.x,
          y: start.y <= 1 ? bounds.minZ + start.y * (bounds.maxZ - bounds.minZ) : start.y,
        };
        const doorEnd = {
          x: end.x <= 1 ? bounds.minX + end.x * (bounds.maxX - bounds.minX) : end.x,
          y: end.y <= 1 ? bounds.minZ + end.y * (bounds.maxZ - bounds.minZ) : end.y,
        };

        installations.push({
          type: 'door',
          position: {
            start: doorStart,
            end: doorEnd,
          },
          subtype: inst.subtype || 'hinged',
        });
      } else if (inst.type === 'window' && 'start' in inst.position) {
        // Ventana: similar a puerta
        const start = inst.position.start;
        const end = inst.position.end;

        const windowStart = {
          x: start.x <= 1 ? bounds.minX + start.x * (bounds.maxX - bounds.minX) : start.x,
          y: start.y <= 1 ? bounds.minZ + start.y * (bounds.maxZ - bounds.minZ) : start.y,
        };
        const windowEnd = {
          x: end.x <= 1 ? bounds.minX + end.x * (bounds.maxX - bounds.minX) : end.x,
          y: end.y <= 1 ? bounds.minZ + end.y * (bounds.maxZ - bounds.minZ) : end.y,
        };

        installations.push({
          type: 'window',
          position: {
            start: windowStart,
            end: windowEnd,
          },
          subtype: inst.subtype || 'fixed',
        });
      } else if (inst.type === 'power_point' && 'x' in inst.position) {
        // Punto de energía: posición 3D
        const pos = inst.position;
        
        // Si las coordenadas están normalizadas (0-1), convertirlas
        const x = pos.x <= 1 ? bounds.minX + pos.x * (bounds.maxX - bounds.minX) : pos.x;
        const z = pos.y <= 1 ? bounds.minZ + pos.y * (bounds.maxZ - bounds.minZ) : pos.y;

        installations.push({
          type: 'power_point',
          position: {
            x,
            y: pos.z || 0.3,
            z,
          },
          subtype: inst.subtype || 'wall-mounted',
        });
      }
    });

    // Si no se detectaron instalaciones, agregar algunas por defecto en posiciones razonables
    if (installations.length === 0) {
      installations.push({
        type: 'door',
        position: {
          start: { x: centerX - 0.5, y: bounds.maxZ },
          end: { x: centerX + 0.5, y: bounds.maxZ },
        },
        subtype: 'hinged',
      });
    }

    return installations;
  }

  /**
   * Calcula los límites de la habitación desde los vértices
   */
  private calculateRoomBounds(vertices: Vertex[]): {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  } {
    if (vertices.length === 0) {
      return { minX: 0, maxX: 5, minZ: 0, maxZ: 4 };
    }

    const xs = vertices.map(v => v.x);
    const ys = vertices.map(v => v.y);

    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minZ: Math.min(...ys),
      maxZ: Math.max(...ys),
    };
  }

  /**
   * Ajusta las medidas usando una referencia proporcionada por el usuario
   */
  adjustMeasurements(
    roomData: GeneratedRoomData,
    referenceMeasurement: { value: number; unit: 'meters' | 'feet' },
    referenceObject: { width: number; height: number } // Dimensiones del objeto de referencia en la imagen
  ): GeneratedRoomData {
    // Convertir a metros si es necesario
    const referenceMeters = referenceMeasurement.unit === 'feet'
      ? referenceMeasurement.value * 0.3048
      : referenceMeasurement.value;

    // Calcular factor de escala
    const referenceSizeInImage = Math.max(referenceObject.width, referenceObject.height);
    const scaleFactor = referenceMeters / referenceSizeInImage;

    // Aplicar escala a todos los vértices
    const scaledVertices = roomData.vertices.map(v => ({
      x: v.x * scaleFactor,
      y: v.y * scaleFactor,
    }));

    // Aplicar escala a instalaciones
    const scaledInstallations = roomData.installations.map(inst => {
      if ('start' in inst.position) {
        return {
          ...inst,
          position: {
            start: {
              x: inst.position.start.x * scaleFactor,
              y: inst.position.start.y * scaleFactor,
            },
            end: {
              x: inst.position.end.x * scaleFactor,
              y: inst.position.end.y * scaleFactor,
            },
          },
        };
      } else {
        return {
          ...inst,
          position: {
            x: inst.position.x * scaleFactor,
            y: inst.position.y,
            z: inst.position.z * scaleFactor,
          },
        };
      }
    });

    return {
      ...roomData,
      vertices: scaledVertices,
      installations: scaledInstallations,
    };
  }
}

export const roomGeneratorService = new RoomGeneratorService();

