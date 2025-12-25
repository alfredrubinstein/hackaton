import { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Map, Wifi, WifiOff, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { RCCarController } from '../js/rcCarController';
import { MapGenerator3D } from '../js/mapGenerator';

interface RCCarControlPanelProps {
  onMapGenerated?: (mapData: any) => void;
  roomVertices?: Array<{ x: number; y: number }>;
}

export function RCCarControlPanel({ onMapGenerated, roomVertices }: RCCarControlPanelProps) {
  const [controller] = useState(() => new RCCarController());
  const [isConnected, setIsConnected] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, theta: 0 });
  const [pathHistory, setPathHistory] = useState<Array<{ x: number; y: number; theta: number }>>([]);
  const [speed, setSpeed] = useState(150);
  const mapGeneratorRef = useRef(new MapGenerator3D());

  useEffect(() => {
    // Configurar callbacks
    controller.onPositionUpdate = (pos) => {
      setPosition(pos);
      mapGeneratorRef.current.addPathPoint(pos.x / 100, pos.y / 100, pos.theta);
    };

    controller.onPathUpdate = (path: Array<{ x: number; y: number; theta: number }>) => {
      setPathHistory(path);
    };

    controller.onConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
    };

    // Configurar límites de habitación si están disponibles
    if (roomVertices && roomVertices.length > 0) {
      controller.setRoomBounds(roomVertices);
    }

    return () => {
      controller.disconnect();
    };
  }, [controller, roomVertices]);

  const handleConnect = async () => {
    try {
      await controller.connect();
    } catch (error: any) {
      alert(`Error conectando: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    await controller.disconnect();
  };

  const handleStartMapping = () => {
    setIsMapping(true);
    controller.resetOdometry();
    mapGeneratorRef.current.reset();
  };

  const handleStopMapping = () => {
    setIsMapping(false);
    controller.stop();
  };

  const handleGenerateMap = () => {
    const mapData = mapGeneratorRef.current.exportToRoomFormat('Habitación Mapeada');
    if (mapData && onMapGenerated) {
      onMapGenerated(mapData);
    }
  };

  const handleKeyDown = async (e: KeyboardEvent) => {
    if (!isConnected) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        await controller.forward(speed);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        await controller.backward(speed);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        await controller.turnLeft(speed);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        await controller.turnRight(speed);
        break;
    }
  };

  const handleKeyUp = async (e: KeyboardEvent) => {
    if (!isConnected) return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
      e.preventDefault();
      await controller.stop();
    }
  };

  useEffect(() => {
    if (isConnected) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isConnected, speed]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-emerald-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-slate-400" />
          )}
          Control Coches RC
        </h3>
      </div>

      {/* Estado de conexión */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        <span className="text-sm text-slate-600">
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {/* Botones de conexión */}
      {!isConnected ? (
        <button
          onClick={handleConnect}
          className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
        >
          <Wifi className="w-4 h-4" />
          Conectar con Arduino
        </button>
      ) : (
        <button
          onClick={handleDisconnect}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Desconectar
        </button>
      )}

      {isConnected && (
        <>
          {/* Control de velocidad */}
          <div>
            <label className="text-sm text-slate-600 mb-2 block">
              Velocidad: {speed}
            </label>
            <input
              type="range"
              min="50"
              max="255"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Controles de movimiento */}
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div></div>
              <button
                onMouseDown={() => controller.forward(speed)}
                onMouseUp={() => controller.stop()}
                onTouchStart={() => controller.forward(speed)}
                onTouchEnd={() => controller.stop()}
                className="p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 flex items-center justify-center"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div></div>
              <button
                onMouseDown={() => controller.turnLeft(speed)}
                onMouseUp={() => controller.stop()}
                onTouchStart={() => controller.turnLeft(speed)}
                onTouchEnd={() => controller.stop()}
                className="p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => controller.stop()}
                className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
              >
                <Square className="w-5 h-5" />
              </button>
              <button
                onMouseDown={() => controller.turnRight(speed)}
                onMouseUp={() => controller.stop()}
                onTouchStart={() => controller.turnRight(speed)}
                onTouchEnd={() => controller.stop()}
                className="p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div></div>
              <button
                onMouseDown={() => controller.backward(speed)}
                onMouseUp={() => controller.stop()}
                onTouchStart={() => controller.backward(speed)}
                onTouchEnd={() => controller.stop()}
                className="p-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 flex items-center justify-center"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <div></div>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Usa las flechas del teclado o los botones
            </p>
          </div>

          {/* Control de mapeo */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex items-center gap-2">
              {!isMapping ? (
                <button
                  onClick={handleStartMapping}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Mapeo
                </button>
              ) : (
                <button
                  onClick={handleStopMapping}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Detener Mapeo
                </button>
              )}
              <button
                onClick={() => {
                  controller.resetOdometry();
                  mapGeneratorRef.current.reset();
                  setPathHistory([]);
                }}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                title="Resetear odometría"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {pathHistory.length > 0 && (
              <button
                onClick={handleGenerateMap}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <Map className="w-4 h-4" />
                Generar Mapa 3D
              </button>
            )}
          </div>

          {/* Información de posición */}
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">X:</span>
                <span className="font-mono">{(position.x / 100).toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Y:</span>
                <span className="font-mono">{(position.y / 100).toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">θ:</span>
                <span className="font-mono">{(position.theta * 180 / Math.PI).toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Puntos:</span>
                <span className="font-mono">{pathHistory.length}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

