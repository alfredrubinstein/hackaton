import { useEffect, useState } from 'react';
import { HeartHandshake, Loader2, Package, List, HelpCircle, Menu, MapPin, FileText, Download } from 'lucide-react';
import { RoomViewer3D } from './components/RoomViewer3D';
import { FloorPlan2D } from './components/FloorPlan2D';
import { EquipmentPanel } from './components/EquipmentPanel';
import { PositionPanel } from './components/PositionPanel';
import { EquipmentCatalog } from './components/EquipmentCatalog';
import { CollapsiblePanel } from './components/CollapsiblePanel';
import { AccessibilityAnnouncer } from './components/AccessibilityAnnouncer';
import { useRoomData } from './hooks/useRoomData';
import { dataService } from './services/dataService';
import { initializeSampleData } from './utils/sampleData';
import type { Room, Property, MedicalEquipment, Position3D, Installation } from './types';

function App() {
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [draggingEquipment, setDraggingEquipment] = useState<any>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

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

  const handleUpdateEquipmentPosition = async (id: string, position: Position3D) => {
    await handleUpdateEquipment(id, { position });
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

  const generateSecurityReport = (room: Room, equipment: MedicalEquipment[], installations: Installation[]): string => {
    const lines: string[] = [];
    
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('           דו״ח בטיחות ועצות - Care in Every Home');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`תאריך: ${new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    lines.push(`חדר: ${room.name}`);
    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('1. מידע כללי על החדר');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push(`   גובה קירות: ${room.wall_height} מטרים`);
    lines.push(`   מספר קירות: ${room.vertices.length}`);
    lines.push(`   צורה: ${room.vertices.length > 4 ? 'לא רגילה' : 'מלבנית'}`);
    lines.push('');
    
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('2. ציוד רפואי בחדר');
    lines.push('═══════════════════════════════════════════════════════════');
    if (equipment.length === 0) {
      lines.push('   אין ציוד רפואי בחדר זה.');
    } else {
      equipment.forEach((eq, index) => {
        lines.push(`   ${index + 1}. ${eq.name}`);
        lines.push(`      סוג: ${eq.type}`);
        lines.push(`      מיקום: X=${eq.position.x.toFixed(2)}m, Y=${eq.position.y.toFixed(2)}m, Z=${eq.position.z.toFixed(2)}m`);
        lines.push(`      מידות: ${eq.dimensions.width}m × ${eq.dimensions.depth}m × ${eq.dimensions.height}m`);
        lines.push('');
      });
    }
    lines.push('');
    
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('3. התקנות בחדר');
    lines.push('═══════════════════════════════════════════════════════════');
    const doors = installations.filter(inst => inst.type === 'door');
    const windows = installations.filter(inst => inst.type === 'window');
    const powerPoints = installations.filter(inst => inst.type === 'power_point');
    
    lines.push(`   דלתות: ${doors.length}`);
    lines.push(`   חלונות: ${windows.length}`);
    lines.push(`   נקודות חשמל: ${powerPoints.length}`);
    lines.push('');
    
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('4. עצות בטיחות');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('   • ודא שכל הציוד הרפואי ממוקם במרחק בטוח מקירות ומפתחות');
    lines.push('   • שמור על מסדרונות נקיים מחפצים כדי לאפשר גישה חופשית');
    lines.push('   • ודא שיש גישה קלה לכל נקודות החשמל');
    lines.push('   • בדוק שהציוד לא חוסם דלתות או חלונות');
    lines.push('   • שמור על מרחק מינימלי של 0.5 מטר בין ציוד לקירות');
    lines.push('   • ודא שהציוד כבד ממוקם על משטחים יציבים');
    lines.push('   • בדוק תקופתית את תקינות הציוד הרפואי');
    lines.push('   • שמור על תאורה מספקת בכל אזורי החדר');
    lines.push('');
    
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('5. המלצות תכנון');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('   • מיקום ציוד קריטי קרוב למיטות החולים');
    lines.push('   • שמירה על אזור עבודה נוח לצוות הרפואי');
    lines.push('   • תכנון מסדרונות רחבים מספיק להעברת ציוד');
    lines.push('   • מיקום נקודות חשמל נגישות לכל הציוד');
    lines.push('   • תכנון אזורי אחסון נפרדים לציוד');
    lines.push('');
    
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('סוף הדו״ח');
    lines.push('═══════════════════════════════════════════════════════════');
    
    return lines.join('\n');
  };

  const handleExportSecurityReport = () => {
    if (!room || !equipment || !installations) return;

    // Crear contenido del informe
    const reportContent = generateSecurityReport(room, equipment, installations);
    
    // Crear y descargar el archivo
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `דו״ח_בטיחות_${room.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setAnnouncement('דו״ח בטיחות exportado exitosamente');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-slate-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Inicializando Care in Every Home...</p>
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
    <div className="h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col overflow-hidden">
      <AccessibilityAnnouncer message={announcement} />

      {/* Header compacto */}
      <header className="bg-white shadow-md border-b border-slate-200 flex-shrink-0">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HeartHandshake className="w-6 h-6 text-emerald-600" />
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                Care in Every Home
              </h1>
              <p className="text-xs text-slate-600">
                {property?.name || 'Sistema de Gestión de Espacios Médicos'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle panel izquierdo"
            >
              <Menu className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle panel derecho"
            >
              <List className="w-5 h-5 text-slate-700" />
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle ayuda"
            >
              <HelpCircle className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex gap-2 p-2 overflow-hidden">
        {/* Panel izquierdo colapsable */}
        {showLeftPanel && (
          <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-hidden">
            <CollapsiblePanel
              title="Catálogo de Equipos"
              icon={<Package className="w-4 h-4 text-slate-700" />}
              defaultExpanded={true}
              className="flex-1 flex flex-col min-h-0"
            >
              <EquipmentCatalog
                onDragStart={setDraggingEquipment}
              />
            </CollapsiblePanel>
          </div>
        )}

        {/* Vista principal */}
        <div className="flex-1 flex flex-col gap-2 overflow-hidden min-w-0">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 flex flex-col">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  {viewMode === '3d' ? 'Vista 3D' : 'Vista 2D'}: {room?.name || 'Seleccione una habitación'}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {room && (
                    <>
                      {installations.length} instalaciones • {equipment.length} equipos
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setViewMode(viewMode === '3d' ? '2d' : '3d')}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                aria-label={`Cambiar a vista ${viewMode === '3d' ? '2D' : '3D'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {viewMode === '3d' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                  )}
                </svg>
                {viewMode === '3d' ? '2D' : '3D'}
              </button>
            </div>

            <div className="flex-1 min-h-0">
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
                <>
                  {viewMode === '3d' ? (
                    <RoomViewer3D
                      room={room}
                      installations={installations}
                      equipment={equipment}
                      onEquipmentDrop={handleAddEquipment}
                      onEquipmentUpdate={handleUpdateEquipmentPosition}
                      selectedEquipmentId={selectedEquipmentId}
                      onEquipmentSelect={setSelectedEquipmentId}
                    />
                  ) : (
                    <div className="h-full">
                      <FloorPlan2D
                        room={room}
                        equipment={equipment}
                        installations={installations}
                        onEquipmentDrop={handleAddEquipment}
                        onEquipmentUpdate={handleUpdateEquipmentPosition}
                        selectedEquipmentId={selectedEquipmentId}
                        onEquipmentSelect={setSelectedEquipmentId}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Guía de uso colapsable */}
          {showHelp && (
            <CollapsiblePanel
              title="Guía de Uso"
              defaultExpanded={true}
              icon={<HelpCircle className="w-4 h-4 text-slate-700" />}
            >
              <div className="p-3 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-1">Vista 3D:</h4>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    <li>• <span className="font-medium">Click Izquierdo + Arrastrar:</span> Rotar cámara</li>
                    <li>• <span className="font-medium">Rueda del Mouse:</span> Zoom in/out</li>
                    <li>• <span className="font-medium">Click Derecho + Arrastrar:</span> Mover vista panorámica</li>
                    <li>• <span className="font-medium">Flechas o W/A/S/D:</span> Navegar</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-1">Vista 2D:</h4>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    <li>• <span className="font-medium">Botones +/-:</span> Zoom in/out</li>
                    <li>• <span className="font-medium">Botón ⟲:</span> Restablecer vista</li>
                    <li>• <span className="font-medium">Flechas:</span> Pan</li>
                    <li>• <span className="font-medium">Cuadrícula:</span> 0.5m × 0.5m</li>
                  </ul>
                </div>

                <div className="p-2 bg-slate-50 rounded text-xs text-slate-600">
                  <strong>Características:</strong>
                  <ul className="mt-1 space-y-0.5">
                    <li>• Grid delimitado por las paredes</li>
                    <li>• Navegación 3D limitada al área del grid</li>
                    <li>• Equipos se colocan automáticamente en la cuadrícula</li>
                    <li>• Cámara 3D restringida entre piso y techo</li>
                  </ul>
                </div>
              </div>
            </CollapsiblePanel>
          )}
        </div>

        {/* Panel derecho colapsable */}
        {showRightPanel && (
          <div className="w-64 flex-shrink-0 flex flex-col gap-2 overflow-hidden">
            {room && selectedEquipmentId && (
              <CollapsiblePanel
                title="Posición del Objeto"
                icon={<MapPin className="w-4 h-4 text-slate-700" />}
                defaultExpanded={true}
                className="flex-shrink-0"
              >
                <PositionPanel
                  room={room}
                  equipment={equipment}
                  selectedEquipmentId={selectedEquipmentId}
                  onUpdatePosition={handleUpdateEquipmentPosition}
                  onDeselect={() => setSelectedEquipmentId(null)}
                />
              </CollapsiblePanel>
            )}
            {room && (
              <CollapsiblePanel
                title="Equipo Médico"
                subtitle={`${equipment.length} equipos`}
                icon={<List className="w-4 h-4 text-slate-700" />}
                defaultExpanded={true}
                className="flex-1 flex flex-col min-h-0"
              >
                <EquipmentPanel
                  room={room}
                  equipment={equipment}
                  onAddEquipment={handleAddEquipment}
                  onUpdateEquipment={handleUpdateEquipment}
                  onDeleteEquipment={handleDeleteEquipment}
                />
              </CollapsiblePanel>
            )}
          </div>
        )}
      </main>

      {/* Botón de exportar informe de seguridad */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleExportSecurityReport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors font-medium text-sm"
          aria-label="Exportar דו״ח de seguridad y consejos"
        >
          <FileText className="w-4 h-4" />
          <span>דו״ח בטיחות</span>
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default App;
