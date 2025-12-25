import { useState, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';
import type { MedicalEquipment, Room, Position3D } from '../types';
import { isEquipmentInValidPosition } from '../utils/geometry';

interface PositionPanelProps {
  room: Room;
  equipment: MedicalEquipment[];
  selectedEquipmentId: string | null;
  onUpdatePosition: (id: string, position: Position3D) => void;
  onDeselect: () => void;
}

export function PositionPanel({
  room,
  equipment,
  selectedEquipmentId,
  onUpdatePosition,
  onDeselect
}: PositionPanelProps) {
  const selectedEquipment = equipment.find(eq => eq.id === selectedEquipmentId);
  
  const [position, setPosition] = useState<Position3D>({ x: 0, y: 0, z: 0 });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (selectedEquipment) {
      setPosition(selectedEquipment.position);
      setError('');
    }
  }, [selectedEquipment]);

  if (!selectedEquipment) {
    return (
      <div className="p-3 text-center text-slate-500 text-xs">
        בחר אובייקט על ידי לחיצה על הצירים שלו
      </div>
    );
  }

  const handleChange = (field: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newPosition = { ...position, [field]: numValue };
    setPosition(newPosition);
    setError('');

    // Validar posición
    if (isEquipmentInValidPosition(
      newPosition,
      { width: selectedEquipment.dimensions.width, depth: selectedEquipment.dimensions.depth },
      room.vertices
    )) {
      // Actualizar posición automáticamente
      onUpdatePosition(selectedEquipment.id, newPosition);
    } else {
      setError('מיקום מחוץ לגבולות החדר');
    }
  };

  const handleBlur = () => {
    // Asegurar que la posición esté en el grid de 0.5m
    const gridSize = 0.5;
    const snappedPosition: Position3D = {
      x: Math.round(position.x / gridSize) * gridSize,
      y: position.y,
      z: Math.round(position.z / gridSize) * gridSize
    };

    if (isEquipmentInValidPosition(
      snappedPosition,
      { width: selectedEquipment.dimensions.width, depth: selectedEquipment.dimensions.depth },
      room.vertices
    )) {
      setPosition(snappedPosition);
      onUpdatePosition(selectedEquipment.id, snappedPosition);
      setError('');
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-600" />
          <h3 className="font-semibold text-slate-800 text-sm">{selectedEquipment.name}</h3>
        </div>
        <button
          onClick={onDeselect}
          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          aria-label="סגור"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            מיקום X (מטרים)
          </label>
          <input
            type="number"
            step="0.5"
            value={position.x.toFixed(2)}
            onChange={(e) => handleChange('x', e.target.value)}
            onBlur={handleBlur}
            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            מיקום Y (מטרים)
          </label>
          <input
            type="number"
            step="0.1"
            value={position.y.toFixed(2)}
            onChange={(e) => handleChange('y', e.target.value)}
            onBlur={handleBlur}
            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            מיקום Z (מטרים)
          </label>
          <input
            type="number"
            step="0.5"
            value={position.z.toFixed(2)}
            onChange={(e) => handleChange('z', e.target.value)}
            onBlur={handleBlur}
            className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      <div className="pt-2 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          <strong>סוג:</strong> {selectedEquipment.type}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          <strong>מידות:</strong> {selectedEquipment.dimensions.width}מ' × {selectedEquipment.dimensions.depth}מ' × {selectedEquipment.dimensions.height}מ'
        </p>
      </div>
    </div>
  );
}

