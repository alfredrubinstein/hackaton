# Documentación de Componentes

## Visión General

Los componentes React están organizados siguiendo el principio de responsabilidad única. Cada componente tiene un propósito específico y bien definido.

## Componentes Principales

### 1. App.tsx
**Responsabilidad**: Componente raíz que orquesta toda la aplicación.

**Funcionalidades**:
- Gestión del estado global (propiedades, habitaciones, selecciones)
- Coordinación entre componentes
- Manejo de modales y paneles
- Integración con servicios externos (Vision API, Supabase)

**Estados Principales**:
- `property`: Propiedad actual
- `rooms`: Lista de habitaciones
- `selectedRoomId`: Habitación seleccionada
- `selectedEquipmentId`: Equipamiento seleccionado
- `viewMode`: Modo de visualización ('2d' | '3d')

### 2. RoomViewer3D.tsx
**Responsabilidad**: Visualización 3D de habitaciones usando Three.js.

**Funcionalidades**:
- Renderizado 3D de habitaciones, paredes, piso y techo
- Visualización de equipamiento médico
- Sistema de ejes de transformación (estilo Blender) para mover objetos
- Arrastre de objetos a lo largo de ejes X, Y, Z
- Cámara con controles OrbitControls
- Restricciones de movimiento de cámara dentro de la habitación

**Props**:
```typescript
interface RoomViewer3DProps {
  room: Room;
  installations: Installation[];
  equipment: MedicalEquipment[];
  onEquipmentUpdate?: (id: string, position: Position3D) => void;
  onEquipmentDrop?: (equipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>) => void;
  onEquipmentDelete?: (id: string) => void;
  selectedEquipmentId?: string | null;
  onEquipmentSelect?: (id: string | null) => void;
  cameraEnabled?: boolean;
}
```

**Características Técnicas**:
- Usa `useRef` para mantener referencias a objetos Three.js
- Sistema de ejes de transformación que solo se muestran cuando un objeto está seleccionado
- Arrastre por eje: calcula movimiento del mouse y lo proyecta en el eje seleccionado
- Actualización visual inmediata durante el arrastre

### 3. FloorPlan2D.tsx
**Responsabilidad**: Visualización 2D en formato SVG de la planta de la habitación.

**Funcionalidades**:
- Renderizado SVG de la forma de la habitación
- Visualización de equipamiento en vista superior
- Arrastre de objetos en el plano 2D
- Grid de 0.5m para alineación
- Validación de límites de habitación

**Props**:
```typescript
interface FloorPlan2DProps {
  room: Room;
  equipment: MedicalEquipment[];
  installations: Installation[];
  onEquipmentDrop?: (equipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>) => void;
  onEquipmentUpdate?: (id: string, position: Position3D) => void;
  selectedEquipmentId?: string | null;
  onEquipmentSelect?: (id: string | null) => void;
}
```

### 4. EquipmentPanel.tsx
**Responsabilidad**: Panel para gestionar el equipamiento médico de una habitación.

**Funcionalidades**:
- Lista de equipamiento existente
- Formulario para agregar nuevo equipamiento
- Validación de posición dentro de límites de habitación
- Eliminación de equipamiento

**Props**:
```typescript
interface EquipmentPanelProps {
  room: Room;
  equipment: MedicalEquipment[];
  onAddEquipment: (equipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateEquipment: (id: string, updates: Partial<MedicalEquipment>) => void;
  onDeleteEquipment: (id: string) => void;
}
```

### 5. EquipmentCatalog.tsx
**Responsabilidad**: Catálogo de equipamiento médico disponible para agregar.

**Funcionalidades**:
- Muestra catálogo de equipamiento desde `medicalEquipmentCatalog.ts`
- Drag & Drop para agregar equipamiento a habitaciones
- Filtrado por tipo de equipo
- Vista de detalles de cada equipo

**Datos**: Se obtiene de `src/data/medicalEquipmentCatalog.ts`

### 6. PositionPanel.tsx
**Responsabilidad**: Panel para editar la posición de equipamiento seleccionado.

**Funcionalidades**:
- Inputs numéricos para X, Y, Z
- Validación de posición válida
- Snap a grid de 0.5m
- Actualización en tiempo real

**Props**:
```typescript
interface PositionPanelProps {
  room: Room;
  equipment: MedicalEquipment[];
  selectedEquipmentId?: string | null;
  onUpdatePosition: (id: string, position: Position3D) => void;
  onDeselect: () => void;
}
```

### 7. PhotoUploader.tsx
**Responsabilidad**: Componente para subir y analizar fotos con IA.

**Funcionalidades**:
- Subida de múltiples fotos (archivo o cámara)
- Vista previa de fotos
- Integración con Google Cloud Vision API
- Análisis de imágenes para detectar habitaciones

**Props**:
```typescript
interface PhotoUploaderProps {
  onPhotosChange: (photos: PhotoFile[]) => void;
  onAnalyze: (photos: PhotoFile[]) => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
}
```

### 8. RoomAnalysisPreview.tsx
**Responsabilidad**: Vista previa de resultados del análisis de IA.

**Funcionalidades**:
- Muestra datos generados desde fotos
- Permite editar antes de confirmar
- Validación de datos

### 9. MiniMap.tsx
**Responsabilidad**: Mapa mini de todas las habitaciones de la propiedad.

**Funcionalidades**:
- Visualización SVG de todas las habitaciones
- Navegación con teclado (flechas)
- Selección de habitación

### 10. CollapsiblePanel.tsx
**Responsabilidad**: Panel colapsable reutilizable.

**Funcionalidades**:
- Expandir/colapsar
- Icono y título personalizables
- Contenido personalizado

### 11. AccessibilityAnnouncer.tsx
**Responsabilidad**: Anuncios de accesibilidad para lectores de pantalla.

**Funcionalidades**:
- Anuncia cambios importantes en la UI
- Soporte para ARIA live regions

## Patrones de Diseño Utilizados

### 1. Container/Presentational
- `App.tsx` actúa como container (lógica de estado)
- Componentes hijos son presentacionales (reciben props)

### 2. Custom Hooks
- `useRoomData`: Abstrae la lógica de carga de datos de habitación

### 3. Service Layer
- `dataService`: Abstrae todas las operaciones de base de datos
- `visionService`: Abstrae la integración con Vision API
- `roomGeneratorService`: Lógica de generación de habitaciones

## Flujo de Datos entre Componentes

```
App.tsx (Estado Global)
    ↓
RoomViewer3D / FloorPlan2D (Visualización)
    ↓
onEquipmentUpdate / onEquipmentDrop (Callbacks)
    ↓
App.tsx → dataService → Supabase
```

## Mejores Prácticas

1. **Props Tipadas**: Todos los componentes usan interfaces TypeScript
2. **Separación de Responsabilidades**: Cada componente tiene una función clara
3. **Reutilización**: Componentes como `CollapsiblePanel` son reutilizables
4. **Accesibilidad**: Uso de ARIA labels y `AccessibilityAnnouncer`
5. **Performance**: Uso de `useRef` para objetos pesados (Three.js)

