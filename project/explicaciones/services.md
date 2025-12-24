# Documentación de Servicios

## Visión General

Los servicios encapsulan la lógica de negocio y las integraciones con APIs externas. Siguen el principio de responsabilidad única y proporcionan una capa de abstracción sobre las implementaciones concretas.

## Servicios Principales

### 1. dataService.ts
**Responsabilidad**: Abstracción de todas las operaciones de base de datos con Supabase.

**Métodos**:

#### Properties
- `getProperties()`: Obtiene todas las propiedades
- `getProperty(id)`: Obtiene una propiedad por ID
- `createProperty(property)`: Crea una nueva propiedad

#### Rooms
- `getRoomsByProperty(propertyId)`: Obtiene habitaciones de una propiedad
- `getRoom(id)`: Obtiene una habitación por ID
- `createRoom(room)`: Crea una nueva habitación

#### Installations
- `getInstallationsByRoom(roomId)`: Obtiene instalaciones de una habitación
- `createInstallation(installation)`: Crea una nueva instalación

#### Medical Equipment
- `getMedicalEquipmentByRoom(roomId)`: Obtiene equipamiento de una habitación
- `createMedicalEquipment(equipment)`: Crea nuevo equipamiento
- `updateMedicalEquipment(id, updates)`: Actualiza equipamiento existente
- `deleteMedicalEquipment(id)`: Elimina equipamiento

**Patrón**: Singleton exportado como objeto constante.

**Manejo de Errores**: Todas las funciones lanzan errores que deben ser capturados por el llamador.

### 2. visionService.ts
**Responsabilidad**: Integración con Google Cloud Vision API para análisis de imágenes.

**Clase**: `VisionService` (Singleton)

**Métodos Principales**:

#### `analyzeImage(imageData: string)`
Analiza una imagen individual usando Vision API.

**Proceso**:
1. Convierte base64 a formato aceptado por Vision API
2. Envía request con features: LABEL_DETECTION, OBJECT_LOCALIZATION, TEXT_DETECTION
3. Procesa respuesta y extrae información relevante
4. Retorna `VisionAnalysisResult`

#### `analyzeMultipleImages(images: PhotoAnalysisRequest[])`
Analiza múltiples imágenes y combina resultados.

**Proceso**:
1. Analiza cada imagen en paralelo
2. Combina instalaciones detectadas
3. Elimina duplicados
4. Selecciona la geometría más confiable

**Métodos Privados**:
- `processVisionResponse()`: Procesa respuesta de API
- `detectInstallations()`: Detecta puertas, ventanas, puntos de energía
- `estimateRoomGeometry()`: Estima dimensiones de habitación
- `normalizeBoundingBox()`: Normaliza coordenadas de bounding boxes
- `combineResults()`: Combina resultados de múltiples fotos
- `deduplicateInstallations()`: Elimina instalaciones duplicadas

**Configuración**:
Requiere `VITE_GOOGLE_VISION_API_KEY` en variables de entorno.

### 3. roomGeneratorService.ts
**Responsabilidad**: Genera datos de habitación desde resultados de análisis de Vision API.

**Clase**: `RoomGeneratorService`

**Método Principal**:

#### `generateRoomFromAnalysis(analysis, roomName, referenceMeasurement?)`
Convierte `VisionAnalysisResult` a `GeneratedRoomData`.

**Proceso**:
1. Normaliza vértices de la habitación
2. Genera SVG path desde vértices
3. Calcula altura de pared (estimada o estándar)
4. Convierte instalaciones detectadas al formato correcto
5. Ajusta posiciones según referencia de medida (opcional)

**Métodos Privados**:
- `normalizeVertices()`: Valida y normaliza vértices
- `ensureCounterClockwise()`: Asegura orden antihorario
- `verticesToSvgPath()`: Convierte vértices a path SVG
- `convertInstallations()`: Convierte instalaciones detectadas

**Características**:
- Maneja casos edge (pocos vértices, formas inválidas)
- Calcula medidas basándose en objetos de referencia
- Genera formas por defecto si el análisis falla

## Flujo de Integración

### Análisis de Fotos con IA

```
PhotoUploader
    ↓
visionService.analyzeMultipleImages()
    ↓
Google Cloud Vision API
    ↓
VisionAnalysisResult
    ↓
roomGeneratorService.generateRoomFromAnalysis()
    ↓
GeneratedRoomData
    ↓
App.tsx → dataService.createRoom()
    ↓
Supabase
```

### Operaciones CRUD

```
Componente (RoomViewer3D, EquipmentPanel, etc.)
    ↓
Callback (onEquipmentUpdate, onAddEquipment, etc.)
    ↓
App.tsx
    ↓
dataService (create, update, delete, get)
    ↓
Supabase
```

## Manejo de Errores

Todos los servicios lanzan errores que deben ser capturados:

```typescript
try {
  const result = await dataService.createRoom(roomData);
} catch (error) {
  console.error('Error:', error);
  // Manejar error en UI
}
```

## Configuración Requerida

### Variables de Entorno

```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon

# Google Cloud Vision API
VITE_GOOGLE_VISION_API_KEY=tu-api-key
```

## Consideraciones de Seguridad

1. **Vision API Key**: Actualmente expuesta en cliente. En producción, mover a backend.
2. **Supabase RLS**: Las políticas actuales son permisivas. Ajustar para producción.
3. **Validación**: Los servicios no validan datos de entrada. Validar en componentes o crear capa de validación.

## Extensibilidad

Para agregar nuevos servicios:

1. Crear archivo en `src/services/`
2. Exportar como singleton o clase
3. Seguir el patrón de manejo de errores existente
4. Documentar en este archivo

