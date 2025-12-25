import { X, Bot } from 'lucide-react';

interface RobotMeasurementViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RobotMeasurementView({ isOpen, onClose }: RobotMeasurementViewProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-600" />
            מדידה ברובוט
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="סגור חלון"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Imagen del robot Arduino */}
          <div className="mb-6 flex justify-center">
            <div className="relative bg-slate-100 rounded-lg p-8 border-2 border-slate-300">
              {/* Representación visual del robot Arduino */}
              <div className="w-full max-w-md mx-auto">
                {/* Cuerpo del robot */}
                <div className="bg-slate-800 rounded-lg p-6 mb-4 shadow-lg">
                  {/* Placa Arduino representada */}
                  <div className="bg-emerald-600 rounded p-4 mb-4">
                    <div className="text-white text-center font-mono text-sm">ARDUINO</div>
                  </div>
                  
                  {/* Botones no funcionales */}
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        disabled
                        className="px-4 py-3 bg-slate-600 text-white rounded-lg cursor-not-allowed opacity-60 hover:opacity-60 transition-none"
                        aria-label={`Botón ${num} (no funcional)`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Texto principal */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">
                    קבל מידות מהרובוט
                  </h3>
                  <p className="text-sm text-slate-600">
                    הרובוט מוכן לקבל פקודות מדידה
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              התכונות זמינות בקרוב. הרובוט נמצא בפיתוח.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

