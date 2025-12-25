import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface WelcomeScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeScreen({ isOpen, onClose }: WelcomeScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [logo1Visible, setLogo1Visible] = useState(false);
  const [logo2Visible, setLogo2Visible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Animación escalonada
      setTimeout(() => setLogo1Visible(true), 200);
      setTimeout(() => setLogo2Visible(true), 400);
      setTimeout(() => setContentVisible(true), 600);
    } else {
      setIsVisible(false);
      setLogo1Visible(false);
      setLogo2Visible(false);
      setContentVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const participants = [
    'עמנואל טירן',
    'שלמה רובינשטיין',
    'מוטי ברנט',
    'אוריאל בן אישו',
    'יוני בן חור'
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      {/* Overlay con gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/95 via-slate-900/95 to-blue-900/95 backdrop-blur-sm" />
      
      {/* Partículas decorativas animadas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Contenedor principal del popup - HORIZONTAL */}
      <div
        className={`relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-10 max-w-5xl w-full mx-4 transform transition-all duration-500 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 z-10"
          aria-label="סגור"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Contenido centrado */}
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          {/* Logos */}
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Logo יד שרה - Sin estilo de botón */}
            <div
              className={`transform transition-all duration-700 ${
                logo1Visible
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-90 translate-y-8'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-1 drop-shadow-lg">
                  יד שרה
                </div>
                <div className="text-xs md:text-sm text-emerald-200 font-light tracking-wider">
                  YAD SARAH
                </div>
              </div>
            </div>

            {/* Separador vertical */}
            <div
              className={`hidden md:block w-px h-16 bg-white/30 transition-all duration-700 ${
                contentVisible ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Logo כיוון טק - Sin estilo de botón */}
            <div
              className={`transform transition-all duration-700 ${
                logo2Visible
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-90 translate-y-8'
              }`}
            >
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-1 drop-shadow-lg">
                  כיוון טק
                </div>
                <div className="text-xs md:text-sm text-blue-200 font-light tracking-wider">
                  KIVUN TECH
                </div>
              </div>
            </div>
          </div>

          {/* Separador horizontal */}
          <div
            className={`w-full max-w-md h-px bg-white/30 transition-all duration-700 ${
              contentVisible ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Información del Hackathon */}
          <div
            className={`transition-all duration-700 delay-200 ${
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-lg md:text-xl text-emerald-200 font-semibold">
              האקטון 2025 בשיתוף יד שרה וכיוון טק
            </p>
          </div>

          {/* Sección de participantes */}
          <div
            className={`transition-all duration-700 delay-300 ${
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h2 className="text-base md:text-lg font-semibold text-white/90 mb-3">
              משתתפים:
            </h2>
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className="text-sm md:text-base text-white/80 font-light"
                >
                  {participant}
                </div>
              ))}
            </div>
          </div>

          {/* Botón de continuar */}
          <div
            className={`pt-2 transition-all duration-700 delay-500 ${
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-base"
            >
              התחל
            </button>
          </div>
        </div>

        {/* Efectos de brillo decorativos */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-3xl">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>
    </div>
  );
}
