import { useState } from 'react';
import { Check, Edit2, Save, X, AlertCircle, Loader2 } from 'lucide-react';
import type { Vertex } from '../types';
import type { GeneratedRoomData } from '../services/roomGeneratorService';

interface RoomAnalysisPreviewProps {
  roomData: GeneratedRoomData | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  onConfirm: (roomData: GeneratedRoomData) => void;
  onCancel: () => void;
}

export function RoomAnalysisPreview({
  roomData,
  isAnalyzing,
  analysisError,
  onConfirm,
  onCancel,
}: RoomAnalysisPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<GeneratedRoomData | null>(roomData);

  if (isAnalyzing) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Analizando fotos con IA...</p>
        <p className="text-sm text-slate-500 mt-2">Esto puede tomar unos momentos</p>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">Error en el análisis</h3>
            <p className="text-sm text-red-700">{analysisError}</p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="mt-4 w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
        >
          Cerrar
        </button>
      </div>
    );
  }

  if (!roomData || !editedData) {
    return null;
  }

  const handleSave = () => {
    setIsEditing(false);
    setEditedData({ ...editedData });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData(roomData);
  };

  const updateVertex = (index: number, field: 'x' | 'y', value: number) => {
    if (!editedData) return;
    const newVertices = [...editedData.vertices];
    newVertices[index] = { ...newVertices[index], [field]: value };
    setEditedData({
      ...editedData,
      vertices: newVertices,
      svg_path: verticesToSvgPath(newVertices),
    });
  };

  const updateWallHeight = (value: number) => {
    if (!editedData) return;
    setEditedData({ ...editedData, wall_height: value });
  };

  const updateRoomName = (value: string) => {
    if (!editedData) return;
    setEditedData({ ...editedData, name: value });
  };

  return (
    <div className="space-y-4">
      {/* Información general */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">Información de la Habitación</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded"
              aria-label="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-sm text-slate-600">Nombre</label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.name}
                onChange={(e) => updateRoomName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <p className="font-medium text-slate-800">{editedData.name}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-slate-600">Altura de Paredes (m)</label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                min="2"
                max="5"
                value={editedData.wall_height}
                onChange={(e) => updateWallHeight(parseFloat(e.target.value) || 2.6)}
                className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <p className="font-medium text-slate-800">{editedData.wall_height.toFixed(2)} m</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Vértices */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">
            Vértices ({editedData.vertices.length} puntos)
          </h3>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {editedData.vertices.map((vertex, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="text-slate-600 w-8">#{index + 1}</span>
              {isEditing ? (
                <>
                  <input
                    type="number"
                    step="0.1"
                    value={vertex.x.toFixed(2)}
                    onChange={(e) => updateVertex(index, 'x', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="X"
                  />
                  <span className="text-slate-400">×</span>
                  <input
                    type="number"
                    step="0.1"
                    value={vertex.y.toFixed(2)}
                    onChange={(e) => updateVertex(index, 'y', parseFloat(e.target.value) || 0)}
                    className="flex-1 px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Y"
                  />
                </>
              ) : (
                <span className="text-slate-800">
                  ({vertex.x.toFixed(2)}, {vertex.y.toFixed(2)})
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instalaciones */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="font-semibold text-slate-800 mb-3">
          Instalaciones Detectadas ({editedData.installations.length})
        </h3>
        {editedData.installations.length > 0 ? (
          <div className="space-y-2">
            {editedData.installations.map((inst, index) => (
              <div key={index} className="text-sm bg-white p-2 rounded border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    inst.type === 'door' ? 'bg-purple-100 text-purple-800' :
                    inst.type === 'window' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {inst.type === 'door' ? 'Puerta' :
                     inst.type === 'window' ? 'Ventana' :
                     'Punto de Energía'}
                  </span>
                  <span className="text-slate-600">{inst.subtype}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No se detectaron instalaciones</p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={() => onConfirm(editedData)}
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 font-medium"
        >
          <Check className="w-5 h-5" />
          Crear Habitación
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function verticesToSvgPath(vertices: Vertex[]): string {
  if (vertices.length === 0) return '';

  const pathParts: string[] = [];
  pathParts.push(`M ${vertices[0].x},${vertices[0].y}`);

  for (let i = 1; i < vertices.length; i++) {
    pathParts.push(`L ${vertices[i].x},${vertices[i].y}`);
  }

  pathParts.push('Z');
  return pathParts.join(' ');
}

