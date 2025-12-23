import { useState, useRef, useEffect } from 'react';
import type { Room, MedicalEquipment, Installation } from '../types';

interface FloorPlan2DProps {
  room: Room;
  equipment: MedicalEquipment[];
  installations: Installation[];
}

export function FloorPlan2D({ room, equipment, installations }: FloorPlan2DProps) {
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Plano 2D: {room.name}
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

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="w-full h-96 bg-slate-50"
          style={{
            transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${scale})`
          }}
        >
          <rect
            x={minX}
            y={minY}
            width={roomWidth}
            height={roomHeight}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth={0.2}
          />

          <g opacity={0.3}>
            {gridLines}
          </g>

          <path
            d={room.svg_path}
            fill="#e2e8f0"
            stroke="#64748b"
            strokeWidth={0.5}
          />

          {room.vertices.map((vertex, i) => {
            const nextVertex = room.vertices[(i + 1) % room.vertices.length];
            return (
              <line
                key={`wall-${i}`}
                x1={vertex.x}
                y1={vertex.y}
                x2={nextVertex.x}
                y2={nextVertex.y}
                stroke="#1e293b"
                strokeWidth={0.8}
              />
            );
          })}

          {installations.map((inst, idx) => {
            if (inst.type === 'door' && 'start' in inst.position) {
              return (
                <line
                  key={`door-${idx}`}
                  x1={inst.position.start.x}
                  y1={inst.position.start.y}
                  x2={inst.position.end.x}
                  y2={inst.position.end.y}
                  stroke="#8b5cf6"
                  strokeWidth={1}
                />
              );
            }
            if (inst.type === 'window' && 'start' in inst.position) {
              return (
                <line
                  key={`window-${idx}`}
                  x1={inst.position.start.x}
                  y1={inst.position.start.y}
                  x2={inst.position.end.x}
                  y2={inst.position.end.y}
                  stroke="#06b6d4"
                  strokeWidth={1}
                  strokeDasharray="0.5,0.5"
                />
              );
            }
            if (inst.type === 'power_point' && 'x' in inst.position) {
              return (
                <circle
                  key={`power-${idx}`}
                  cx={inst.position.x}
                  cy={inst.position.y}
                  r={0.3}
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth={0.1}
                />
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
            Escala: 0.5m
          </text>
        </svg>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => handlePan('up')}
            className="w-10 h-10 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
            aria-label="Pan arriba"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handlePan('left')}
              className="w-10 h-10 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
              aria-label="Pan izquierda"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => handlePan('down')}
              className="w-10 h-10 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
              aria-label="Pan abajo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => handlePan('right')}
              className="w-10 h-10 bg-white hover:bg-slate-100 rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 transition-colors border border-slate-200"
              aria-label="Pan derecha"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-600 text-center">
          {equipment.length} equipos • Cuadrícula de {gridSize}m •
          {' '}Área: {(roomWidth * roomHeight).toFixed(1)}m²
        </p>
      </div>
    </div>
  );
}
