# Migración de Supabase a Archivos JSON

## Resumen

El proyecto ha sido migrado de Supabase (base de datos en la nube) a un sistema basado en archivos JSON locales y localStorage para persistencia.

## Cambios Realizados

### 1. Nuevo Servicio de Datos

- **Archivo**: `src/services/jsonDataService.ts`
- **Función**: Reemplaza todas las operaciones de Supabase
- **Almacenamiento**: 
  - Datos iniciales desde archivos JSON en `src/data/homes/`
  - Cambios se guardan en `localStorage` del navegador

### 2. Estructura de Carpetas

```
src/data/
├── homes/                    # Casas/Propiedades completas
│   ├── centro-medico-san-rafael.json
│   └── README.md
├── equipment/                # Catálogo de equipamiento
│   ├── equipment-templates.json
│   └── README.md
├── medicalEquipmentCatalog.ts  # Wrapper TypeScript
└── sampleHouse.json          # (Legacy, ya no se usa)
```

### 3. Archivos Modificados

- `src/services/dataService.ts`: Ahora redirige a `jsonDataService`
- `src/services/jsonDataService.ts`: Nuevo servicio basado en JSON
- `src/utils/sampleData.ts`: Simplificado, ya no crea datos
- `src/data/medicalEquipmentCatalog.ts`: Ahora lee desde JSON

### 4. Funcionamiento

1. **Inicialización**: Al cargar la aplicación, `jsonDataService` lee el archivo JSON de la casa desde `src/data/homes/`
2. **Persistencia**: Todos los cambios (crear, actualizar, eliminar) se guardan en `localStorage`
3. **Lectura**: Los datos se leen desde `localStorage`, con fallback a los JSONs estáticos

## Ventajas

- ✅ No requiere conexión a internet
- ✅ No necesita configuración de Supabase
- ✅ Datos portables (se pueden exportar/importar)
- ✅ Desarrollo más rápido sin dependencias externas

## Desventajas

- ⚠️ Los datos solo existen en el navegador del usuario
- ⚠️ No hay sincronización entre dispositivos
- ⚠️ Limitado por el tamaño de localStorage (~5-10MB)

## Cómo Agregar una Nueva Casa

1. Crea un archivo JSON en `src/data/homes/` (ej: `mi-hospital.json`)
2. Sigue la estructura del archivo `centro-medico-san-rafael.json`
3. Importa el archivo en `jsonDataService.ts` si quieres que se cargue automáticamente
4. O usa la función `createProperty()` para crearla desde la UI

## Exportar/Importar Datos

El servicio incluye funciones para exportar datos:

```typescript
import { jsonDataService } from './services/jsonDataService';

// Exportar todos los datos
const jsonData = await jsonDataService.exportData();
console.log(jsonData); // JSON string con todos los datos

// Resetear a datos iniciales
await jsonDataService.resetData();
```

## Eliminación de Dependencias de Supabase

Las siguientes dependencias ya no son necesarias (pero se mantienen para compatibilidad):

- `@supabase/supabase-js` - Puede eliminarse del `package.json` si no se usa en otros lugares
- Variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` - Ya no son necesarias
- `src/lib/supabase.ts` - Ya no se usa directamente

## Notas Importantes

- Los datos en `localStorage` son específicos del navegador y dominio
- Si el usuario limpia el cache/localStorage, los datos se perderán (excepto los JSONs base)
- Para producción, considera implementar exportación/importación de datos
- Los JSONs en `src/data/homes/` son solo datos iniciales/base

