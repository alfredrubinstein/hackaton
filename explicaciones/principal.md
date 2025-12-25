# Documentación Principal - Care In Every Home

## Arquitectura del Sistema

### Visión General

**Care In Every Home** es una aplicación web para la gestión y visualización de espacios médicos en 3D. El sistema permite diseñar, visualizar y gestionar habitaciones médicas con su equipamiento, instalaciones y características arquitectónicas.

### Principios Arquitectónicos (SOLID)

El proyecto sigue los principios SOLID para mantener un código mantenible y escalable:

- **Single Responsibility**: Cada componente y servicio tiene una responsabilidad única y bien definida
- **Open/Closed**: Extensible mediante interfaces y tipos bien definidos
- **Liskov Substitution**: Los componentes pueden ser reemplazados por implementaciones compatibles
- **Interface Segregation**: Interfaces específicas y no sobrecargadas
- **Dependency Inversion**: Dependencias a través de abstracciones (servicios, hooks)

### Stack Tecnológico

- **Frontend**: React 18 + TypeScript
- **3D Rendering**: Three.js
- **Estilos**: Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **API Externa**: Google Cloud Vision API
- **Build Tool**: Vite
- **Control de Versiones**: Git

### Estructura del Proyecto

```
project/
├── src/
│   ├── components/          # Componentes React reutilizables
│   ├── services/           # Lógica de negocio y APIs
│   ├── hooks/              # Custom React hooks
│   ├── types/              # Definiciones TypeScript
│   ├── utils/              # Utilidades y helpers
│   ├── data/               # Datos estáticos y catálogos
│   └── lib/                # Configuración de librerías externas
├── rc/                     # Sistema de control RC (Arduino)
├── supabase/
│   └── migrations/        # Migraciones de base de datos
└── explicaciones/         # Documentación del proyecto
```

## Arquitectura de Base de Datos

### Modelo de Datos

El sistema utiliza una base de datos relacional PostgreSQL con las siguientes entidades:

#### 1. Properties (Propiedades)
Representa un edificio o complejo médico completo.

```sql
properties
├── id (uuid, PK)
├── name (text)              # Nombre de la propiedad
├── view_box (text)          # ViewBox SVG para el mapa global
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

**Relaciones**: Una propiedad tiene muchas habitaciones (1:N)

#### 2. Rooms (Habitaciones)
Representa una habitación individual dentro de una propiedad.

```sql
rooms
├── id (uuid, PK)
├── property_id (uuid, FK → properties.id)
├── name (text)              # Nombre de la habitación
├── svg_path (text)          # Path SVG para visualización 2D
├── vertices (jsonb)         # Array de vértices {x, y} que definen la forma
├── wall_height (decimal)    # Altura de paredes en metros
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

**Relaciones**: 
- Pertenece a una propiedad (N:1)
- Tiene muchas instalaciones (1:N)
- Tiene mucho equipamiento médico (1:N)

**Nota sobre vertices**: Se almacena como JSONB para flexibilidad en formas poligonales.

#### 3. Installations (Instalaciones)
Elementos arquitectónicos fijos en una habitación.

```sql
installations
├── id (uuid, PK)
├── room_id (uuid, FK → rooms.id)
├── type (text)              # 'power_point', 'door', 'window'
├── position (jsonb)         # Posición 3D o segmento {start, end}
├── subtype (text)           # Variante específica (ej: 'wall-mounted')
└── created_at (timestamptz)
```

**Tipos de posición**:
- **power_point**: `{x, y, z}` - Punto 3D
- **door/window**: `{start: {x, y}, end: {x, y}}` - Segmento en el plano

#### 4. Medical Equipment (Equipamiento Médico)
Equipos médicos ubicados en habitaciones.

