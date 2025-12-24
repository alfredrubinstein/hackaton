# Casas/Propiedades (Homes)

Esta carpeta contiene archivos JSON con la información completa de propiedades (casas/edificios médicos) y sus habitaciones.

## Estructura de un archivo JSON

Cada archivo JSON debe seguir esta estructura:

```json
{
  "id": "identificador-unico",
  "name": "Nombre de la Propiedad",
  "view_box": "0 0 200 150",
  "created_at": "2024-12-24T00:00:00.000Z",
  "updated_at": "2024-12-24T00:00:00.000Z",
  "rooms": [
    {
      "id": "room-id-001",
      "property_id": "identificador-unico",
      "name": "Nombre de la Habitación",
      "svg_path": "M 10,10 L 70,10 L 70,50 L 10,50 Z",
      "vertices": [
        { "x": 10, "y": 10 },
        { "x": 70, "y": 10 },
        { "x": 70, "y": 50 },
        { "x": 10, "y": 50 }
      ],
      "wall_height": 3.0,
      "created_at": "2024-12-24T00:00:00.000Z",
      "updated_at": "2024-12-24T00:00:00.000Z",
      "installations": [
        {
          "id": "inst-id-001",
          "room_id": "room-id-001",
          "type": "door",
          "position": { "start": { "x": 35, "y": 50 }, "end": { "x": 45, "y": 50 } },
          "subtype": "sliding",
          "created_at": "2024-12-24T00:00:00.000Z"
        }
      ],
      "equipment": [
        {
          "id": "eq-id-001",
          "room_id": "room-id-001",
          "name": "Monitor Principal",
          "type": "monitor",
          "position": { "x": 20, "y": 0, "z": 15 },
          "rotation": { "x": 0, "y": 0, "z": 0 },
          "dimensions": { "width": 0.4, "height": 1.2, "depth": 0.4 },
          "created_at": "2024-12-24T00:00:00.000Z",
          "updated_at": "2024-12-24T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

## Cómo agregar una nueva casa

1. Crea un nuevo archivo JSON con un nombre descriptivo (ej: `hospital-central.json`)
2. Sigue la estructura mostrada arriba
3. Asegúrate de que todos los IDs sean únicos
4. El archivo se cargará automáticamente al inicializar la aplicación

## Notas

- Los cambios realizados en la aplicación se guardan en localStorage, no en estos archivos
- Estos archivos sirven como datos iniciales/base
- Para exportar datos actualizados, usa la función `exportData()` del servicio

