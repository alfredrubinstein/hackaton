# División del Trabajo - Equipo de 6 Programadores

## Visión General del Proyecto

**Care In Every Home** es un sistema de gestión y visualización 3D de espacios médicos que permite diseñar habitaciones, colocar equipamiento médico, y generar reportes de seguridad. El proyecto utiliza React, TypeScript, Three.js, y Supabase.

## Arquitectura del Equipo

### Roles y Responsabilidades

#### Programador 1: Frontend Core & Estado Global
**Responsabilidades**:
- Mantener y mejorar `App.tsx` (componente raíz)
- Gestión del estado global de la aplicación
- Coordinación entre componentes
- Integración de nuevos features en el flujo principal

**Tareas Específicas**:
1. Refactorizar `App.tsx` si crece demasiado (dividir en sub-componentes)
2. Implementar Context API si el estado global se vuelve complejo
3. Optimizar re-renders innecesarios
4. Gestionar modales y paneles colapsables
5. Integrar nuevas funcionalidades que requieran estado global

**Archivos Principales**:
- `src/App.tsx`

**Habilidades Requeridas**:
- React avanzado (hooks, estado, efectos)
- TypeScript
- Gestión de estado complejo

---

#### Programador 2: Visualización 3D (Three.js)
**Responsabilidades**:
- Mantener y mejorar `RoomViewer3D.tsx`
- Sistema de ejes de transformación
- Optimización de renderizado 3D
- Mejoras en la experiencia de usuario 3D

**Tareas Específicas**:
1. Optimizar rendimiento del renderizado 3D
2. Mejorar el sistema de arrastre por ejes (hacerlo más suave y preciso)
3. Agregar más opciones de visualización (wireframe, materiales, iluminación)
4. Implementar selección múltiple de objetos
5. Agregar rotación de objetos (además de traslación)
6. Mejorar restricciones de cámara y controles

**Archivos Principales**:
- `src/components/RoomViewer3D.tsx`

**Habilidades Requeridas**:
- Three.js avanzado
- Matemáticas 3D (vectores, matrices, proyecciones)
- Optimización de renderizado WebGL

**Metas por Pasos**:
1. **Paso 1**: Optimizar renderizado (reducir draw calls, usar instancing donde sea posible)
2. **Paso 2**: Mejorar precisión del arrastre por ejes (reducir jitter, mejorar sensibilidad)
3. **Paso 3**: Agregar rotación de objetos con ejes de rotación
4. **Paso 4**: Implementar selección múltiple y operaciones en grupo
5. **Paso 5**: Agregar efectos visuales (sombras mejoradas, iluminación dinámica)

---

#### Programador 3: Visualización 2D & UI Components
**Responsabilidades**:
- Mantener `FloorPlan2D.tsx` y componentes UI
- Mejorar componentes reutilizables
- Accesibilidad y UX
- Diseño responsive

**Tareas Específicas**:
1. Mejorar `FloorPlan2D.tsx` (zoom, pan, mejor grid)
2. Refactorizar componentes UI para mejor reutilización
3. Implementar sistema de temas
4. Mejorar accesibilidad (ARIA, keyboard navigation)
5. Hacer la UI responsive para diferentes tamaños de pantalla
6. Agregar animaciones y transiciones suaves

**Archivos Principales**:
- `src/components/FloorPlan2D.tsx`
- `src/components/CollapsiblePanel.tsx`
- `src/components/AccessibilityAnnouncer.tsx`
- `src/components/MiniMap.tsx`

**Habilidades Requeridas**:
- React y TypeScript
- SVG avanzado
- CSS/Tailwind CSS
- Accesibilidad web (WCAG)

**Metas por Pasos**:
1. **Paso 1**: Agregar zoom y pan a FloorPlan2D
2. **Paso 2**: Mejorar sistema de grid y snap
3. **Paso 3**: Implementar sistema de temas (claro/oscuro)
4. **Paso 4**: Mejorar accesibilidad completa (teclado, screen readers)
5. **Paso 5**: Hacer UI completamente responsive

---

#### Programador 4: Backend & Base de Datos
**Responsabilidades**:
- Mantener `dataService.ts` y operaciones de BD
- Optimizar queries y migraciones
- Implementar autenticación y autorización
- Mejorar políticas RLS

**Tareas Específicas**:
1. Optimizar queries de Supabase (agregar índices donde sea necesario)
2. Implementar sistema de autenticación de usuarios
3. Mejorar políticas RLS (ownership-based, roles)
4. Agregar validación de datos en el backend
5. Implementar soft deletes para datos importantes
6. Agregar logging y monitoreo
7. Crear funciones stored procedures para operaciones complejas

**Archivos Principales**:
- `src/services/dataService.ts`
- `supabase/migrations/`

**Habilidades Requeridas**:
- PostgreSQL/Supabase
- SQL avanzado
- Autenticación y autorización
- Optimización de bases de datos

**Metas por Pasos**:
1. **Paso 1**: Implementar autenticación de usuarios (Supabase Auth)
2. **Paso 2**: Crear políticas RLS basadas en ownership
3. **Paso 3**: Agregar validación de datos (triggers, constraints)
4. **Paso 4**: Optimizar queries (análisis de performance, índices)
5. **Paso 5**: Implementar sistema de roles y permisos

---

