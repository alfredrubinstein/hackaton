import { useState, useRef, useEffect } from 'react';
import type { Room, MedicalEquipment, Installation, Position3D } from '../types';
import type { EquipmentTemplate } from '../data/medicalEquipmentCatalog';
import { isEquipmentInValidPosition } from '../utils/geometry';

interface FloorPlan2DProps {
  room: Room;
  equipment: MedicalEquipment[];
  installations: Installation[];
  onEquipmentDrop?: (equipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>) => void;
  onEquipmentUpdate?: (id: string, position: Position3D) => void;
  selectedEquipmentId?: string | null;
  onEquipmentSelect?: (id: string | null) => void;
}

export function FloorPlan2D({ room, equipment, installations, onEquipmentDrop, onEquipmentUpdate, selectedEquipmentId, onEquipmentSelect }: FloorPlan2DProps) {
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggingEquipmentId, setDraggingEquipmentId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const minX = Math.min(...room.vertices.map(v => v.x));
  const maxX = Math.max(...room.vertices.map(v => v.x));
  const minY = Math.min(...room.vertices.map(v => v.y));
  const maxY = Math.max(...room.vertices.map(v => v.y));

  const roomWidth = maxX - minX;
  const roomHeight = maxY - minY;
  const padding = 5;

  const viewBox = `${minX - padding} ${minY - padding} ${roomWidth + padding * 2} ${roomHeight + padding * 2}`;

  const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
    const panAmount = 5 / scale;
    setViewOffset(prev => {
      switch (direction) {
        case 'up':
          return { ...prev, y: prev.y - panAmount };
        case 'down':
          return { ...prev, y: prev.y + panAmount };
        case 'left':
          return { ...prev, x: prev.x - panAmount };
        case 'right':
          return { ...prev, x: prev.x + panAmount };
        default:
          return prev;
      }
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setScale(prev => {
      const newScale = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.max(0.5, Math.min(3, newScale));
    });
  };

  const handleReset = () => {
    setViewOffset({ x: 0, y: 0 });
    setScale(1);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (!onEquipmentDrop || !svgRef.current) return;

    try {
      const equipmentData = JSON.parse(e.dataTransfer.getData('application/json')) as EquipmentTemplate;

      const rect = svgRef.current.getBoundingClientRect();
      const svgPoint = svgRef.current.createSVGPoint();
      
      // Coordenadas del mouse relativas al SVG
      svgPoint.x = e.clientX - rect.left;
      svgPoint.y = e.clientY - rect.top;

      // Convertir coordenadas de pantalla a coordenadas del viewBox del SVG
      // getScreenCTM() considera el viewBox y preserveAspectRatio automáticamente
      const ctm = svgRef.current.getScreenCTM();
      if (!ctm) return;

      const svgCoord = svgPoint.matrixTransform(ctm.inverse());

      // Aplicar transformaciones inversas del grupo (translate y scale)
      let actualX = (svgCoord.x - viewOffset.x) / scale;
      let actualY = (svgCoord.y - viewOffset.y) / scale;

      // Snap a la cuadrícula de 0.5m
      const gridSize = 0.5;
      const snappedX = Math.round(actualX / gridSize) * gridSize;
      const snappedY = Math.round(actualY / gridSize) * gridSize;

      // Verificar que esté dentro de los límites de la habitación
      if (snappedX < minX || snappedX > maxX || snappedY < minY || snappedY > maxY) {
        console.warn('Equipo fuera de los límites de la habitación');
        return;
      }

      const newEquipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'> = {
        room_id: room.id,
        name: equipmentData.name,
        type: equipmentData.type,
        position: {
          x: snappedX,
          y: 0,
          z: snappedY
        },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: equipmentData.defaultDimensions
      };

      onEquipmentDrop(newEquipment);
    } catch (err) {
      console.error('Error handling equipment drop:', err);
    }
  };

  const gridSize = 0.5;
  const gridLines = [];
  for (let x = Math.floor(minX / gridSize) * gridSize; x <= maxX; x += gridSize) {
    gridLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={minY}
        x2={x}
        y2={maxY}
        stroke="#e0e0e0"
        strokeWidth={0.1}
      />
    );
  }
  for (let y = Math.floor(minY / gridSize) * gridSize; y <= maxY; y += gridSize) {
    gridLines.push(
      <line
        key={`h-${y}`}
        x1={minX}
        y1={y}
        x2={maxX}
        y2={y}
        stroke="#e0e0e0"
        strokeWidth={0.1}
      />
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-500 bg-opacity-20 border-4 border-dashed border-emerald-500 rounded-lg pointer-events-none z-10">
          <div className="text-emerald-700 text-xl font-semibold bg-white px-6 py-3 rounded-lg shadow-lg">
            שחרר כאן כדי למקם את הציוד
          </div>
        </div>
      )}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold text-slate-800">
          Vista 2D: {room.name}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleZoom('in')}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 text-sm transition-colors"
            aria-label="Acercar"
          >
            +
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 text-sm transition-colors"
            aria-label="Alejar"
          >
            −
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700 text-sm transition-colors"
            aria-label="Restablecer vista"
          >
            ⟲
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="w-full h-full bg-slate-50"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={(e) => {
            if (draggingEquipmentId && svgRef.current && onEquipmentUpdate) {
              const rect = svgRef.current.getBoundingClientRect();
              const svgPoint = svgRef.current.createSVGPoint();
              svgPoint.x = e.clientX - rect.left;
              svgPoint.y = e.clientY - rect.top;
              const ctm = svgRef.current.getScreenCTM();
              if (!ctm) return;
              const svgCoord = svgPoint.matrixTransform(ctm.inverse());
              // Las coordenadas ya están en el sistema del viewBox, no necesitamos aplicar transformaciones inversas
              // porque el grupo con transformaciones está dentro del SVG
              let actualX = svgCoord.x;
              let actualY = svgCoord.y;
              
              const gridSize = 0.5;
              const snappedX = Math.round(actualX / gridSize) * gridSize;
              const snappedY = Math.round(actualY / gridSize) * gridSize;
              
              const draggedEquipment = equipment.find(eq => eq.id === draggingEquipmentId);
              if (draggedEquipment && onEquipmentUpdate) {
                const newPosition: Position3D = {
                  x: snappedX,
                  y: draggedEquipment.position.y,
                  z: snappedY
                };
                
                // Validar que no pase las paredes
                if (isEquipmentInValidPosition(
                  newPosition,
                  { width: draggedEquipment.dimensions.width, depth: draggedEquipment.dimensions.depth },
                  room.vertices
                )) {
                  onEquipmentUpdate(draggingEquipmentId, newPosition);
                }
              }
            }
          }}
          onMouseUp={() => {
            setDraggingEquipmentId(null);
          }}
          onMouseLeave={() => {
            setDraggingEquipmentId(null);
          }}
        >
          <g
            style={{
              transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${scale})`,
              transformOrigin: '0 0'
            }}
          >
          {/* Fondo de la habitación */}
          <rect
            x={minX}
            y={minY}
            width={roomWidth}
            height={roomHeight}
            fill="#f8fafc"
            stroke="none"
          />

          {/* Cuadrícula */}
          <g opacity={0.3}>
            {gridLines}
          </g>

          {/* Path del SVG (si existe) - renderizado antes de las paredes */}
          {room.svg_path && room.svg_path.trim() && (
            <path
              d={room.svg_path}
              fill="#e2e8f0"
              stroke="none"
              opacity={0.4}
            />
          )}

          {/* Paredes - renderizadas después para que sean visibles */}
          {room.vertices.map((vertex, i) => {
            const nextVertex = room.vertices[(i + 1) % room.vertices.length];
            
            // Grosor de pared más visible (0.5m en escala para mejor visibilidad)
            const wallThickness = 0.5;
            
            return (
              <g key={`wall-${i}`}>
                {/* Sombra de la pared para dar profundidad - renderizada primero */}
                <line
                  x1={vertex.x}
                  y1={vertex.y}
                  x2={nextVertex.x}
                  y2={nextVertex.y}
                  stroke="#94a3b8"
                  strokeWidth={wallThickness + 0.2}
                  opacity={0.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Pared principal - más gruesa y visible */}
                <line
                  x1={vertex.x}
                  y1={vertex.y}
                  x2={nextVertex.x}
                  y2={nextVertex.y}
                  stroke="#1e293b"
                  strokeWidth={wallThickness}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}

          {/* Instalaciones con mejor detalle visual */}
          {installations.map((inst, idx) => {
            if (inst.type === 'door' && 'start' in inst.position) {
              const start = inst.position.start;
              const end = inst.position.end;
              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2;
              const width = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
              
              return (
                <g key={`door-${idx}`}>
                  {/* Línea de la puerta - más gruesa y visible */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#8b5cf6"
                    strokeWidth={0.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Indicador de apertura (arco) */}
                  <path
                    d={`M ${start.x} ${start.y} A ${width * 0.5} ${width * 0.5} 0 0 1 ${end.x} ${end.y}`}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth={0.2}
                    strokeDasharray="0.3,0.3"
                    opacity={0.7}
                  />
                  {/* Punto central más visible */}
                  <circle
                    cx={midX}
                    cy={midY}
                    r={0.25}
                    fill="#8b5cf6"
                    opacity={0.9}
                  />
                </g>
              );
            }
            if (inst.type === 'window' && 'start' in inst.position) {
              const start = inst.position.start;
              const end = inst.position.end;
              
              return (
                <g key={`window-${idx}`}>
                  {/* Línea de la ventana */}
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#06b6d4"
                    strokeWidth={0.2}
                    strokeLinecap="round"
                  />
                  {/* Líneas internas de la ventana */}
                  <line
                    x1={start.x + (end.x - start.x) * 0.33}
                    y1={start.y + (end.y - start.y) * 0.33}
                    x2={start.x + (end.x - start.x) * 0.67}
                    y2={start.y + (end.y - start.y) * 0.67}
                    stroke="#06b6d4"
                    strokeWidth={0.1}
                    strokeDasharray="0.3,0.3"
                    opacity={0.7}
                  />
                </g>
              );
            }
            if (inst.type === 'power_point' && 'x' in inst.position) {
              return (
                <g key={`power-${idx}`}>
                  {/* Círculo exterior */}
                  <circle
                    cx={inst.position.x}
                    cy={inst.position.y}
                    r={0.4}
                    fill="#fbbf24"
                    stroke="#f59e0b"
                    strokeWidth={0.15}
                    opacity={0.9}
                  />
                  {/* Círculo interior */}
                  <circle
                    cx={inst.position.x}
                    cy={inst.position.y}
                    r={0.25}
                    fill="#ffffff"
                    opacity={0.8}
                  />
                  {/* Símbolo de enchufe */}
                  <rect
                    x={inst.position.x - 0.1}
                    y={inst.position.y - 0.05}
                    width={0.2}
                    height={0.1}
                    fill="#f59e0b"
                    rx={0.02}
                  />
                </g>
              );
            }
            return null;
          })}

          {equipment.map((eq) => (
            <g key={eq.id}>
              <rect
                x={eq.position.x - eq.dimensions.width / 2}
                y={eq.position.z - eq.dimensions.depth / 2}
                width={eq.dimensions.width}
                height={eq.dimensions.depth}
                fill="#10b981"
                stroke="#059669"
                strokeWidth={0.2}
                opacity={0.8}
              />
              <text
                x={eq.position.x}
                y={eq.position.z}
                fontSize={0.8}
                fill="#ffffff"
                textAnchor="middle"
                dominantBaseline="middle"
                pointerEvents="none"
                className="font-medium"
              >
                {eq.name.substring(0, 3)}
              </text>
              {/* Arcoíris verde claro para mover el objeto */}
              <g
                transform={`translate(${eq.position.x + eq.dimensions.width / 2 + 0.3}, ${eq.position.z + eq.dimensions.depth / 2 + 0.3})`}
                style={{ cursor: hoveredHandleId === eq.id ? 'grab' : 'pointer' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingEquipmentId(eq.id);
                  if (onEquipmentSelect) {
                    onEquipmentSelect(eq.id);
                  }
                }}
                onMouseEnter={() => {
                  setHoveredHandleId(eq.id);
                  if (onEquipmentSelect) {
                    onEquipmentSelect(eq.id);
                  }
                }}
                onMouseLeave={() => setHoveredHandleId(null)}
                className="transition-all"
              >
                {/* Arcoíris verde claro - círculos concéntricos con diferentes tonos de verde */}
                <circle
                  r={0.25}
                  fill={hoveredHandleId === eq.id ? "#d1fae5" : "#a7f3d0"}
                  opacity={hoveredHandleId === eq.id ? 1 : 0.9}
                  className="transition-all duration-200"
                />
                <circle
                  r={0.2}
                  fill={hoveredHandleId === eq.id ? "#a7f3d0" : "#86efac"}
                  opacity={hoveredHandleId === eq.id ? 1 : 0.8}
                  className="transition-all duration-200"
                />
                <circle
                  r={0.15}
                  fill={hoveredHandleId === eq.id ? "#86efac" : "#6ee7b7"}
                  opacity={hoveredHandleId === eq.id ? 1 : 0.7}
                  className="transition-all duration-200"
                />
                <circle
                  r={0.1}
                  fill={hoveredHandleId === eq.id ? "#6ee7b7" : "#4ade80"}
                  opacity={hoveredHandleId === eq.id ? 1 : 0.6}
                  className="transition-all duration-200"
                />
              </g>
            </g>
          ))}

          <text
            x={minX + 1}
            y={minY + 2}
            fontSize={1.5}
            fill="#1e293b"
            className="font-semibold"
          >
            {room.name}
          </text>

          <text
            x={maxX - 1}
            y={maxY - 1}
            fontSize={1}
            fill="#64748b"
            textAnchor="end"
          >
            קנה מידה: 0.5מ'
          </text>
          </g>
        </svg>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => handlePan('up')}
            className="w-10 h-10 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
            aria-label="הזז למעלה"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handlePan('left')}
              className="w-10 h-10 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
              aria-label="הזז שמאלה"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => handlePan('down')}
              className="w-10 h-10 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
              aria-label="הזז למטה"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => handlePan('right')}
              className="w-10 h-10 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
              aria-label="הזז ימינה"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
        <p className="text-xs text-slate-600 text-center">
          {equipment.length} ציוד • רשת של {gridSize}מ' •
          {' '}שטח: {(roomWidth * roomHeight).toFixed(1)}מ²
        </p>
      </div>
    </div>
  );
}
