import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

// Declarar tipos para OpenCV
declare global {
  interface Window {
    cv: any;
    onOpenCvReady: () => void;
  }
}

interface MeasurementToolProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

export function MeasurementTool({ isOpen, onClose }: MeasurementToolProps) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const zoomCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgOriginalRef = useRef<any>(null);
  const imgMainRef = useRef<any>(null);
  const transformMatrixRef = useRef<any>(null);
  const openCvLoadedRef = useRef<boolean>(false);
  const [status, setStatus] = useState('טוען OpenCV...');
  const [isLoading, setIsLoading] = useState(true);
  const [refPoints, setRefPoints] = useState<Point[]>([]);
  const [measurementPoints, setMeasurementPoints] = useState<Point[]>([]);
  const [isCalibrated, setIsCalibrated] = useState(false);

  // Cargar OpenCV.js
  useEffect(() => {
    if (!isOpen) return;

    // Si OpenCV ya está cargado, solo inicializar
    if (window.cv && openCvLoadedRef.current) {
      setStatus('OpenCV מוכן! טוען תמונה...');
      setIsLoading(false);
      return;
    }

    // Verificar si el script ya existe
    const existingScript = document.querySelector('script[src*="opencv.js"]');
    if (existingScript) {
      if (window.cv) {
        window.cv['onRuntimeInitialized'] = () => {
          setStatus('OpenCV מוכן! טוען תמונה...');
          setIsLoading(false);
          openCvLoadedRef.current = true;
        };
        // Si ya está inicializado
        if (window.cv.imread) {
          setStatus('OpenCV מוכן! טוען תמונה...');
          setIsLoading(false);
          openCvLoadedRef.current = true;
        }
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.x/opencv.js';
    script.async = true;
    script.type = 'text/javascript';
    
    window.onOpenCvReady = () => {
      if (window.cv) {
        window.cv['onRuntimeInitialized'] = () => {
          setStatus('OpenCV מוכן! טוען תמונה...');
          setIsLoading(false);
          openCvLoadedRef.current = true;
        };
      }
    };
    
    script.onload = () => {
      window.onOpenCvReady();
    };

    document.body.appendChild(script);

    return () => {
      // Limpiar recursos al cerrar
      if (imgOriginalRef.current) {
        imgOriginalRef.current.delete();
        imgOriginalRef.current = null;
      }
      if (imgMainRef.current) {
        imgMainRef.current.delete();
        imgMainRef.current = null;
      }
      if (transformMatrixRef.current) {
        transformMatrixRef.current.delete();
        transformMatrixRef.current = null;
      }
      setRefPoints([]);
      setMeasurementPoints([]);
      setIsCalibrated(false);
    };
  }, [isOpen]);

  const loadImage = (file: File) => {
    if (!mainCanvasRef.current || !window.cv) return;

    // Limpiar recursos anteriores
    if (imgOriginalRef.current) {
      imgOriginalRef.current.delete();
    }
    if (imgMainRef.current) {
      imgMainRef.current.delete();
    }
    if (transformMatrixRef.current) {
      transformMatrixRef.current.delete();
      transformMatrixRef.current = null;
    }

    const canvas = mainCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imgOrig = window.cv.imread(canvas);
      const imgM = imgOrig.clone();
      
      imgOriginalRef.current = imgOrig;
      imgMainRef.current = imgM;
      setStatus('מוכן. בחר 4 נקודות לכיול.');
      setIsCalibrated(false);
      setRefPoints([]);
      setMeasurementPoints([]);
      
      URL.revokeObjectURL(url);
      setupEvents(canvas);
    };
    
    img.src = url;
  };

  const setupEvents = (canvas: HTMLCanvasElement) => {
    canvas.onmousemove = (e) => handleZoom(e, canvas);
    canvas.onclick = (e) => handleClick(e, canvas);
  };

  const handleZoom = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    if (!imgOriginalRef.current || !zoomCanvasRef.current || !window.cv) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = 50;
    
    let startX = Math.max(0, Math.min(x - size / 2, imgOriginalRef.current.cols - size));
    let startY = Math.max(0, Math.min(y - size / 2, imgOriginalRef.current.rows - size));
    
    const roi = imgOriginalRef.current.roi(new window.cv.Rect(startX, startY, size, size));
    const dst = new window.cv.Mat();
    window.cv.resize(roi, dst, new window.cv.Size(300, 300), 0, 0, window.cv.INTER_CUBIC);
    
    window.cv.line(dst, new window.cv.Point(150, 0), new window.cv.Point(150, 300), new window.cv.Scalar(255, 255, 255, 255), 1);
    window.cv.line(dst, new window.cv.Point(0, 150), new window.cv.Point(300, 150), new window.cv.Scalar(255, 255, 255, 255), 1);
    
    window.cv.imshow(zoomCanvasRef.current, dst);
    roi.delete();
    dst.delete();
  };

  const handleClick = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    if (!imgMainRef.current || !window.cv) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Si aún no está calibrado, agregar puntos de calibración
    setRefPoints((prev) => {
      if (prev.length < 4) {
        const newPoints = [...prev, { x, y }];
        drawMarker(x, y, new window.cv.Scalar(0, 255, 0, 255), newPoints.length.toString());
        
        if (newPoints.length === 4) {
          setTimeout(() => calibrate(newPoints), 0);
        }
        return newPoints;
      }
      return prev;
    });
    
    // Si ya está calibrado, agregar puntos de medición
    if (isCalibrated) {
      setMeasurementPoints((prev) => {
        const newPoints = [...prev, { x, y }];
        drawMarker(x, y, new window.cv.Scalar(255, 0, 0, 255), '');
        
        if (newPoints.length % 2 === 0) {
          setTimeout(() => calculateDistance(newPoints), 0);
        }
        return newPoints;
      });
    }
  };

  const drawMarker = (x: number, y: number, color: any, text: string) => {
    if (!imgMainRef.current || !mainCanvasRef.current || !window.cv) return;
    
    window.cv.circle(imgMainRef.current, new window.cv.Point(x, y), 5, color, -1);
    if (text) {
      window.cv.putText(imgMainRef.current, text, new window.cv.Point(x, y - 10), 0, 0.8, color, 2);
    }
    window.cv.imshow(mainCanvasRef.current, imgMainRef.current);
  };

  const calibrate = (points: Point[]) => {
    if (!window.cv) return;
    
    const realW = parseFloat(prompt('רוחב מלבן (ס״מ):') || '0');
    const realH = parseFloat(prompt('אורך מלבן (ס״מ):') || '0');
    
    if (realW <= 0 || realH <= 0) {
      alert('יש להזין ערכים תקינים');
      setRefPoints([]);
      return;
    }
    
    // Limpiar matriz anterior si existe
    if (transformMatrixRef.current) {
      transformMatrixRef.current.delete();
    }
    
    const srcMat = window.cv.matFromArray(
      4,
      1,
      window.cv.CV_32FC2,
      points.flatMap((p) => [p.x, p.y])
    );
    
    const dstMat = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
      0, 0,
      realW, 0,
      realW, realH,
      0, realH,
    ]);
    
    const M = window.cv.getPerspectiveTransform(srcMat, dstMat);
    transformMatrixRef.current = M;
    setIsCalibrated(true);
    setStatus('הכיול הושלם! כעת תוכל למדוד מרחקים.');
    
    srcMat.delete();
    dstMat.delete();
  };

  const calculateDistance = (points: Point[]) => {
    if (!transformMatrixRef.current || !window.cv || points.length < 2) return;
    
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];
    
    const srcPts = window.cv.matFromArray(2, 1, window.cv.CV_32FC2, [
      p1.x, p1.y,
      p2.x, p2.y,
    ]);
    
    const dstPts = new window.cv.Mat();
    window.cv.perspectiveTransform(srcPts, dstPts, transformMatrixRef.current);
    
    const dist = Math.sqrt(
      Math.pow(dstPts.data32F[2] - dstPts.data32F[0], 2) +
      Math.pow(dstPts.data32F[3] - dstPts.data32F[1], 2)
    );
    
    alert(`מרחק: ${dist.toFixed(2)} ס"מ`);
    
    srcPts.delete();
    dstPts.delete();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  };

  const reset = () => {
    if (imgOriginalRef.current && imgMainRef.current && window.cv) {
      // Limpiar imagen actual
      imgMainRef.current.delete();
      // Clonar imagen original
      const imgM = imgOriginalRef.current.clone();
      imgMainRef.current = imgM;
      if (mainCanvasRef.current) {
        window.cv.imshow(mainCanvasRef.current, imgM);
      }
    }
    if (transformMatrixRef.current) {
      transformMatrixRef.current.delete();
      transformMatrixRef.current = null;
    }
    setRefPoints([]);
    setMeasurementPoints([]);
    setIsCalibrated(false);
    setStatus('מוכן. בחר 4 נקודות לכיול.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            כלי מדידה עם OpenCV
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="סגור חלון"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
              <p className="ml-3 text-slate-600">{status}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">{status}</p>
                  <p className="text-xs text-slate-500">
                    {!isCalibrated 
                      ? `נקודות כיול: ${refPoints.length}/4`
                      : `נקודות מדידה: ${measurementPoints.length}`
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                  >
                    טען תמונה
                  </button>
                  {imgOriginalRef.current && (
                    <button
                      onClick={reset}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
                    >
                      איפוס
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <canvas
                    ref={mainCanvasRef}
                    className="border border-slate-300 rounded-lg cursor-crosshair max-w-full"
                    style={{ maxHeight: '70vh' }}
                  />
                </div>
                <div className="flex-shrink-0">
                  <canvas
                    ref={zoomCanvasRef}
                    width="300"
                    height="300"
                    className="border border-slate-300 rounded-lg"
                  />
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    תצוגת זום
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-2 text-sm">הוראות:</h3>
                <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                  <li>טען תמונה של החדר או הסביבה</li>
                  <li>בחר 4 נקודות שיוצרות מלבן (למשל, פינה של שולחן או קיר)</li>
                  <li>הזן את הרוחב והאורך האמיתיים של המלבן בסנטימטרים</li>
                  <li>לאחר הכיול, לחץ על שתי נקודות למדידת המרחק ביניהן</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