#### Programador 5: IA & Servicios Externos
**Responsabilidades**:
- Mantener `visionService.ts` y `roomGeneratorService.ts`
- Mejorar precisión del análisis de IA
- Integrar nuevos servicios de IA
- Optimizar procesamiento de imágenes

**Tareas Específicas**:
1. Mejorar precisión de detección de Vision API
2. Implementar backend para proteger API keys
3. Agregar más fuentes de datos (otros modelos de IA, sensores)
4. Mejorar estimación de medidas (usar objetos de referencia mejor)
5. Implementar procesamiento de imágenes en el cliente (compresión, optimización)
6. Agregar validación y corrección manual de resultados de IA

**Archivos Principales**:
- `src/services/visionService.ts`
- `src/services/roomGeneratorService.ts`
- `src/components/PhotoUploader.tsx`
- `src/components/RoomAnalysisPreview.tsx`

**Habilidades Requeridas**:
- APIs de IA (Google Cloud Vision, posiblemente otras)
- Procesamiento de imágenes
- Backend (Node.js/Python para proteger API keys)
- Algoritmos de computer vision

**Metas por Pasos**:
1. **Paso 1**: Crear backend proxy para Vision API (proteger API key)
2. **Paso 2**: Mejorar algoritmos de estimación de medidas
3. **Paso 3**: Agregar validación y corrección manual de resultados
4. **Paso 4**: Implementar procesamiento de múltiples fotos con mejor fusión
5. **Paso 5**: Integrar modelos de IA adicionales (detección de profundidad, segmentación)

---

#### Programador 6: Sistema RC & Utilidades
**Responsabilidades**:
- Mantener sistema RC (Arduino + JavaScript)
- Mejorar utilidades y helpers
- Optimizar algoritmos de geometría
- Documentación técnica

**Tareas Específicas**:
1. Mejorar precisión de odometría del coche RC
2. Implementar corrección de deriva
3. Mejorar algoritmos de geometría (validación, cálculos)
4. Agregar más utilidades reutilizables
5. Mejorar integración del sistema RC con el visor 3D
6. Documentar APIs y funciones

**Archivos Principales**:
- `rc/arduino/rc_car.ino`
- `rc/js/rcCarController.js`
- `rc/js/odometryAlgorithm.js`
- `rc/js/mapGenerator.js`
- `src/utils/geometry.ts`
- `src/utils/sampleData.ts`

**Habilidades Requeridas**:
- Arduino/C++
- JavaScript/TypeScript
- Algoritmos de odometría y SLAM
- Matemáticas (geometría, trigonometría)

**Metas por Pasos**:
1. **Paso 1**: Mejorar algoritmo de odometría (reducir error acumulado)
2. **Paso 2**: Implementar corrección de deriva usando landmarks
3. **Paso 3**: Optimizar algoritmos de geometría (validación más rápida)
4. **Paso 4**: Agregar más utilidades matemáticas (interpolación, suavizado)
5. **Paso 5**: Implementar SLAM básico para mejor mapeo

---

## Metodología de Trabajo

### Flujo de Desarrollo

1. **Planning**: Reunión semanal para planificar sprints
2. **Desarrollo**: Trabajo en ramas feature separadas
3. **Code Review**: Revisión cruzada entre programadores
4. **Testing**: Tests unitarios y de integración
5. **Deployment**: Deploy incremental a staging, luego producción

### Convenciones de Código

- **TypeScript estricto**: Todos los archivos deben tener tipos completos
- **ESLint**: Seguir reglas del proyecto
- **Commits**: Mensajes descriptivos en español
- **Branches**: `feature/nombre-feature`, `fix/nombre-fix`
- **PRs**: Requieren aprobación de al menos 1 otro programador

### Comunicación

- **Daily Standup**: 15 minutos diarios (virtual o presencial)
- **Slack/Discord**: Para comunicación asíncrona
- **Documentación**: Actualizar documentación al agregar features

## Roadmap General del Proyecto

### Fase 1: Estabilización (Semanas 1-2)
- Todos: Corregir bugs existentes
- Todos: Mejorar tests
- Todos: Optimizar rendimiento básico

### Fase 2: Mejoras Core (Semanas 3-4)
- P2: Optimizar renderizado 3D
- P3: Mejorar UI/UX
- P4: Implementar autenticación
- P5: Backend para Vision API
- P6: Mejorar odometría RC

### Fase 3: Features Nuevas (Semanas 5-6)
- P2: Rotación de objetos, selección múltiple
- P3: Temas, mejor accesibilidad
- P4: Roles y permisos
- P5: Mejor precisión de IA
- P6: SLAM básico

### Fase 4: Optimización y Polish (Semanas 7-8)
- Todos: Optimización final
- Todos: Tests completos
- Todos: Documentación final
- Preparación para producción

## Herramientas de Colaboración

- **Git**: Control de versiones
- **GitHub/GitLab**: Repositorio y PRs
- **Supabase**: Base de datos compartida
- **Figma**: Diseño UI (si aplica)
- **Notion/Confluence**: Documentación colaborativa

## Métricas de Éxito

- **Cobertura de tests**: >80%
- **Performance**: <100ms para operaciones críticas
- **Accesibilidad**: Score WCAG AA
- **Documentación**: Todos los componentes y funciones documentados
- **Bugs**: <5 bugs críticos en producción

