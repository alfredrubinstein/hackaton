import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export interface PhotoFile {
  id: string;
  file: File;
  preview: string;
  source: 'file' | 'camera';
}

interface PhotoUploaderProps {
  onPhotosChange: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export function PhotoUploader({ onPhotosChange, maxPhotos = 5, disabled = false }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newPhotos: PhotoFile[] = [];
    const remainingSlots = maxPhotos - photos.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const id = `${Date.now()}-${Math.random()}`;
        const preview = URL.createObjectURL(file);
        newPhotos.push({
          id,
          file,
          preview,
          source: 'file',
        });
      }
    });

    if (newPhotos.length > 0) {
      const updatedPhotos = [...photos, ...newPhotos];
      setPhotos(updatedPhotos);
      onPhotosChange(updatedPhotos);
    }
  }, [photos, maxPhotos, onPhotosChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && photos.length < maxPhotos) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [disabled, photos.length, maxPhotos, handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      handleFileSelect(e.target.files);
      // Reset input para permitir seleccionar el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [disabled, handleFileSelect]);

  const removePhoto = useCallback((id: string) => {
    const photoToRemove = photos.find(p => p.id === id);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.preview);
    }
    const updatedPhotos = photos.filter(p => p.id !== id);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  }, [photos, onPhotosChange]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Cámara trasera si está disponible
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      alert('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || photos.length >= maxPhotos) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const id = `${Date.now()}-${Math.random()}`;
        const preview = URL.createObjectURL(blob);

        const newPhoto: PhotoFile = {
          id,
          file,
          preview,
          source: 'camera',
        };

        const updatedPhotos = [...photos, newPhoto];
        setPhotos(updatedPhotos);
        onPhotosChange(updatedPhotos);
      }
    }, 'image/jpeg', 0.9);
  }, [photos, maxPhotos, onPhotosChange]);

  return (
    <div className="space-y-4">
      {/* Área de drag & drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-slate-300 bg-slate-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-400'}
        `}
        onClick={() => !disabled && !cameraActive && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || cameraActive}
        />
        
        {!cameraActive ? (
          <>
            <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-2">
              Arrastra fotos aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-slate-500">
              {photos.length} / {maxPhotos} fotos seleccionadas
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <div className="relative inline-block">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-w-full max-h-64 rounded-lg"
              />
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-lg pointer-events-none" />
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  capturePhoto();
                }}
                disabled={photos.length >= maxPhotos}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Capturar Foto
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  stopCamera();
                }}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
              >
                Cerrar Cámara
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Botón de cámara */}
      {!cameraActive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            startCamera();
          }}
          disabled={disabled || photos.length >= maxPhotos}
          className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Abrir Cámara
        </button>
      )}

      {/* Vista previa de fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.preview}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-slate-300"
              />
              <button
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Eliminar foto"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-800 bg-opacity-75 text-white text-xs rounded">
                {photo.source === 'camera' ? 'Cámara' : 'Archivo'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

