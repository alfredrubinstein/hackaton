# Documentación de Datos

## Visión General

La carpeta `data/` contiene datos estáticos, catálogos y archivos de configuración que no cambian en tiempo de ejecución.

## Archivos de Datos

### 1. medicalEquipmentCatalog.ts
**Responsabilidad**: Catálogo de equipamiento médico disponible para agregar a habitaciones.

**Estructura**:
```typescript
export interface EquipmentTemplate {
  name: string;
  type: string;
  defaultDimensions: Dimensions;
  description?: string;
  category?: string;
}

export const medicalEquipmentCatalog: EquipmentTemplate[] = [
  // Lista de equipamiento...
]
```

**Uso**:
- `EquipmentCatalog` lee este catálogo
- Se usa para drag & drop de equipamiento
- Define dimensiones por defecto para cada tipo

**Extensión**:
Para agregar nuevo equipamiento:
1. Agregar entrada al array `medicalEquipmentCatalog`
2. Incluir `name`, `type`, `defaultDimensions`
3. Opcionalmente `description` y `category`

### 2. sampleHouse.json
**Responsabilidad**: Datos de ejemplo para inicialización de la aplicación.

**Estructura**:
```json
{
  "property": {
    "name": "Centro Médico San Rafael",
    "view_box": "0 0 200 150"
  },
  "rooms": [
    {
      "name": "Sala de Emergencias",
      "svg_path": "M 10,10 L 70,10 L 70,50 L 10,50 Z",
      "vertices": [...],
      "wall_height": 3.0,
      "installations": [...],
      "equipment": [...]
    }
  ]
}
```

**Uso**:
- Se carga automáticamente al iniciar la aplicación
- Proporciona datos de ejemplo para desarrollo
- Formato compatible con `handleLoadFromJSON`

**Formato JSON Esperado**:
- `property`: Objeto con `name` y `view_box`
- `rooms`: Array de habitaciones
  - Cada habitación debe tener: `name`, `svg_path`, `vertices`, `wall_height`
  - Opcional: `installations` (array)
  - Opcional: `equipment` (array)

## Formato de Datos

### Vertices
Array de objetos `{x: number, y: number}` que definen la forma de la habitación en el plano 2D.

**Ejemplo**:
```json
"vertices": [
  { "x": 10, "y": 10 },
  { "x": 70, "y": 10 },
  { "x": 70, "y": 50 },
  { "x": 10, "y": 50 }
]
```

### Installations
Array de instalaciones con estructura variable según tipo:

**Power Point**:
```json
{
  "type": "power_point",
  "position": { "x": 15, "y": 0.3, "z": 15 },
  "subtype": "wall-mounted"
}
```

**Door/Window**:
```json
{
  "type": "door",
  "position": {
    "start": { "x": 35, "y": 50 },
    "end": { "x": 45, "y": 50 }
  },
  "subtype": "sliding"
}
```

### Equipment
Array de equipamiento médico:

```json
{
  "name": "Monitor Principal",
  "type": "monitor",
  "position": { "x": 20, "y": 0, "z": 15 },
  "dimensions": { "width": 0.4, "height": 1.2, "depth": 0.4 }
}
```

## Importación y Uso

### En TypeScript
```typescript
import { medicalEquipmentCatalog } from '../data/medicalEquipmentCatalog';
import sampleHouseData from '../data/sampleHouse.json';
```

### En JavaScript
```javascript
import sampleHouseData from '../data/sampleHouse.json';
```

## Validación

Los datos estáticos no se validan en tiempo de compilación. Se recomienda:
1. Validar al cargar desde JSON
2. Usar TypeScript para type safety
3. Validar en `handleLoadFromJSON` antes de crear en BD

