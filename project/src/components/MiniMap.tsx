import { useEffect, useRef } from 'react';
import type { Room } from '../types';

interface MiniMapProps {
  rooms: Room[];
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  viewBox?: string;
}

export function MiniMap({ rooms, selectedRoomId, onRoomSelect, viewBox = '0 0 100 100' }: MiniMapProps) {
  const roomRefs = useRef<Map<string, SVGPathElement>>(new Map());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = rooms.findIndex(r => r.id === selectedRoomId);
        const nextIndex = (currentIndex + 1) % rooms.length;
        onRoomSelect(rooms[nextIndex].id);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = rooms.findIndex(r => r.id === selectedRoomId);
        const prevIndex = currentIndex <= 0 ? rooms.length - 1 : currentIndex - 1;
        onRoomSelect(rooms[prevIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rooms, selectedRoomId, onRoomSelect]);

  return (
    <div className="w-full">
      <svg
        viewBox={viewBox}
        className="w-full h-48 border border-slate-200 rounded"
        role="img"
        aria-label="מפה אינטראקטיבית של הנכס"
      >
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {rooms.map((room) => (
          <g key={room.id}>
            <path
              ref={(el) => {
                if (el) roomRefs.current.set(room.id, el);
              }}
              d={room.svg_path}
              fill={selectedRoomId === room.id ? '#3b82f6' : '#cbd5e1'}
              stroke="#475569"
              strokeWidth="0.5"
              className="cursor-pointer transition-all duration-200 hover:fill-blue-400"
              onClick={() => onRoomSelect(room.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRoomSelect(room.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`חדר: ${room.name}. ${
                selectedRoomId === room.id ? 'נבחר' : 'לחץ Enter לבחירה'
              }`}
            />
            <text
              x={room.vertices[0].x + 2}
              y={room.vertices[0].y + 5}
              fontSize="4"
              fill="#1e293b"
              pointerEvents="none"
              className="font-medium"
            >
              {room.name}
            </text>
          </g>
        ))}
      </svg>

      <div className="mt-2 text-xs text-slate-600">
        <p>
          לחץ על חדר או השתמש בחצים במקלדת
        </p>
      </div>
    </div>
  );
}
