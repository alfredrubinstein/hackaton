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
      setValidationError('El equipo está fuera de los límites de la habitación o sobre una abertura.');
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
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Equipo Médico</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          aria-label="Agregar nuevo equipo médico"
        >
          <Plus size={18} />
          Agregar
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
          <div>
            <label htmlFor="eq-name" className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del Equipo
            </label>
            <input
              id="eq-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="eq-type" className="block text-sm font-medium text-slate-700 mb-1">
              Tipo
            </label>
            <select
              id="eq-type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="monitor">Monitor</option>
              <option value="bed">Cama</option>
              <option value="cart">Carrito</option>
              <option value="scanner">Escáner</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="eq-x" className="block text-sm font-medium text-slate-700 mb-1">
                Posición X
              </label>
              <input
                id="eq-x"
                type="number"
                step="0.1"
                value={formData.x}
                onChange={(e) => setFormData({ ...formData, x: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="eq-y" className="block text-sm font-medium text-slate-700 mb-1">
                Posición Y
              </label>
              <input
                id="eq-y"
                type="number"
                step="0.1"
                value={formData.y}
                onChange={(e) => setFormData({ ...formData, y: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="eq-z" className="block text-sm font-medium text-slate-700 mb-1">
                Posición Z
              </label>
              <input
                id="eq-z"
                type="number"
                step="0.1"
                value={formData.z}
                onChange={(e) => setFormData({ ...formData, z: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="eq-width" className="block text-sm font-medium text-slate-700 mb-1">
                Ancho
              </label>
              <input
                id="eq-width"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.width}
                onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="eq-height" className="block text-sm font-medium text-slate-700 mb-1">
                Altura
              </label>
              <input
                id="eq-height"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="eq-depth" className="block text-sm font-medium text-slate-700 mb-1">
                Profundidad
              </label>
              <input
                id="eq-depth"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.depth}
                onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {validationError && (
            <div
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              role="alert"
              aria-live="polite"
            >
              {validationError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Agregar Equipo
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setValidationError('');
              }}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2" role="list" aria-label="Lista de equipos médicos">
        {equipment.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">
            No hay equipos médicos en esta habitación
          </p>
        ) : (
          equipment.map((eq) => (
            <div
              key={eq.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              role="listitem"
            >
              <div className="flex-1">
                <h3 className="font-medium text-slate-800">{eq.name}</h3>
                <p className="text-sm text-slate-600">
                  Tipo: {eq.type} | Pos: ({eq.position.x.toFixed(1)}, {eq.position.y.toFixed(1)},{' '}
                  {eq.position.z.toFixed(1)})
                </p>
              </div>
              <button
                onClick={() => onDeleteEquipment(eq.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label={`Eliminar ${eq.name}`}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
