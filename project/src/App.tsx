import { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { MiniMap } from './components/MiniMap';
import { RoomViewer3D } from './components/RoomViewer3D';
import { FloorPlan2D } from './components/FloorPlan2D';
import { EquipmentPanel } from './components/EquipmentPanel';
import { EquipmentCatalog } from './components/EquipmentCatalog';
import { AccessibilityAnnouncer } from './components/AccessibilityAnnouncer';
import { useRoomData } from './hooks/useRoomData';
import { dataService } from './services/dataService';
import { initializeSampleData } from './utils/sampleData';
import type { Room, Property, MedicalEquipment } from './types';

function App() {
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [fadeTransition, setFadeTransition] = useState(false);
  const [draggingEquipment, setDraggingEquipment] = useState<any>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const { room, installations, equipment, loading, error, setEquipment } = useRoomData(selectedRoomId);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing sample data...');
        const propertyId = await initializeSampleData();
        console.log('Property created:', propertyId);

        const propertyData = await dataService.getProperty(propertyId);
        console.log('Property data:', propertyData);

        const roomsData = await dataService.getRoomsByProperty(propertyId);
        console.log('Rooms data:', roomsData);

        setProperty(propertyData);
        setRooms(roomsData);
        if (roomsData.length > 0) {
          setSelectedRoomId(roomsData[0].id);
        }
      } catch (err: any) {
        console.error('Error initializing app:', err);
        console.error('Error details:', err.message, err.details);
        setInitError(err.message || 'Error desconocido');
        setAnnouncement('Error al inicializar. Intenta recargar la página con Ctrl+Shift+R');
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  const handleRoomSelect = (roomId: string) => {
    if (roomId === selectedRoomId) return;

    setFadeTransition(true);
    setTimeout(() => {
      setSelectedRoomId(roomId);
      const selectedRoom = rooms.find(r => r.id === roomId);
      if (selectedRoom) {
        setAnnouncement(
          `Entrando en: ${selectedRoom.name} - Forma ${
            selectedRoom.vertices.length > 4 ? 'irregular' : 'rectangular'
          }`
        );
      }
      setFadeTransition(false);
    }, 300);
  };

  const handleAddEquipment = async (newEquipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const created = await dataService.createMedicalEquipment(newEquipment);
      setEquipment(prev => [...prev, created]);
      setAnnouncement(`Equipo agregado: ${created.name} en posición ${created.position.x.toFixed(1)}, ${created.position.z.toFixed(1)}`);
    } catch (err) {
      console.error('Error adding equipment:', err);
      setAnnouncement('Error al agregar equipo médico');
    }
  };

  const handleUpdateEquipment = async (id: string, updates: Partial<MedicalEquipment>) => {
    try {
      const updated = await dataService.updateMedicalEquipment(id, updates);
      setEquipment(prev => prev.map(eq => eq.id === id ? updated : eq));
      setAnnouncement(`Equipo actualizado: ${updated.name}`);
    } catch (err) {
      console.error('Error updating equipment:', err);
      setAnnouncement('Error al actualizar equipo médico');
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      await dataService.deleteMedicalEquipment(id);
      setEquipment(prev => prev.filter(eq => eq.id !== id));
      setAnnouncement('Equipo médico eliminado');
    } catch (err) {
      console.error('Error deleting equipment:', err);
      setAnnouncement('Error al eliminar equipo médico');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Inicializando Arquitecto de Sistemas Espaciales...</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl">
          <div className="text-red-600 text-6xl mb-4 text-center">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">
            Error de Inicialización
          </h1>
          <p className="text-slate-600 mb-4">
            Hubo un problema al conectar con la base de datos. Por favor, intenta lo siguiente:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 mb-6">
            <li>Recarga la página completamente (presiona Ctrl+Shift+R o Cmd+Shift+R)</li>
            <li>Limpia el caché del navegador</li>
            <li>Verifica que tienes conexión a internet</li>
          </ol>
          <div className="bg-slate-100 p-4 rounded-lg mb-4">
            <p className="text-sm text-slate-700 font-mono">{initError}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <AccessibilityAnnouncer message={announcement} />

      <header className="bg-white shadow-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-slate-700" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Arquitecto de Sistemas Espaciales
              </h1>
              <p className="text-sm text-slate-600">
                {property?.name || 'Sistema de Gestión de Espacios Médicos'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <MiniMap
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              onRoomSelect={handleRoomSelect}
              viewBox={property?.view_box}
            />

            <EquipmentCatalog
              onDragStart={setDraggingEquipment}
            />
          </div>

          <div className="lg:col-span-1 space-y-6">
            {room && (
              <EquipmentPanel
                room={room}
                equipment={equipment}
                onAddEquipment={handleAddEquipment}
                onUpdateEquipment={handleUpdateEquipment}
                onDeleteEquipment={handleDeleteEquipment}
              />
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-800">
                  Vista 3D: {room?.name || 'Seleccione una habitación'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {room && (
                    <>
                      {installations.length} instalaciones detectadas •{' '}
                      {equipment.length} equipos médicos
                    </>
                  )}
                </p>
              </div>

              <div
                className={`h-[600px] transition-opacity duration-300 ${
                  fadeTransition ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {loading && (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
                  </div>
                )}
                {error && (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-red-600">Error: {error}</p>
                  </div>
                )}
                {room && !loading && !error && (
                  <RoomViewer3D
                    room={room}
                    installations={installations}
                    equipment={equipment}
                    onEquipmentDrop={handleAddEquipment}
                  />
                )}
              </div>
            </div>

            {room && !loading && !error && (
              <FloorPlan2D
                room={room}
                equipment={equipment}
                installations={installations}
              />
            )}

            <div className="mt-4 bg-white rounded-lg shadow-md p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Guía de Uso
              </h3>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-1">Vista 3D:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <span className="font-medium">Click Izquierdo + Arrastrar:</span> Rotar cámara</li>
                  <li>• <span className="font-medium">Rueda del Mouse:</span> Zoom in/out</li>
                  <li>• <span className="font-medium">Click Derecho + Arrastrar:</span> Mover vista panorámica</li>
                  <li>• <span className="font-medium">Flechas o W/A/S/D:</span> Navegar por la habitación</li>
                  <li>• <span className="font-medium">Botones de Navegación:</span> Esquina inferior derecha</li>
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-1">Plano 2D:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• <span className="font-medium">Botones +/-:</span> Zoom in/out</li>
                  <li>• <span className="font-medium">Botón ⟲:</span> Restablecer vista</li>
                  <li>• <span className="font-medium">Flechas:</span> Pan (esquina inferior derecha)</li>
                  <li>• <span className="font-medium">Cuadrícula:</span> 0.5m × 0.5m</li>
                </ul>
              </div>

              <div className="p-2 bg-slate-50 rounded text-xs text-slate-600">
                <strong>Características:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• El grid está delimitado por las paredes de la habitación</li>
                  <li>• La navegación 3D está limitada al área del grid</li>
                  <li>• Los equipos se colocan automáticamente en la cuadrícula al arrastrarlos</li>
                  <li>• La cámara 3D está restringida entre el piso y el techo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-8 py-4 text-center text-sm text-slate-600">
        <p>Sistema desarrollado con accesibilidad y navegación compleja para gestión de espacios médicos</p>
      </footer>
    </div>
  );
}

export default App;
