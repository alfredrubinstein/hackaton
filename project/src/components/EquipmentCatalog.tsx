import { useState } from 'react';
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { medicalEquipmentCatalog, categories, type EquipmentTemplate } from '../data/medicalEquipmentCatalog';

interface EquipmentCatalogProps {
  onDragStart: (equipment: EquipmentTemplate) => void;
}

export function EquipmentCatalog({ onDragStart }: EquipmentCatalogProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['ריהוט', 'ניטור'])
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleDragStart = (e: React.DragEvent, equipment: EquipmentTemplate) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(equipment));
    onDragStart(equipment);
  };

  const equipmentsByCategory = categories.reduce((acc, category) => {
    acc[category] = medicalEquipmentCatalog.filter(eq => eq.category === category);
    return acc;
  }, {} as Record<string, EquipmentTemplate[]>);

  return (
    <div className="p-2">
      <p className="text-xs text-slate-600 mb-2 px-2">
        גרור את הציוד לחדר
      </p>
      <div className="overflow-y-auto">
        {categories.map(category => (
          <div key={category} className="border-b border-slate-200 last:border-b-0">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
            >
              <span className="font-medium text-slate-800">{category}</span>
              {expandedCategories.has(category) ? (
                <ChevronUp size={18} className="text-slate-500" />
              ) : (
                <ChevronDown size={18} className="text-slate-500" />
              )}
            </button>

            {expandedCategories.has(category) && (
              <div className="px-2 pb-2 space-y-1">
                {equipmentsByCategory[category].map(equipment => (
                  <div
                    key={equipment.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, equipment)}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border-2 border-transparent hover:border-slate-300 hover:bg-slate-100 cursor-move transition-all group"
                    role="button"
                    tabIndex={0}
                    aria-label={`גרור ${equipment.name}`}
                  >
                    <div
                      className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${equipment.color}20` }}
                    >
                      {equipment.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-800 text-sm truncate">
                        {equipment.name}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {equipment.defaultDimensions.width}m × {equipment.defaultDimensions.depth}m × {equipment.defaultDimensions.height}m
                      </p>
                    </div>
                    <GripVertical
                      size={18}
                      className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 text-center mt-2 px-2">
        {medicalEquipmentCatalog.length} ציוד זמין
      </p>
    </div>
  );
}