```sql
medical_equipment
├── id (uuid, PK)
├── room_id (uuid, FK → rooms.id)
├── name (text)              # Nombre del equipo
├── type (text)              # Tipo de equipo
├── position (jsonb)         # {x, y, z} en metros
├── rotation (jsonb)         # {x, y, z} rotación en radianes
├── dimensions (jsonb)       # {width, height, depth} en metros
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### Índices y Optimización

```sql
CREATE INDEX idx_rooms_property_id ON rooms(property_id);
CREATE INDEX idx_installations_room_id ON installations(room_id);
CREATE INDEX idx_medical_equipment_room_id ON medical_equipment(room_id);
```

### Seguridad (RLS - Row Level Security)

Todas las tablas tienen RLS habilitado con políticas que permiten:
- **SELECT**: Todos los usuarios autenticados pueden ver todos los datos
- **INSERT/UPDATE/DELETE**: Todos los usuarios autenticados pueden modificar

**Nota**: En producción, se recomienda implementar políticas más restrictivas basadas en ownership o roles.

### Relaciones y Cascadas

- `rooms.property_id` → `ON DELETE CASCADE`: Si se elimina una propiedad, se eliminan sus habitaciones
- `installations.room_id` → `ON DELETE CASCADE`: Si se elimina una habitación, se eliminan sus instalaciones
- `medical_equipment.room_id` → `ON DELETE CASCADE`: Si se elimina una habitación, se elimina su equipamiento

## Flujo de Datos

### 1. Inicialización
```
App.tsx → initializeSampleData() → dataService → Supabase
```

### 2. Carga de Habitación
```
App.tsx → useRoomData(roomId) → dataService → Supabase
         ↓
    room, installations, equipment
```

### 3. Actualización de Equipamiento
```
RoomViewer3D → onEquipmentUpdate → App.tsx → dataService → Supabase
```

### 4. Creación desde IA
```
PhotoUploader → visionService → roomGeneratorService → App.tsx → dataService → Supabase
```

## Uso de la Base de Datos

### Conexión

El proyecto utiliza Supabase como backend. La configuración se encuentra en `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Variables de Entorno Requeridas

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon
```

### Operaciones CRUD

Todas las operaciones se realizan a través de `dataService` (`src/services/dataService.ts`):

#### Properties
- `getProperties()`: Obtener todas las propiedades
- `getProperty(id)`: Obtener una propiedad por ID
- `createProperty(data)`: Crear nueva propiedad

#### Rooms
- `getRoomsByProperty(propertyId)`: Obtener habitaciones de una propiedad
- `getRoom(id)`: Obtener habitación por ID
- `createRoom(data)`: Crear nueva habitación

#### Installations
- `getInstallationsByRoom(roomId)`: Obtener instalaciones de una habitación
- `createInstallation(data)`: Crear nueva instalación

#### Medical Equipment
- `getMedicalEquipmentByRoom(roomId)`: Obtener equipamiento de una habitación
- `createMedicalEquipment(data)`: Crear nuevo equipo
- `updateMedicalEquipment(id, updates)`: Actualizar equipo
- `deleteMedicalEquipment(id)`: Eliminar equipo

### Ejemplo de Uso

```typescript
import { dataService } from './services/dataService';

// Crear una propiedad
const property = await dataService.createProperty({
  name: "Hospital Central",
  view_box: "0 0 200 150"
});

// Crear una habitación
const room = await dataService.createRoom({
  property_id: property.id,
  name: "Sala de Emergencias",
  svg_path: "M 10,10 L 70,10 L 70,50 L 10,50 Z",
  vertices: [
    { x: 10, y: 10 },
    { x: 70, y: 10 },
    { x: 70, y: 50 },
    { x: 10, y: 50 }
  ],
  wall_height: 3.0
});

// Agregar equipamiento
const equipment = await dataService.createMedicalEquipment({
  room_id: room.id,
  name: "Monitor Principal",
  type: "monitor",
  position: { x: 20, y: 0, z: 15 },
  rotation: { x: 0, y: 0, z: 0 },
  dimensions: { width: 0.4, height: 1.2, depth: 0.4 }
});
```

## Migraciones

Las migraciones se encuentran en `supabase/migrations/`:

1. `20251223181154_create_spatial_architect_schema.sql`: Crea el esquema inicial
2. `20251223183939_update_rls_policies_for_public_access.sql`: Actualiza políticas RLS

Para aplicar migraciones:
```bash
supabase db push
```

## Consideraciones de Rendimiento

1. **Índices**: Se han creado índices en foreign keys para optimizar joins
2. **JSONB**: Uso de JSONB para datos flexibles (vertices, position) permite consultas eficientes
3. **Cascadas**: DELETE CASCADE evita datos huérfanos y mejora la integridad

## Seguridad

- **RLS habilitado**: Todas las tablas tienen Row Level Security
- **Políticas actuales**: Permisivos para desarrollo (todos los usuarios autenticados)
- **Recomendación producción**: Implementar políticas basadas en ownership o roles de usuario

