# Documentación de Hooks

## Visión General

Los custom hooks encapsulan lógica reutilizable y estado relacionado. Siguen las convenciones de React Hooks y proporcionan una API limpia para los componentes.

## Hooks Disponibles

### 1. useRoomData.ts
**Responsabilidad**: Gestiona la carga y estado de datos de una habitación.

**API**:
```typescript
const { room, installations, equipment, loading, error, setEquipment } = useRoomData(roomId);
```

**Parámetros**:
- `roomId: string | null`: ID de la habitación a cargar

**Retorna**:
- `room: Room | null`: Datos de la habitación
- `installations: Installation[]`: Instalaciones de la habitación
- `equipment: MedicalEquipment[]`: Equipamiento de la habitación
- `loading: boolean`: Estado de carga
- `error: string | null`: Error si ocurre
- `setEquipment: (equipment: MedicalEquipment[]) => void`: Setter para actualizar equipamiento localmente

**Funcionamiento**:
1. Se ejecuta cuando `roomId` cambia
2. Carga datos en paralelo: habitación, instalaciones, equipamiento
3. Actualiza estado cuando los datos están listos
4. Maneja errores y estados de carga

**Uso**:
```typescript
const { room, installations, equipment, loading } = useRoomData(selectedRoomId);

if (loading) return <Loader />;
if (!room) return <NoRoomSelected />;

return <RoomViewer3D room={room} installations={installations} equipment={equipment} />;
```

**Optimizaciones**:
- Carga paralela con `Promise.all`
- Solo se ejecuta cuando `roomId` cambia (dependencia del useEffect)

## Patrones de Hooks

### 1. Data Fetching Hook
`useRoomData` sigue el patrón de data fetching:
- Estado de loading
- Manejo de errores
- Actualización cuando cambian dependencias

### 2. Estado Derivado
El hook calcula estado derivado (equipamiento, instalaciones) desde el ID de habitación.

## Extensibilidad

Para crear nuevos hooks:

1. Crear archivo en `src/hooks/`
2. Nombrar con prefijo `use`
3. Seguir convenciones de React Hooks
4. Documentar parámetros y retorno
5. Manejar estados de loading y error

**Ejemplo**:
```typescript
export function usePropertyData(propertyId: string | null) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await dataService.getProperty(propertyId);
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading property');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [propertyId]);

  return { property, loading, error };
}
```

