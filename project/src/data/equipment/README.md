# Equipamiento Médico (Equipment)

Esta carpeta contiene archivos JSON con plantillas y catálogos de equipamiento médico.

## Archivos

### equipment-templates.json

Contiene las plantillas de equipamiento médico disponibles para agregar a las habitaciones.

Estructura de cada plantilla:

```json
{
  "id": "bed-hospital",
  "name": "Cama Hospitalaria",
  "type": "bed",
  "category": "Mobiliario",
  "defaultDimensions": {
    "width": 2.1,
    "height": 0.9,
    "depth": 1.0
  },
  "icon": "🛏️",
  "color": "#3b82f6"
}
```

## Cómo agregar nuevo equipamiento

1. Edita `equipment-templates.json`
2. Agrega un nuevo objeto con la estructura mostrada arriba
3. Asegúrate de que el `id` sea único
4. Las dimensiones están en metros

## Categorías disponibles

- Mobiliario
- Monitoreo
- Soporte Vital
- Administración
- Diagnóstico
- Emergencia
- Suministros
- Tratamiento
- Movilidad

## Notas

- El catálogo se carga desde este archivo JSON
- Los cambios se reflejan inmediatamente en la aplicación
- Las dimensiones por defecto se usan cuando se agrega un nuevo equipo

