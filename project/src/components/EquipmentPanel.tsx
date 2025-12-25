import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { MedicalEquipment, Room } from '../types';
import { isEquipmentInValidPosition } from '../utils/geometry';

interface EquipmentPanelProps {
  room: Room;
  equipment: MedicalEquipment[];
  onAddEquipment: (equipment: Omit<MedicalEquipment, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateEquipment: (id: string, updates: Partial<MedicalEquipment>) => void;
  onDeleteEquipment: (id: string) => void;
}

export function EquipmentPanel({
  room,
  equipment,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment
}: EquipmentPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'monitor',
    x: '0',
    y: '0',
    z: '0',
    width: '1',
    height: '1',
    depth: '1'
  });
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const position = {
      x: parseFloat(formData.x),
      y: parseFloat(formData.y),
      z: parseFloat(formData.z)
    };

    const dimensions = {
      width: parseFloat(formData.width),
      height: parseFloat(formData.height),
      depth: parseFloat(formData.depth)
    };

    const isValid = isEquipmentInValidPosition(
      position,
      { width: dimensions.width, depth: dimensions.depth },
      room.vertices
    );

    if (!isValid) {
      setValidationError('הציוד נמצא מחוץ לגבולות החדר או מעל פתח.');
      return;
    }

    onAddEquipment({
      room_id: room.id,
      name: formData.name,
      type: formData.type,
      position,
      rotation: { x: 0, y: 0, z: 0 },
      dimensions
    });

    setFormData({
      name: '',
      type: 'monitor',
      x: '0',
      y: '0',
      z: '0',
      width: '1',
      height: '1',
      depth: '1'
    });
    setShowAddForm(false);
  };

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 px-2 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs"
          aria-label="הוסף ציוד רפואי חדש"
        >
          <Plus size={14} />
          הוסף
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-3 p-3 bg-slate-50 rounded-lg space-y-2">
          <div>
            <label htmlFor="eq-name" className="block text-xs font-medium text-slate-700 mb-1">
              שם הציוד
            </label>
            <input
              id="eq-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="eq-type" className="block text-xs font-medium text-slate-700 mb-1">
              סוג
            </label>
            <select
              id="eq-type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="monitor">מוניטור</option>
              <option value="bed">מיטה</option>
              <option value="cart">עגלה</option>
              <option value="scanner">סורק</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label htmlFor="eq-x" className="block text-xs font-medium text-slate-700 mb-1">
                X
              </label>
              <input
                id="eq-x"
                type="number"
                step="0.1"
                value={formData.x}
                onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="eq-y" className="block text-xs font-medium text-slate-700 mb-1">
                Y
              </label>
              <input
                id="eq-y"
                type="number"
                step="0.1"
                value={formData.y}
                onChange={(e) => setFormData({ ...formData, y: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="eq-z" className="block text-xs font-medium text-slate-700 mb-1">
                Z
              </label>
              <input
                id="eq-z"
                type="number"
                step="0.1"
                value={formData.z}
                onChange={(e) => setFormData({ ...formData, z: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label htmlFor="eq-width" className="block text-xs font-medium text-slate-700 mb-1">
                רוחב
              </label>
              <input
                id="eq-width"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="eq-height" className="block text-xs font-medium text-slate-700 mb-1">
                גובה
              </label>
              <input
                id="eq-height"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="eq-depth" className="block text-xs font-medium text-slate-700 mb-1">
                עומק
              </label>
              <input
                id="eq-depth"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.depth}
                onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {validationError && (
            <div
              className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs"
              role="alert"
              aria-live="polite"
            >
              {validationError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              הוסף
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setValidationError('');
              }}
              className="px-3 py-1.5 text-xs bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto" role="list" aria-label="רשימת ציוד רפואי">
        {equipment.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-3">
            אין ציוד רפואי
          </p>
        ) : (
          equipment.map((eq) => (
            <div
              key={eq.id}
              className="flex items-center justify-between p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              role="listitem"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 text-xs truncate">{eq.name}</h3>
                <p className="text-xs text-slate-600 truncate">
                  {eq.type} | ({eq.position.x.toFixed(1)}, {eq.position.z.toFixed(1)})
                </p>
              </div>
              <button
                onClick={() => onDeleteEquipment(eq.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                aria-label={`מחק ${eq.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
