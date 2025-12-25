# Documentación de Utilidades

## Visión General

Las utilidades proporcionan funciones helper reutilizables que no dependen del estado de React. Están organizadas por dominio funcional.

## Utilidades Disponibles

### 1. geometry.ts
**Responsabilidad**: Funciones de geometría y validación espacial.

**Funciones**:

#### `calculateCentroid(vertices: Vertex[]): { x: number; y: number }`
Calcula el centroide (centro geométrico) de un polígono.

**Uso**: Para centrar la cámara o calcular puntos de referencia.

**Algoritmo**: Promedio de coordenadas X e Y.

#### `isEquipmentInValidPosition(position: Position3D, dimensions: Dimensions, roomVertices: Vertex[]): boolean`
Valida si un equipamiento cabe dentro de los límites de una habitación.

**Validaciones**:
1. Verifica que todas las esquinas del equipamiento estén dentro del polígono de la habitación
2. Considera las dimensiones del equipamiento
3. Usa algoritmo de punto en polígono

**Algoritmo**: 
- Calcula las 4 esquinas del equipamiento (considerando dimensiones)
- Verifica cada esquina con punto en polígono
- Retorna `true` solo si todas las esquinas están dentro

**Uso**:
```typescript
const isValid = isEquipmentInValidPosition(
  { x: 5, y: 0, z: 3 },
  { width: 1, height: 1, depth: 0.5 },
  room.vertices
);
```

### 2. sampleData.ts
**Responsabilidad**: Inicialización de datos de ejemplo.

**Función**:

#### `initializeSampleData(): Promise<string>`
Crea datos de ejemplo en la base de datos.

**Proceso**:
1. Verifica si ya existen propiedades
2. Si no existen, crea una propiedad desde `sampleHouse.json`
3. Crea todas las habitaciones con sus instalaciones y equipamiento
4. Retorna el ID de la propiedad creada

**Datos Fuente**: `src/data/sampleHouse.json`

**Uso**: Se llama automáticamente al inicializar la aplicación.

## Algoritmos Implementados

### Punto en Polígono
Usado en `isEquipmentInValidPosition` para verificar si un punto está dentro de un polígono.

**Algoritmo**: Ray casting algorithm
- Lanza un rayo desde el punto hacia el infinito
- Cuenta intersecciones con los bordes del polígono
- Si el número es impar, el punto está dentro

### Cálculo de Centroide
Promedio simple de coordenadas:
```
centroid.x = sum(vertices.x) / vertices.length
centroid.y = sum(vertices.y) / vertices.length
```

## Extensibilidad

Para agregar nuevas utilidades:

1. Agrupar por dominio funcional
2. Funciones puras (sin efectos secundarios)
3. Documentar parámetros y retorno
4. Incluir ejemplos de uso
5. Considerar casos edge

**Ejemplo**:
```typescript
// utils/math.ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
```

