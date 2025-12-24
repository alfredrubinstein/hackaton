# Documentación del Proyecto - Care In Every Home

Bienvenido a la documentación completa del proyecto **Care In Every Home**. Esta carpeta contiene toda la información necesaria para entender, mantener y extender el sistema.

## Índice de Documentación

### 📘 [Documentación Principal](./principal.md)
Arquitectura del sistema, modelo de base de datos, flujos de datos y guía de uso de la base de datos.

**Contenido**:
- Arquitectura y principios SOLID
- Stack tecnológico
- Modelo de datos completo
- Uso de Supabase
- Migraciones y seguridad

### 🧩 [Componentes](./components.md)
Documentación detallada de todos los componentes React del proyecto.

**Contenido**:
- Descripción de cada componente
- Props y responsabilidades
- Patrones de diseño utilizados
- Flujo de datos entre componentes

### 🔧 [Servicios](./services.md)
Documentación de la capa de servicios y lógica de negocio.

**Contenido**:
- `dataService`: Operaciones de base de datos
- `visionService`: Integración con Google Cloud Vision API
- `roomGeneratorService`: Generación de habitaciones desde IA
- Flujos de integración

### 🎣 [Hooks](./hooks.md)
Documentación de custom React hooks.

**Contenido**:
- `useRoomData`: Hook para carga de datos de habitación
- Patrones de hooks
- Guía para crear nuevos hooks

### 🛠️ [Utilidades](./utils.md)
Funciones helper y utilidades reutilizables.

**Contenido**:
- Funciones de geometría
- Validación espacial
- Algoritmos implementados
- Inicialización de datos

### 📊 [Datos](./data.md)
Documentación de datos estáticos y catálogos.

**Contenido**:
- Catálogo de equipamiento médico
- Datos de ejemplo
- Formatos de datos
- Validación

### 🤖 [Sistema RC](./rc-system.md)
Documentación del sistema de control de coche RC.

**Contenido**:
- Arquitectura del sistema RC
- Componentes Arduino y JavaScript
- Odometría y generación de mapas
- Hardware requerido

### 👥 [División del Trabajo](./socios.md)
Guía para trabajar en equipo con 6 programadores.

**Contenido**:
- Roles y responsabilidades de cada programador
- Tareas específicas por desarrollador
- Metas por pasos para cada rol
- Metodología de trabajo
- Roadmap del proyecto

## Guía Rápida de Inicio

### Para Nuevos Desarrolladores

1. **Lee primero**: [Documentación Principal](./principal.md) para entender la arquitectura
2. **Revisa**: [Componentes](./components.md) para entender la estructura UI
3. **Consulta**: [Servicios](./services.md) para entender la lógica de negocio
4. **Si trabajas en equipo**: Lee [División del Trabajo](./socios.md)

### Para Mantenimiento

- **Bug en componente**: Consulta [Componentes](./components.md)
- **Problema con BD**: Consulta [Documentación Principal](./principal.md) sección de BD
- **Nueva feature**: Consulta [División del Trabajo](./socios.md) para asignación

### Para Extensión

- **Nuevo componente**: Sigue patrones en [Componentes](./components.md)
- **Nuevo servicio**: Sigue estructura en [Servicios](./services.md)
- **Nuevo hook**: Sigue guía en [Hooks](./hooks.md)

## Convenciones del Proyecto

- **TypeScript**: Todos los archivos deben tener tipos completos
- **SOLID**: Principios SOLID aplicados en toda la arquitectura
- **Documentación**: Actualizar documentación al agregar features
- **Commits**: Mensajes descriptivos en español

## Estructura del Proyecto

```
project/
├── src/
│   ├── components/     → Ver [Componentes](./components.md)
│   ├── services/      → Ver [Servicios](./services.md)
│   ├── hooks/         → Ver [Hooks](./hooks.md)
│   ├── utils/         → Ver [Utilidades](./utils.md)
│   └── data/          → Ver [Datos](./data.md)
├── rc/                → Ver [Sistema RC](./rc-system.md)
├── supabase/          → Ver [Documentación Principal](./principal.md)
└── explicaciones/     → Esta carpeta
```

## Contribuir

Al agregar nuevas funcionalidades:

1. Actualiza la documentación relevante en esta carpeta
2. Sigue las convenciones establecidas
3. Documenta cambios importantes en commits
4. Consulta [División del Trabajo](./socios.md) para coordinación

## Contacto y Soporte

Para preguntas sobre la documentación o el proyecto, consulta:
- [División del Trabajo](./socios.md) para coordinación de equipo
- Issues en el repositorio para bugs o features

---

**Última actualización**: Diciembre 2024

